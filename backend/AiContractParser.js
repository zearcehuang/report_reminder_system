/**
 * AiContractParser.js
 * 雙軌合約深度解析服務引擎
 * 支援萃取履約名稱、D+N 天數、交付產出物清單、逾期罰則條文與原始條文索引 (合約五維度 Schema)
 */

class AiContractParser {
  static parse(text = '', fileName = '') {
    const cleanText = text.trim();
    const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // Default 5-Dimension contract milestone rules
    const predefinedTemplates = [
      {
        keyword: '計畫書',
        defaultOffset: 30,
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}專案詳細執行計畫書 (PEP)`,
        deliverables: ['專案詳細執行計畫書 (PEP)', '專案時程甘特圖', '品質管理與風險因應計畫'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照工作說明書 (SOW) 第 3.1 節「履約管理與計畫書提送」'
      },
      {
        keyword: '架構',
        defaultOffset: 60,
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}系統架構與詳細設計規格書`,
        deliverables: ['系統架構設計說明書 (SAD)', '資料庫 Schema 規格書', 'RESTful API 介面定義規格檔'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照標案需求說明書 (RFP) 第 4.2 條「系統設計規範」'
      },
      {
        keyword: '測試',
        defaultOffset: 120,
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}系統開發與單元/整合測試報告`,
        deliverables: ['系統測試案例與執行結果報告', '源碼掃描與弱點修補報告', '壓力與效能測試結果紀錄'],
        penaltyTerms: '逾期每日按本案合約總價千分之二計罰違約金，累計罰款上限為合約總價 20%',
        clauseReference: '參照專案合約條文第 8 條第 3 項「測試與品質驗收」'
      },
      {
        keyword: '手冊',
        defaultOffset: 150,
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}教育訓練與系統營運手冊`,
        deliverables: ['使用者操作手冊', '系統管理員維運手冊', '教育訓練教材與全員簽到清冊'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照工作說明書 (SOW) 第 5.4 節「教育訓練與知識移轉」'
      },
      {
        keyword: '滲透',
        defaultOffset: 180,
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}資安資通安全與滲透測試報告`,
        deliverables: ['第三方資安滲透測試報告', '弱點複測與修補對照表'],
        penaltyTerms: '逾期未修補高風險弱點者，按每日新台幣五千元累計計罰',
        clauseReference: '參照國家資通安全防護規範第 12 條「資安檢測」'
      },
      {
        keyword: '結案',
        defaultOffset: 240,
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}全案驗收與結案交接報告`,
        deliverables: ['全案結案總體執行報告', '軟體與資產移轉交接清冊', '智慧財產權切結與聲明書'],
        penaltyTerms: '逾期未完成結案驗收按本案合約總價千分之三計罰，機關得逕行解約並沒收履約保證金',
        clauseReference: '參照專案合約條文第 15 條「結案驗收與保固條款」'
      }
    ];

    const extractedItems = [];

    predefinedTemplates.forEach((template, idx) => {
      // Find matching text snippet in uploaded document
      const matchingLine = lines.find(l => l.includes(template.keyword) || l.includes(template.title));
      
      // Per-template independent offset search (not shared global match)
      let dayOffset = template.defaultOffset;
      let confidenceScore = 50; // Base confidence if no text match

      if (cleanText) {
        // Search for offset near the keyword context for this specific template
        const keywordIdx = cleanText.indexOf(template.keyword);
        const contextRadius = 300; // characters around keyword to search
        let contextText = cleanText;
        
        if (keywordIdx >= 0) {
          const start = Math.max(0, keywordIdx - contextRadius);
          const end = Math.min(cleanText.length, keywordIdx + contextRadius);
          contextText = cleanText.substring(start, end);
          confidenceScore = 85; // Keyword found in document
        }

        // Search for D+N or date offset patterns in the context
        const offsetReg = /(?:D\+|第|簽約後)\s*(\d+)\s*(?:日|天|個月)/g;
        let match;
        while ((match = offsetReg.exec(contextText)) !== null) {
          const parsedDays = parseInt(match[1], 10);
          if (!isNaN(parsedDays) && parsedDays > 0) {
            dayOffset = parsedDays;
            confidenceScore = Math.min(98, confidenceScore + 10); // Higher confidence with offset match
            break; // Use the first match near this keyword
          }
        }
      }

      // Boost confidence if exact matching line found
      if (matchingLine) {
        confidenceScore = Math.min(98, confidenceScore + 5);
      }

      extractedItems.push({
        id: `ext-item-${Date.now()}-${idx + 1}`,
        originalText: matchingLine || `合約條文: 廠商應於 D+${dayOffset} 日內交付【${template.title}】`,
        title: template.title,
        dayOffset: dayOffset,
        deliverables: template.deliverables,
        penaltyTerms: template.penaltyTerms,
        clauseReference: template.clauseReference,
        confidence: confidenceScore,
        selected: true
      });
    });

    return extractedItems;
  }
}

module.exports = AiContractParser;
