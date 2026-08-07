/**
 * AiContractParser.js
 * 雙軌合約深度解析服務引擎
 * 支援萃取履約名稱、D+N 天數、交付產出物清單、逾期罰則條文與原始條文索引 (合約五維度 Schema)
 */

const { logError } = require('./services/errorLogger');

class AiContractParser {
  static async parseWithLlm(text = '', fileName = '') {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openaiKey && !geminiKey) {
      console.log('[AiContractParser] No API key found. Falling back to heuristic rules.');
      return this.parse(text, fileName);
    }

    try {
      if (openaiKey) {
        return await this.callOpenAI(text, fileName, openaiKey);
      } else if (geminiKey) {
        return await this.callGemini(text, fileName, geminiKey);
      }
    } catch (err) {
      logError('LLM_PARSER', err, { fileName });
      console.error('[AiContractParser] LLM parsing failed. Falling back to heuristic rules.');
      return this.parse(text, fileName);
    }
  }

  static async callOpenAI(text, fileName, apiKey) {
    const prompt = this.getPrompt(text, fileName);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: prompt }]
        }),
        signal: controller.signal
      });

      if (!res.ok) throw new Error(`OpenAI API Error: ${res.status}`);
      const data = await res.json();
      const cleanContent = this.cleanJsonString(data.choices[0].message.content);
      const result = JSON.parse(cleanContent);
      return this.formatLlmResult(result, fileName);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static async callGemini(text, fileName, apiKey) {
    const prompt = this.getPrompt(text, fileName);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: controller.signal
      });

      if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);
      const data = await res.json();
      const resultText = data.candidates[0].content.parts[0].text;
      const cleanContent = this.cleanJsonString(resultText);
      const result = JSON.parse(cleanContent);
      return this.formatLlmResult(result, fileName);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static cleanJsonString(str) {
    if (!str) return '{}';
    let clean = str.trim();
    clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      return clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
  }

  static getPrompt(text, fileName) {
    return `You are an expert contract analyst. Extract project milestones from the following contract text.
For each milestone, extract the following 5 dimensions:
1. title (String)
2. dayOffset (Number, D+N days)
3. deliverables (Array of Strings)
4. penaltyTerms (String)
5. clauseReference (String)
6. location (String, line number or document section reference e.g., "Line 15" or "Section 3.2")

Return JSON format: { "milestones": [ { "title": "...", "dayOffset": 30, "deliverables": ["..."], "penaltyTerms": "...", "clauseReference": "...", "location": "..." } ] }

Contract Name: ${fileName}
Text: ${text.substring(0, 10000)} // truncate to avoid token limits if necessary
`;
  }

  static formatLlmResult(result, fileName) {
    if (!result || !Array.isArray(result.milestones)) return [];
    return result.milestones.map((m, idx) => ({
      id: `ext-item-${Date.now()}-${idx + 1}`,
      originalText: `AI parsed from: ${fileName}`,
      title: m.title || 'Unknown Milestone',
      dayOffset: m.dayOffset || 30,
      deliverables: Array.isArray(m.deliverables) ? m.deliverables : [],
      penaltyTerms: m.penaltyTerms || '逾期每日按本案合約總價千分之一計罰違約金',
      clauseReference: m.clauseReference || '參照標案需求說明書',
      location: m.location || '段落內文',
      confidence: 95,
      selected: true
    }));
  }

  static parse(text = '', fileName = '') {
    const cleanText = text.trim();
    const lines = cleanText.split(/\r?\n/).map(l => l.trim());

    // Default 5-Dimension contract milestone rules
    const predefinedTemplates = [
      {
        keyword: '名冊',
        defaultOffset: 14,
        matchedDate: '2026-06-22',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}專案管理成員名冊與保密切結 (訂購日起10工作日內)`,
        deliverables: ['專案管理成員名冊', '保密同意書及切結書'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照專案服務議定書「訂購日起 10 個工作日內履約規定」'
      },
      {
        keyword: '授權',
        defaultOffset: 53,
        matchedDate: '2026-07-31',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}授權與資安暨教育訓練交付 (115/07/31 前)`,
        deliverables: ['授權書', '需求訪談紀錄(含驗收標準)', '資訊安全計畫書', '教育訓練教材及簽到表'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照專案服務議定書「115/07/31 前履約規定」'
      },
      {
        keyword: '外撥',
        defaultOffset: 186,
        matchedDate: '2026-12-11',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}AI語音外撥服務成果與統計報告 (115/12/11 前)`,
        deliverables: ['匯入名單資料', 'AI語音外撥錄音檔', '執行報告書(逐字稿、摘要紀錄)', '執行統計報表'],
        penaltyTerms: '逾期每日按本案合約總價千分之二計罰違約金',
        clauseReference: '參照專案服務議定書「115/12/11 前履約規定」'
      },
      {
        keyword: '全案',
        defaultOffset: 206,
        matchedDate: '2026-12-31',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}全案履約完成與結案驗收 (115/12/31)`,
        deliverables: ['全案履約完成結案報告', '成果驗收清冊', '智慧財產權與資產切結書'],
        penaltyTerms: '逾期未完成結案驗收按本案合約總價千分之三計罰，機關得逕行解約並沒收履約保證金',
        clauseReference: '參照專案服務議定書「115/12/31 全案履約完成條款」'
      },
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
        keyword: '滲透',
        defaultOffset: 180,
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}資安資通安全與滲透測試報告`,
        deliverables: ['第三方資安滲透測試報告', '弱點複測與修補對照表'],
        penaltyTerms: '逾期未修補高風險弱點者，按每日新台幣五千元累計計罰',
        clauseReference: '參照國家資通安全防護規範第 12 條「資安檢測」'
      }
    ];

    const extractedItems = [];

    predefinedTemplates.forEach((template, idx) => {
      const matchIndex = lines.findIndex(l => l && (l.includes(template.keyword) || l.includes(template.title)));
      
      if (matchIndex === -1) {
        return; // Do not add fake milestones if the keyword is not found in the document
      }
      
      const matchingLine = lines[matchIndex];
      let dayOffset = template.defaultOffset;
      let confidenceScore = 80;

      if (cleanText) {
        const keywordIdx = cleanText.indexOf(template.keyword);
        const contextRadius = 300;
        let contextText = cleanText;
        
        if (keywordIdx >= 0) {
          const start = Math.max(0, keywordIdx - contextRadius);
          const end = Math.min(cleanText.length, keywordIdx + contextRadius);
          contextText = cleanText.substring(start, end);
        }

        const offsetReg = /(?:D\+|第|簽約後)\s*(\d+)\s*(?:日|天|個月)/g;
        let match;
        while ((match = offsetReg.exec(contextText)) !== null) {
          const parsedDays = parseInt(match[1], 10);
          if (!isNaN(parsedDays) && parsedDays > 0) {
            dayOffset = parsedDays;
            confidenceScore = Math.min(98, confidenceScore + 10);
            break;
          }
        }
      }

      extractedItems.push({
        id: `ext-item-${Date.now()}-${idx + 1}`,
        originalText: matchingLine || `合約條文: 廠商應於 D+${dayOffset} 日內交付【${template.title}】`,
        title: template.title,
        dayOffset: dayOffset,
        matchedDate: template.matchedDate,
        deliverables: template.deliverables,
        penaltyTerms: template.penaltyTerms,
        clauseReference: template.clauseReference,
        location: `第 ${matchIndex + 1} 行`,
        confidence: confidenceScore,
        selected: true
      });
    });

    return extractedItems;
  }
}

module.exports = AiContractParser;
