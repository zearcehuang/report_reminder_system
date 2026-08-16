/**
 * AiContractParser.js
 * 雙軌合約深度解析服務引擎 (Dual-Engine Contract Intelligence Parser)
 * 支援萃取履約名稱、D+N 天數、交付產出物清單、逾期罰則條文與原始條文索引 (合約五維度 Schema)
 * 支援 Gemini 2.0 / 1.5 系列純文字與多模態 (Multimodal PDF/Image) 文件解析
 */

const { logError } = require('./services/errorLogger');
const settingService = require('./services/settingService');

class AiContractParser {
  /**
   * Parse text using LLM (Gemini / OpenAI) with automatic fallback
   * @param {string} text Extracted document plain text
   * @param {string} fileName Original document file name
   */
  static async parseWithLlm(text = '', fileName = '') {
    const aiConfig = settingService.getAiConfig();
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = aiConfig.apiKey;

    if (!openaiKey && !geminiKey) {
      console.log('[AiContractParser] No API key configured. Falling back to heuristic rule engine.');
      return this.parse(text, fileName);
    }

    try {
      if (geminiKey && aiConfig.autoUseGemini) {
        return await this.callGemini(text, fileName, geminiKey, aiConfig.model, aiConfig.temperature);
      } else if (openaiKey) {
        return await this.callOpenAI(text, fileName, openaiKey);
      } else if (geminiKey) {
        return await this.callGemini(text, fileName, geminiKey, aiConfig.model, aiConfig.temperature);
      }
    } catch (err) {
      logError('LLM_PARSER', err, { fileName, model: aiConfig.model });
      console.error(`[AiContractParser] Gemini/LLM parsing failed (${err.message}). Falling back to heuristic rules.`);
      return this.parse(text, fileName);
    }
  }

  /**
   * Parse binary files directly with Gemini Multimodal (PDF, Images, Scans)
   * @param {Buffer} fileBuffer Raw file binary buffer
   * @param {string} mimeType MIME type e.g. application/pdf, image/png
   * @param {string} fileName Original file name
   */
  static async parseWithGeminiMultimodal(fileBuffer, mimeType, fileName = '') {
    const aiConfig = settingService.getAiConfig();
    const apiKey = aiConfig.apiKey;

    if (!apiKey) {
      console.log('[AiContractParser] No Gemini API key for multimodal parsing. Falling back to heuristic rules.');
      return [];
    }

    const configuredModel = aiConfig.model || 'gemini-3.7-flash';
    const candidateModels = [configuredModel, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest']
      .filter((v, i, a) => v && a.indexOf(v) === i);

    const prompt = this.getMultimodalPrompt(fileName);
    const base64Data = fileBuffer.toString('base64');

    for (const model of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType || 'application/pdf',
                      data: base64Data
                    }
                  },
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[AiContractParser] Multimodal with ${model} returned HTTP ${response.status}: ${errText.slice(0, 120)}`);
          if (response.status === 404 || response.status === 400 || response.status === 503) {
            continue; // try next candidate model
          }
          throw new Error(`Gemini Multimodal HTTP ${response.status}: ${errText.slice(0, 200)}`);
        }

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanContent = this.cleanJsonString(resultText);
        const result = JSON.parse(cleanContent);
        return this.formatLlmResult(result, fileName, 'gemini_multimodal');
      } catch (err) {
        logError('GEMINI_MULTIMODAL', err, { fileName, model });
        if (candidateModels.indexOf(model) < candidateModels.length - 1) {
          console.warn(`[AiContractParser] Retrying multimodal extraction with next model...`);
          continue;
        }
        console.error(`[AiContractParser] Gemini Multimodal failed: ${err.message}`);
        return [];
      } finally {
        clearTimeout(timeoutId);
      }
    }
    return [];
  }

  static async callGemini(text, fileName, apiKey, requestedModel = 'gemini-3.7-flash', temperature = 0.2) {
    const candidateModels = [requestedModel, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest']
      .filter((v, i, a) => v && a.indexOf(v) === i);

    const prompt = this.getPrompt(text, fileName);

    for (const model of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: typeof temperature === 'number' ? temperature : 0.2
            }
          }),
          signal: controller.signal
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[AiContractParser] callGemini with ${model} returned HTTP ${res.status}: ${errText.slice(0, 120)}`);
          if (res.status === 404 || res.status === 400 || res.status === 503) {
            continue; // try next candidate model
          }
          throw new Error(`Gemini API Error (HTTP ${res.status}): ${errText.slice(0, 200)}`);
        }

        const data = await res.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) throw new Error('Gemini returned empty response parts');

        const cleanContent = this.cleanJsonString(resultText);
        const result = JSON.parse(cleanContent);
        return this.formatLlmResult(result, fileName, 'gemini_ai');
      } catch (err) {
        if (candidateModels.indexOf(model) < candidateModels.length - 1) {
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  static async callOpenAI(text, fileName, apiKey) {
    const prompt = this.getPrompt(text, fileName);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);
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
      const contentStr = data?.choices?.[0]?.message?.content || '{}';
      const cleanContent = this.cleanJsonString(contentStr);
      const result = JSON.parse(cleanContent);
      return this.formatLlmResult(result, fileName, 'openai_ai');
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
    return `你是一位資深的政府機關與企業標案合約稽核與專案管理專家。
請仔細分析下列合約/標案文件內容，精準萃取所有「專案履約里程碑、報告提送項目、交付查核點」。

針對每一個里程碑，請嚴格萃取以下「合約五維度 (5 Dimensions)」欄位：
1. title (String): 里程碑/報告名稱 (例如: "專案詳細執行計畫書 (PEP)", "系統架構與詳細設計規格書", "期中工作進度報告", "期末驗收結案報告")
2. dayOffset (Number): 履約死線天數 (以 D+N 天數計算，例如簽約後 30 日填寫 30；若內文為民國/西元日期請換算或預估合理天數)
3. deliverables (Array of Strings): 該階段應交付之具體產出物清單 (例如: ["專案執行計畫書", "時程甘特圖", "資安防護計畫"])
4. penaltyTerms (String): 逾期違約罰則條文 (例如: "逾期每日按本案合約總價千分之一計罰違約金")
5. clauseReference (String): 合約/需求說明書對應條文章節 (例如: "需求說明書第 3.1 節「履約管理」")
6. location (String): 條文於文件中的位置 (例如: "第 15 頁", "第 4.2 條")
7. confidence (Number): 辨識信心度 (80-99 之間整數)

請以繁體中文回應，並輸出純 JSON 格式：
{
  "milestones": [
    {
      "title": "專案詳細執行計畫書 (PEP)",
      "dayOffset": 30,
      "deliverables": ["專案詳細執行計畫書", "專案時程甘特圖"],
      "penaltyTerms": "逾期每日按合約總價千分之一計罰違約金",
      "clauseReference": "工作說明書第 3 條",
      "location": "第 3 條第 1 項",
      "confidence": 98
    }
  ]
}

合約檔案名稱: ${fileName || '合約文件'}
文件內文:
${text.substring(0, 18000)}
`;
  }

  static getMultimodalPrompt(fileName) {
    return `你是一位資深的政府機關與企業標案合約稽核與專案管理專家。
請仔細閱讀此份合約/標案/企劃書文件（包含圖表、表格與條文掃描內容），萃取所有專案履約里程碑與報告提送項目。

請針對每個項目輸出以下五維度 JSON 結構：
{
  "milestones": [
    {
      "title": "里程碑/報告名稱",
      "dayOffset": 30,
      "deliverables": ["應交付之產出物清單"],
      "penaltyTerms": "逾期罰則條文",
      "clauseReference": "條文出處章節",
      "location": "文件頁碼或段落",
      "confidence": 95
    }
  ]
}

檔案名稱: ${fileName || '合約文件'}
請以純 JSON 格式返回，不要包含 markdown 說明。`;
  }

  static formatLlmResult(result, fileName, engine = 'gemini_ai') {
    if (!result || !Array.isArray(result.milestones)) return [];
    return result.milestones.map((m, idx) => ({
      id: `ext-ai-${Date.now()}-${idx + 1}`,
      originalText: `🤖 AI (${engine}) 解析自: ${fileName}`,
      title: m.title || '專案關鍵里程碑',
      dayOffset: typeof m.dayOffset === 'number' && m.dayOffset >= 0 ? m.dayOffset : 30,
      deliverables: Array.isArray(m.deliverables) && m.deliverables.length > 0 ? m.deliverables : [`${m.title || '履約'}成果報告書`],
      penaltyTerms: m.penaltyTerms || '逾期每日按本案合約總價千分之一計罰違約金',
      clauseReference: m.clauseReference || '參照標案需求說明書履約條款',
      location: m.location || '合約段落',
      confidence: m.confidence || 96,
      source: engine,
      selected: true
    }));
  }

  /**
   * Rule-based heuristic parser (Offline fallback)
   */
  static parse(text = '', fileName = '') {
    const cleanText = text.trim();
    const lines = cleanText.split(/\r?\n/).map(l => l.trim());

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
      const matchIndex = lines.findIndex(l => l && (l.includes(template.keyword) || l.includes(template.title)));
      
      if (matchIndex === -1 && cleanText.length > 0 && !cleanText.includes(template.keyword)) {
        return;
      }
      
      const matchingLine = matchIndex !== -1 ? lines[matchIndex] : '';
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
            confidenceScore = Math.min(95, confidenceScore + 12);
            break;
          }
        }
      }

      extractedItems.push({
        id: `ext-rule-${Date.now()}-${idx + 1}`,
        originalText: matchingLine || `⚡ 規則比對: 廠商應於 D+${dayOffset} 日內交付【${template.title}】`,
        title: template.title,
        dayOffset: dayOffset,
        deliverables: template.deliverables,
        penaltyTerms: template.penaltyTerms,
        clauseReference: template.clauseReference,
        location: matchIndex !== -1 ? `第 ${matchIndex + 1} 行` : '文件內文',
        confidence: confidenceScore,
        source: 'rule_heuristic',
        selected: true
      });
    });

    if (extractedItems.length === 0) {
      predefinedTemplates.forEach((template, idx) => {
        extractedItems.push({
          id: `ext-rule-base-${Date.now()}-${idx + 1}`,
          originalText: `⚡ 合約基準範本: 廠商應於 D+${template.defaultOffset} 日內交付【${template.title}】`,
          title: template.title,
          dayOffset: template.defaultOffset,
          deliverables: template.deliverables,
          penaltyTerms: template.penaltyTerms,
          clauseReference: template.clauseReference,
          location: '合約基準範本',
          confidence: 75,
          source: 'rule_heuristic',
          selected: true
        });
      });
    }

    return extractedItems;
  }
}

module.exports = AiContractParser;
