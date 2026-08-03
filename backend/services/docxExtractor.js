const fs = require('fs');
const path = require('path');
const { logError } = require('./errorLogger');
const AiContractParser = require('../AiContractParser');

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
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    logError('PDF_EXTRACT', err, { filePath });
    return '';
  }
}

async function parseDocumentItems(filePath, fileName, dDayStr) {
  let text = '';
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.docx') {
    text = await extractTextFromDocx(filePath);
  } else if (ext === '.pdf') {
    text = await extractTextFromPdf(filePath);
  } else if (['.txt', '.md'].includes(ext)) {
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

  const items = [];
  const rows = text ? text.split('===ROW===') : [];
  const seenKeys = new Set();
  const baseDDay = dDayStr ? new Date(dDayStr) : new Date('2026-09-01');

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
          id: `ext-${Date.now()}-${items.length + 1}`,
          title: title,
          date: isoDate,
          matchedDate: isoDate,
          dayOffset: dayOffset,
          originalText: snippet,
          contextSnippet: snippet,
          location: `第 ${idx + 1} 行`,
          owners: ['張小明 (PM)'],
          selected: true,
          confidence: 0.95
        });
      }
    }
  });

  if (items.length === 0) {
    const aiItems = await AiContractParser.parseWithLlm(text, fileName);
    items.push(...aiItems.map(item => ({
      ...item,
      date: item.matchedDate || '2026-06-30',
      owners: ['張小明 (PM)']
    })));
  }

  items.forEach(item => {
    if (!item.deliverables) {
      item.deliverables = [`${item.title} 文檔檔案`, '成果驗收清冊'];
    }
    if (!item.penaltyTerms) {
      item.penaltyTerms = '逾期每日按本案合約總價千分之一計罰違約金';
    }
    if (!item.clauseReference) {
      item.clauseReference = '參照標案需求說明書 (RFP) 履約規定';
    }
  });

  return items;
}

module.exports = {
  extractTextFromDocx,
  extractTextFromPdf,
  parseDocumentItems
};
