/**
 * AiContractParser.js
 * 雙軌合約深度解析服務引擎 (Dual-Engine Contract Intelligence Parser)
 * 支援萃取履約名稱、D+N 天數、交付產出物清單、逾期罰則條文與原始條文索引 (合約五維度 Schema)
 * 支援 Gemini 2.5 / 3.x 系列 Structured Outputs (JSON Schema)、長文件智慧章節分塊合併 (Chunking & Map-Reduce)
 */

const { logError } = require('./services/errorLogger');
const settingService = require('./services/settingService');

/**
 * Official JSON Schema for Gemini Structured Output
 */
const CONTRACT_MILESTONES_SCHEMA = {
  type: 'object',
  properties: {
    contractSummary: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: '標案或專案名稱' },
        contractor: { type: 'string', description: '得標廠商/承包單位' },
        client: { type: 'string', description: '招標機關/業主' },
        signingDate: { type: 'string', description: '決標日或簽約日 (YYYY-MM-DD)' },
        estimatedDurationDays: { type: 'integer', description: '全案總履約天數' }
      }
    },
    milestones: {
      type: 'array',
      description: '所有履約查核點、報告提送項目與交付驗收里程碑清單',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '里程碑/報告/交付名稱' },
          stage: {
            type: 'string',
            enum: ['啟動籌備', '需求分析', '系統設計', '系統開發', '期中審查', '測試驗收', '期末結案', '維護保固', '定期進度報告'],
            description: '專案履約所屬階段'
          },
          dayOffset: { type: 'integer', description: '自決標/簽約日 (D-Day) 起算之履約天數 (D+N)' },
          dayType: {
            type: 'string',
            enum: ['calendar', 'workday'],
            description: '天數類型：calendar (日曆天) 或 workday (工作天)'
          },
          matchedDate: { type: 'string', description: '合約內明載之特定西元日期 (YYYY-MM-DD) 或空字串' },
          deliverables: {
            type: 'array',
            items: { type: 'string' },
            description: '此階段應提送之具體文件、成果物或清冊清單'
          },
          penaltyTerms: { type: 'string', description: '此階段對應之逾期違約罰則或扣款規定' },
          clauseReference: { type: 'string', description: '合約/需求說明書之對應條文章節出處 (例如: 契約第 7 條第 2 款)' },
          location: { type: 'string', description: '條文或表格於文件中的位置 (例如: 第 8 頁或第 3.2 節)' },
          confidence: { type: 'integer', description: '辨識信心指數 (70-100)' }
        },
        required: ['title', 'dayOffset', 'deliverables', 'penaltyTerms', 'clauseReference']
      }
    }
  },
  required: ['milestones']
};

class AiContractParser {
  /**
   * Parse text using LLM (Gemini / OpenAI) with automatic fallback & chunking
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
   * Split long document text by logical contract sections & sliding windows
   * @param {string} text Raw text
   * @param {number} maxChunkSize Max characters per chunk (default 12000)
   * @param {number} overlap Overlap characters between chunks (default 1000)
   * @returns {string[]} Array of chunked text
   */
  static chunkTextBySections(text = '', maxChunkSize = 12000, overlap = 1000) {
    if (!text || text.length <= maxChunkSize) {
      return [text || ''];
    }

    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = startIndex + maxChunkSize;
      if (endIndex >= text.length) {
        chunks.push(text.substring(startIndex).trim());
        break;
      }

      // Try to break at a clean article / section boundary within the last 1500 chars of chunk
      const searchWindow = text.substring(Math.max(startIndex, endIndex - 1500), endIndex);
      const articleBreakMatch = searchWindow.search(/\n(?=(第[一二三四五六七八九十百0-9]+[條節章點]|【|\d+\.\d+|\n))/);

      if (articleBreakMatch !== -1) {
        endIndex = (Math.max(startIndex, endIndex - 1500)) + articleBreakMatch;
      }

      const chunk = text.substring(startIndex, endIndex).trim();
      if (chunk) chunks.push(chunk);

      startIndex = Math.max(startIndex + 1, endIndex - overlap);
    }

    return chunks;
  }

  /**
   * Merge and deduplicate milestones from multiple chunks
   * @param {Array} milestoneLists Array of milestone arrays
   * @param {string} fileName File name
   * @param {string} engine Engine identifier
   * @returns {Array} Clean merged milestones
   */
  static mergeAndDeduplicateMilestones(milestoneLists, fileName, engine = 'gemini_ai') {
    const flattened = milestoneLists.flat().filter(Boolean);
    if (flattened.length === 0) return [];

    const map = new Map();

    for (const m of flattened) {
      if (!m || !m.title) continue;

      // Normalize title for deduplication
      const cleanTitle = m.title.replace(/\s+/g, '').replace(/[（(][^）)]*[）)]/g, '').toLowerCase();
      const key = `${cleanTitle}_${m.dayOffset || 0}`;

      if (!map.has(key)) {
        map.set(key, m);
      } else {
        const existing = map.get(key);
        // Merge deliverables
        const mergedDeliverables = Array.from(new Set([
          ...(existing.deliverables || []),
          ...(m.deliverables || [])
        ]));

        map.set(key, {
          ...existing,
          deliverables: mergedDeliverables,
          confidence: Math.max(existing.confidence || 80, m.confidence || 80),
          penaltyTerms: existing.penaltyTerms && existing.penaltyTerms.length > (m.penaltyTerms || '').length
            ? existing.penaltyTerms
            : m.penaltyTerms || existing.penaltyTerms,
          clauseReference: existing.clauseReference || m.clauseReference
        });
      }
    }

    const uniqueList = Array.from(map.values());
    uniqueList.sort((a, b) => (a.dayOffset ?? 0) - (b.dayOffset ?? 0));

    return uniqueList.map((m, idx) => ({
      id: `ext-ai-${Date.now()}-${idx + 1}`,
      originalText: `🤖 AI (${engine}) 解析自: ${fileName}`,
      title: m.title || '專案關鍵里程碑',
      dayOffset: typeof m.dayOffset === 'number' && m.dayOffset >= 0 ? m.dayOffset : 30,
      dayType: m.dayType === 'workday' ? 'workday' : 'calendar',
      stage: m.stage || '履約查核點',
      matchedDate: m.matchedDate || '',
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
              responseSchema: CONTRACT_MILESTONES_SCHEMA,
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

  /**
   * Call Gemini with Structured Outputs and automatic long document chunking
   */
  static async callGemini(text, fileName, apiKey, requestedModel = 'gemini-3.7-flash', temperature = 0.2) {
    const candidateModels = [requestedModel, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest']
      .filter((v, i, a) => v && a.indexOf(v) === i);

    const chunks = this.chunkTextBySections(text, 14000, 1200);
    const chunkResults = [];

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const chunkText = chunks[cIdx];
      const prompt = this.getPrompt(chunkText, fileName, cIdx + 1, chunks.length);
      let parsedThisChunk = false;

      for (const model of candidateModels) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 28000);

        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: CONTRACT_MILESTONES_SCHEMA,
                temperature: typeof temperature === 'number' ? temperature : 0.2
              }
            }),
            signal: controller.signal
          });

          if (!res.ok) {
            const errText = await res.text();
            console.warn(`[AiContractParser] callGemini with ${model} (chunk ${cIdx + 1}/${chunks.length}) returned HTTP ${res.status}: ${errText.slice(0, 120)}`);
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
          if (result && Array.isArray(result.milestones)) {
            chunkResults.push(result.milestones);
          }
          parsedThisChunk = true;
          break; // successfully parsed chunk
        } catch (err) {
          if (candidateModels.indexOf(model) < candidateModels.length - 1) {
            continue;
          }
          throw err;
        } finally {
          clearTimeout(timeoutId);
        }
      }

      if (!parsedThisChunk && chunks.length > 1) {
        console.warn(`[AiContractParser] Failed to parse chunk ${cIdx + 1}/${chunks.length}, continuing with remaining.`);
      }
    }

    return this.mergeAndDeduplicateMilestones(chunkResults, fileName, 'gemini_ai');
  }

  static async callOpenAI(text, fileName, apiKey) {
    const prompt = this.getPrompt(text, fileName, 1, 1);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
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

  static getPrompt(text, fileName, chunkIndex = 1, totalChunks = 1) {
    return `你是一位資深的政府機關與企業標案合約稽核與專案管理專家。
請仔細分析下列合約/標案文件內容${totalChunks > 1 ? `（此為長文件第 ${chunkIndex}/${totalChunks} 分塊）` : ''}，精準萃取所有「專案履約里程碑、報告提送項目、交付查核點與驗收結案項目」。

針對每一個里程碑，請嚴格萃取以下「合約五維度 (5 Dimensions)」欄位：
1. title (String): 里程碑/報告名稱 (例如: "專案詳細執行計畫書 (PEP)", "系統架構與詳細設計規格書", "期中工作進度報告", "資通安全檢測報告", "期末驗收結案報告")
2. stage (String): 階段分類 (啟動籌備 / 需求分析 / 系統設計 / 系統開發 / 期中審查 / 測試驗收 / 期末結案 / 維護保固 / 定期進度報告)
3. dayOffset (Number): 履約死線天數 (以決標日或簽約日起算之 D+N 天數計算；若條文標註為特定日期如 115/12/31 或簽約後 N 日曆天/工作天，請自動換算合理累計天數)
4. dayType (String): 天數性質 ('calendar' 表示日曆天，'workday' 表示工作天)
5. deliverables (Array of Strings): 該階段應交付之具體產出物清單 (例如: ["專案執行計畫書", "時程甘特圖", "資安防護計畫"])
6. penaltyTerms (String): 逾期違約罰則條文 (例如: "逾期每日按本案合約總價千分之一計罰違約金，上限為契約價金總額 20%")
7. clauseReference (String): 合約/需求說明書對應條文章節 (例如: "契約第 7 條「履約期限」第 1 款" 或 "需求說明書第 3.2 節")
8. location (String): 條文於文件中的位置 (例如: "第 15 頁", "第 4.2 條")
9. confidence (Number): 辨識信心度 (85-99 之間整數)

合約檔案名稱: ${fileName || '合約文件'}
文件內文:
${text}
`;
  }

  static getMultimodalPrompt(fileName) {
    return `你是一位資深的政府機關與企業標案合約稽核與專案管理專家。
請仔細閱讀此份合約/標案/企劃書文件（包含圖表、表格與條文掃描內容），萃取所有專案履約里程碑、產出物交付查核點與驗收結案項目。

請針對每個項目輸出嚴格五維度結構：
- title: 里程碑名稱
- stage: 階段分類
- dayOffset: 簽約/決標日起算之 D+N 天數
- dayType: calendar 或 workday
- deliverables: 交付產出物清單
- penaltyTerms: 逾期罰則條文
- clauseReference: 條文出處章節
- location: 文件頁碼或段落
- confidence: 信心度 (85-99)

檔案名稱: ${fileName || '合約文件'}`;
  }

  static formatLlmResult(result, fileName, engine = 'gemini_ai') {
    if (!result || !Array.isArray(result.milestones)) return [];
    return this.mergeAndDeduplicateMilestones([result.milestones], fileName, engine);
  }

  /**
   * Rule-based heuristic parser (Enhanced Taiwan Procurement Rules Fallback)
   */
  static parse(text = '', fileName = '') {
    const cleanText = text.trim();
    const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const predefinedTemplates = [
      {
        keyword: '名冊',
        stage: '啟動籌備',
        defaultOffset: 10,
        dayType: 'workday',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}專案管理成員名冊與保密切結 (訂購日起10工作日內)`,
        deliverables: ['專案管理成員名冊', '保密同意書及切結書', '資通安全維護計畫'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照專案服務議定書「訂購日起 10 個工作日內履約規定」'
      },
      {
        keyword: '計畫書',
        stage: '啟動籌備',
        defaultOffset: 30,
        dayType: 'calendar',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}專案詳細執行計畫書 (PEP)`,
        deliverables: ['專案詳細執行計畫書 (PEP)', '專案時程甘特圖', '品質管理與風險因應計畫'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照工作說明書 (SOW) 第 3.1 節「履約管理與計畫書提送」'
      },
      {
        keyword: '需求',
        stage: '需求分析',
        defaultOffset: 45,
        dayType: 'calendar',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}需求規格確認書 (SRS) 與訪談紀錄`,
        deliverables: ['需求規格確認書 (SRS)', '使用者訪談確認紀錄表', '功能架構藍圖清冊'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照需求說明書第 4.1 條「需求分析規範」'
      },
      {
        keyword: '架構',
        stage: '系統設計',
        defaultOffset: 60,
        dayType: 'calendar',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}系統架構與詳細設計規格書 (SAD)`,
        deliverables: ['系統架構設計說明書 (SAD)', '資料庫 Schema 規格書', 'RESTful API 介面定義規格檔'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照標案需求說明書 (RFP) 第 4.2 條「系統設計規範」'
      },
      {
        keyword: '授權',
        stage: '系統開發',
        defaultOffset: 75,
        dayType: 'calendar',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}授權與資安暨教育訓練交付`,
        deliverables: ['軟體授權證明書', '資訊安全防護計畫書', '教育訓練教材及簽到表'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照專案服務議定書「軟體授權與教育訓練履約規定」'
      },
      {
        keyword: '期中',
        stage: '期中審查',
        defaultOffset: 90,
        dayType: 'calendar',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}期中工作進度報告與原型展示`,
        deliverables: ['期中成果報告書', '期中系統原型展示紀錄', '待辦改善事項追蹤表'],
        penaltyTerms: '逾期每日按本案合約總價千分之一計罰違約金',
        clauseReference: '參照契約第 7 條「期中查核條款」'
      },
      {
        keyword: '測試',
        stage: '測試驗收',
        defaultOffset: 120,
        dayType: 'calendar',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}系統開發與單元/整合測試報告`,
        deliverables: ['系統測試案例與執行結果報告', '源碼掃描與弱點修補報告', '壓力與效能測試結果紀錄'],
        penaltyTerms: '逾期每日按本案合約總價千分之二計罰違約金，累計罰款上限為合約總價 20%',
        clauseReference: '參照專案合約條文第 8 條第 3 項「測試與品質驗收」'
      },
      {
        keyword: '外撥',
        stage: '測試驗收',
        defaultOffset: 150,
        dayType: 'calendar',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}AI 語音服務成果與統計報告`,
        deliverables: ['服務執行統計報表', 'AI 語音錄音與逐字稿抽樣檔', '維運作業標準手冊'],
        penaltyTerms: '逾期每日按本案合約總價千分之二計罰違約金',
        clauseReference: '參照專案服務議定書「語音服務成果查核規定」'
      },
      {
        keyword: '滲透',
        stage: '測試驗收',
        defaultOffset: 180,
        dayType: 'calendar',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}資安資通安全與滲透測試報告`,
        deliverables: ['第三方資安滲透測試報告', '弱點複測與修補對照表', 'APP 資安檢測合格證明書'],
        penaltyTerms: '逾期未修補高風險弱點者，按每日新台幣五千元累計計罰',
        clauseReference: '參照國家資通安全防護規範第 12 條「資安檢測」'
      },
      {
        keyword: '全案',
        stage: '期末結案',
        defaultOffset: 210,
        dayType: 'calendar',
        title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') + ' - ' : ''}全案履約完成與結案驗收`,
        deliverables: ['全案履約完成結案報告', '成果驗收清冊', '系統安裝部署手冊與原始碼光碟', '智慧財產權與保固切結書'],
        penaltyTerms: '逾期未完成結案驗收按本案合約總價千分之三計罰，機關得逕行解約並沒收履約保證金',
        clauseReference: '參照專案服務議定書「全案履約完成與驗收條款」'
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
      let dayType = template.dayType;
      let confidenceScore = 82;

      if (cleanText) {
        const keywordIdx = cleanText.indexOf(template.keyword);
        const contextRadius = 400;
        let contextText = cleanText;

        if (keywordIdx >= 0) {
          const start = Math.max(0, keywordIdx - contextRadius);
          const end = Math.min(cleanText.length, keywordIdx + contextRadius);
          contextText = cleanText.substring(start, end);
        }

        // Regex for Taiwan procurement day calculation
        const offsetReg = /(?:決標|簽約|開工|訂購|D\+)[次日\s]*[起計至內]*\s*([0-9０-９一二三四五六七八九十百]+)\s*(個?日曆天|個?工作天|日|天|個月)/g;
        let match;
        while ((match = offsetReg.exec(contextText)) !== null) {
          const rawNum = match[1];
          let parsedDays = parseInt(rawNum, 10);
          if (isNaN(parsedDays)) {
            // Simple Chinese numeral conversion
            const numMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '十五': 15, '二十': 20, '三十': 30, '六十': 60, '九十': 90 };
            parsedDays = numMap[rawNum] || 30;
          }

          if (match[2].includes('月')) parsedDays *= 30;

          if (parsedDays > 0) {
            dayOffset = parsedDays;
            dayType = match[2].includes('工作天') ? 'workday' : 'calendar';
            confidenceScore = Math.min(96, confidenceScore + 12);
            break;
          }
        }
      }

      extractedItems.push({
        id: `ext-rule-${Date.now()}-${idx + 1}`,
        originalText: matchingLine || `⚡ 啟發式規則: 廠商應於 D+${dayOffset} ${dayType === 'workday' ? '工作天' : '日曆天'}內交付【${template.title}】`,
        title: template.title,
        stage: template.stage,
        dayOffset: dayOffset,
        dayType: dayType,
        matchedDate: template.matchedDate || '',
        deliverables: template.deliverables,
        penaltyTerms: template.penaltyTerms,
        clauseReference: template.clauseReference,
        location: matchIndex !== -1 ? `第 ${matchIndex + 1} 行` : '合約內文條款',
        confidence: confidenceScore,
        source: 'rule_heuristic',
        selected: true
      });
    });

    if (extractedItems.length === 0 && cleanText.length === 0) {
      predefinedTemplates.forEach((template, idx) => {
        extractedItems.push({
          id: `ext-rule-base-${Date.now()}-${idx + 1}`,
          originalText: `⚡ 合約基準範本: 廠商應於 D+${template.defaultOffset} ${template.dayType === 'workday' ? '工作天' : '日曆天'}內交付【${template.title}】`,
          title: template.title,
          stage: template.stage,
          dayOffset: template.defaultOffset,
          dayType: template.dayType,
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

    extractedItems.sort((a, b) => (a.dayOffset ?? 0) - (b.dayOffset ?? 0));
    return extractedItems;
  }
}

module.exports = AiContractParser;
