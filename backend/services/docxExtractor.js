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
    let extractedText = '';
    if (typeof pdfParse === 'function') {
      const data = await pdfParse(dataBuffer);
      extractedText = data.text || '';
    } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
      const parser = new pdfParse.PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      extractedText = data.text || '';
    } else if (pdfParse && typeof pdfParse.default === 'function') {
      const data = await pdfParse.default(dataBuffer);
      extractedText = data.text || '';
    }
    return extractedText;
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
  const rows = text ? (text.includes('===ROW===') ? text.split('===ROW===') : text.split(/\r?\n/)) : [];
  const seenKeys = new Set();
  const baseDDay = dDayStr ? new Date(dDayStr) : new Date('2026-06-08');

  rows.forEach((rowStr, idx) => {
    const trimRow = rowStr.trim();
    if (!trimRow) return;

    if (trimRow.includes('會議時間') || trimRow.includes('時間：') || trimRow.includes('會議地點') || trimRow.includes('地點：') || trimRow.includes('出席單位') || trimRow.includes('簽到') || trimRow.includes('散會') || trimRow.includes('台北通') || trimRow.includes('主席：') || trimRow.includes('紀錄：')) {
      return;
    }

    const rocMatch = trimRow.match(/(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
    const westMatch = trimRow.match(/(20\d{2})\s*[\/\-\.年]\s*(\d{1,2})\s*[\/\-\.月]\s*(\d{1,2})\s*日?/);
    const allShortDates = [...trimRow.matchAll(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)];

    let year = null, month = null, day = null;
    if (allShortDates.length > 0 && (trimRow.includes('完成') || trimRow.includes('測試') || trimRow.includes('訓練') || trimRow.includes('啟用') || trimRow.includes('提供') || trimRow.includes('訂定') || trimRow.includes('報告') || trimRow.includes('召開') || trimRow.includes('申請') || trimRow.includes('線路'))) {
      const lastMatch = allShortDates[allShortDates.length - 1];
      year = baseDDay.getFullYear();
      month = String(lastMatch[1]).padStart(2, '0');
      day = String(lastMatch[2]).padStart(2, '0');
    } else if (rocMatch) {
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
        title = trimRow.replace(/\[CELL\]/g, ' ').replace(/(\d{2,3}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日?|20\d{2}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}\s*月\s*\d{1,2}\s*日)/g, '').trim();
      }

      title = title.replace(/^[\d\s\.\,\:\(\)\-\#一二三四五六七八九十]+/g, '').trim();

      if (title.includes('線路') || (title.includes('通訊') && title.includes('測試'))) title = '通訊線路申請裝設與測試';
      else if (title.includes('功能測試') || title.includes('系統功能')) title = '系統功能測試與問題修復';
      else if (title.includes('教育訓練') || title.includes('操作手冊')) title = '辦理教育訓練與提供操作手冊';
      else if (title.includes('啟用') && title.includes('服務')) title = '正式啟用專案服務';
      else if (title.includes('報表') || title.includes('格式')) title = '提供報表格式初版';
      else if (title.includes('名單') || title.includes('異動')) title = '訂定名單上傳截止時間與異動規則';
      else if (title.includes('下訂') || title.includes('履約')) title = '專案下訂與履約簽約';
      else if (title.includes('成效') || title.includes('評估')) title = '整體執行成效與續辦評估會議';
      
      title = title.replace(/^[至與前於在完成辦理請應自止期末項次]*[：\:\s,]*/g, '').trim();

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
    items.push(...aiItems.map(item => {
      const offsetDays = typeof item.dayOffset === 'number' ? item.dayOffset : 30;
      const targetDate = new Date(baseDDay.getTime() + offsetDays * 24 * 60 * 60 * 1000);
      const isoDate = targetDate.toISOString().split('T')[0];
      return {
        ...item,
        date: item.matchedDate || isoDate,
        matchedDate: item.matchedDate || isoDate,
        dayOffset: offsetDays,
        owners: ['張小明 (PM)']
      };
    }));
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
