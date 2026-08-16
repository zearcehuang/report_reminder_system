const fs = require('fs');
const path = require('path');
const { logError } = require('./errorLogger');
const AiContractParser = require('../AiContractParser');
const settingService = require('./settingService');

// Dynamic import for pdf-parse
let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse module not found, PDF extraction may be degraded.');
}

function extractTextFromDocx(filePath) {
  return new Promise((resolve) => {
    let tempZip = '';
    let destDir = '';
    try {
      tempZip = filePath + '_' + Date.now() + '.zip';
      fs.copyFileSync(filePath, tempZip);
      destDir = path.join(path.dirname(filePath), 'temp_unzip_' + Date.now());
      const psCmd = `powershell -Command "Expand-Archive -Path '${tempZip.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`;
      
      require('child_process').exec(psCmd, { timeout: 30000 }, (error) => {
        try {
          if (error) {
            logError('DOCX_EXTRACT', error, { filePath });
            resolve('');
            return;
          }
          
          const docXmlPath = path.join(destDir, 'word', 'document.xml');
          let xml = '';
          if (fs.existsSync(docXmlPath)) {
            xml = fs.readFileSync(docXmlPath, 'utf8');
          }
          
          resolve(xml
            .replace(/<\/w:p>/g, '\n')
            .replace(/<\/w:tr>/g, '\n===ROW===\n')
            .replace(/<\/w:tc>/g, ' [CELL] ')
            .replace(/<[^>]+>/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"'));
        } finally {
          try {
            if (tempZip) fs.rmSync(tempZip, { force: true });
            if (destDir) fs.rmSync(destDir, { recursive: true, force: true });
          } catch (e) {}
        }
      });
    } catch (err) {
      logError('DOCX_EXTRACT', err, { filePath });
      try {
        if (tempZip) fs.rmSync(tempZip, { force: true });
        if (destDir) fs.rmSync(destDir, { recursive: true, force: true });
      } catch (e) {}
      resolve('');
    }
  });
}

async function extractTextFromPdf(filePath) {
  if (!pdfParse) return '';
  try {
    const dataBuffer = fs.readFileSync(filePath);
    if (typeof pdfParse === 'function') {
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } else if (pdfParse.PDFParse) {
      const parser = new pdfParse.PDFParse({ data: dataBuffer, verbosity: 0 });
      const data = await parser.getText();
      return data.text || '';
    }
    return '';
  } catch (err) {
    logError('PDF_EXTRACT', err, { filePath });
    return '';
  }
}

/**
 * Format target date by adding dayOffset to base D-Day
 */
function calculateTargetDate(baseDDay, dayOffset) {
  const target = new Date(baseDDay.getTime());
  target.setDate(target.getDate() + (dayOffset || 0));
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function parseDocumentItems(filePath, fileName, dDayStr) {
  let text = '';
  const ext = path.extname(fileName || filePath).toLowerCase();

  if (ext === '.docx') {
    text = await extractTextFromDocx(filePath);
  } else if (ext === '.pdf') {
    text = await extractTextFromPdf(filePath);
  } else if (['.txt', '.md', '.json'].includes(ext)) {
    try {
      if (fs.existsSync(filePath)) {
        text = fs.readFileSync(filePath, 'utf8');
      }
    } catch (e) {
      logError('PARSE_DOC', e, { filePath, fileName });
    }
  } else {
    try {
      if (fs.existsSync(filePath)) {
        text = fs.readFileSync(filePath, 'utf8');
      }
    } catch (e) {
      logError('PARSE_DOC', e, { filePath, fileName });
    }
  }

  const baseDDay = dDayStr ? new Date(dDayStr) : new Date('2026-09-01');
  const aiConfig = settingService.getAiConfig();
  let items = [];

  // 1. PRIMARY STRATEGY: Gemini AI Deep Extraction (if API key configured & autoUseGemini enabled)
  if (aiConfig.hasApiKey && aiConfig.autoUseGemini) {
    try {
      if (text && text.trim().length > 30) {
        // Text-based extraction with Gemini
        const aiItems = await AiContractParser.parseWithLlm(text, fileName);
        if (aiItems && aiItems.length > 0) {
          items = aiItems.map(item => ({
            ...item,
            date: item.date || calculateTargetDate(baseDDay, item.dayOffset),
            matchedDate: item.matchedDate || calculateTargetDate(baseDDay, item.dayOffset),
            owners: ['張小明 (PM)'],
            source: item.source || 'gemini_ai'
          }));
        }
      } else if (ext === '.pdf' || ['.png', '.jpg', '.jpeg'].includes(ext)) {
        // Scanned document or image / Multimodal Gemini Extraction
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const mimeType = ext === '.pdf' ? 'application/pdf' : `image/${ext.replace('.', '')}`;
          const mmItems = await AiContractParser.parseWithGeminiMultimodal(fileBuffer, mimeType, fileName);
          if (mmItems && mmItems.length > 0) {
            items = mmItems.map(item => ({
              ...item,
              date: item.date || calculateTargetDate(baseDDay, item.dayOffset),
              matchedDate: item.matchedDate || calculateTargetDate(baseDDay, item.dayOffset),
              owners: ['張小明 (PM)'],
              source: 'gemini_multimodal'
            }));
          }
        }
      }
    } catch (aiErr) {
      logError('AI_DOC_EXTRACTION_ERR', aiErr, { fileName });
      console.warn(`[docxExtractor] Gemini AI extraction failed (${aiErr.message}), falling back to regex parser.`);
    }
  }

  // 2. FALLBACK STRATEGY: Heuristic Table & Regex Pattern Parser
  if (items.length === 0 && text) {
    const rows = text.split('===ROW===');
    const seenKeys = new Set();

    rows.forEach((rowStr, idx) => {
      const trimRow = rowStr.trim();
      if (!trimRow) return;

      const rocMatch = trimRow.match(/(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
      const westMatch = trimRow.match(/(20\d{2})\s*[\/\-\.年]\s*(\d{1,2})\s*[\/\-\.月]\s*(\d{1,2})\s*日?/);

      let year = null, month = null, day = null;
      if (rocMatch) {
        const rocY = parseInt(rocMatch[1], 10);
        year = rocY < 1900 ? rocY + 1911 : rocY;
        month = String(rocMatch[2]).padStart(2, '0');
        day = String(rocMatch[3]).padStart(2, '0');
      } else if (westMatch) {
        year = parseInt(westMatch[1], 10);
        month = String(westMatch[2]).padStart(2, '0');
        day = String(westMatch[3]).padStart(2, '0');
      }

      if (year && month && day) {
        const isoDate = `${year}-${month}-${day}`;
        const itemDate = new Date(isoDate);
        const diffDays = Math.round((itemDate.getTime() - baseDDay.getTime()) / (1000 * 3600 * 24));
        const dayOffset = isNaN(diffDays) ? (items.length + 1) * 30 : Math.max(0, diffDays);

        const cells = trimRow.split('[CELL]').map(c => c.replace(/\[CELL\]/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);

        let title = '';
        if (cells.length >= 2) {
          const milestoneCell = cells.find(c => c.length > 1 && c.length < 35 && c.match(/(計畫|報告|驗收|測試|結案|維護|期中|期末|會議)/));
          if (milestoneCell) {
            title = milestoneCell;
          } else {
            const cleanCells = cells.filter(c => !c.match(/^[\d\.\s]+$/) && !c.match(/(\d{2,3}\s*年|\d{4}\s*[\/\-\.])/));
            if (cleanCells.length > 0) {
              title = cleanCells[0];
            }
          }
        }

        if (!title) {
          title = trimRow.replace(/\[CELL\]/g, ' ').replace(/(\d{2,3}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日?|20\d{2}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/, '').trim();
        }

        title = title.replace(/^[\d\s\.\,\:\(\)\-\#]+/, '').trim();
        if (title.includes('評分重點') || title.includes('評選') || title.includes('對照表') || title.includes('中華民國') || title.includes('企劃書') || title.length < 2) {
          return;
        }

        if (title.length > 40) {
          title = title.slice(0, 38) + '...';
        }

        const key = `${isoDate}-${title}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const snippet = trimRow.replace(/\[CELL\]/g, ' ').replace(/\s+/g, ' ').slice(0, 120);
          items.push({
            id: `ext-regex-${Date.now()}-${items.length + 1}`,
            title: title,
            date: isoDate,
            matchedDate: isoDate,
            dayOffset: dayOffset,
            originalText: snippet,
            contextSnippet: snippet,
            location: `第 ${idx + 1} 行`,
            owners: ['張小明 (PM)'],
            selected: true,
            source: 'rule_heuristic',
            confidence: 88
          });
        }
      }
    });
  }

  // 3. FINAL FALLBACK: Template-based keyword matching if still 0 items
  if (items.length === 0) {
    const templateItems = AiContractParser.parse(text, fileName);
    items.push(...templateItems.map(item => ({
      ...item,
      date: calculateTargetDate(baseDDay, item.dayOffset),
      matchedDate: calculateTargetDate(baseDDay, item.dayOffset),
      owners: ['張小明 (PM)'],
      source: 'rule_heuristic'
    })));
  }

  // Ensure default values for 5-dimension contract structure
  items.forEach(item => {
    if (!item.deliverables || item.deliverables.length === 0) {
      item.deliverables = [`${item.title} 文檔檔案`, '成果驗收清冊'];
    }
    if (!item.penaltyTerms) {
      item.penaltyTerms = '逾期每日按本案合約總價千分之一計罰違約金';
    }
    if (!item.clauseReference) {
      item.clauseReference = '參照標案需求說明書 (RFP) 履約規定';
    }
    if (!item.location) {
      item.location = '合約條文段落';
    }
  });

  return items;
}

module.exports = {
  extractTextFromDocx,
  extractTextFromPdf,
  parseDocumentItems
};
