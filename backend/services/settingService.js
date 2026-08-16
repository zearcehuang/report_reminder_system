/**
 * settingService.js
 * Manages encrypted system settings, Gemini API Key storage, and connection verification.
 */

const path = require('path');
const { readJsonSync, readJson, writeJson } = require('./jsonStore');
const { encrypt, decrypt, maskApiKey } = require('./cryptoService');
const { logError } = require('./errorLogger');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  geminiApiKeyEncrypted: '',
  geminiModel: 'gemini-3.7-flash',
  autoUseGemini: true,
  temperature: 0.2,
  updatedAt: new Date().toISOString()
};

function getRawSettingsSync() {
  return readJsonSync(SETTINGS_FILE, DEFAULT_SETTINGS);
}

async function getRawSettings() {
  return await readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
}

/**
 * Get public settings (safe for client, masked key)
 */
async function getPublicSettings() {
  const raw = await getRawSettings();
  const decryptedKey = getDecryptedGeminiKey();
  const hasKey = Boolean(decryptedKey && decryptedKey.trim().length > 0);

  return {
    hasGeminiApiKey: hasKey,
    geminiApiKeyMasked: hasKey ? maskApiKey(decryptedKey) : '',
    geminiModel: raw.geminiModel || 'gemini-2.0-flash',
    autoUseGemini: raw.autoUseGemini !== undefined ? raw.autoUseGemini : true,
    temperature: raw.temperature !== undefined ? raw.temperature : 0.2,
    updatedAt: raw.updatedAt || null
  };
}

/**
 * Get decrypted Gemini API Key for internal backend usage
 */
function getDecryptedGeminiKey() {
  try {
    const raw = getRawSettingsSync();
    if (raw && raw.geminiApiKeyEncrypted) {
      const decrypted = decrypt(raw.geminiApiKeyEncrypted);
      if (decrypted && decrypted.trim().length > 0) {
        return decrypted.trim();
      }
    }
  } catch (e) {
    logError('SETTINGS_DECRYPT_KEY', e);
  }

  // Fallback to environment variable if settings.json does not have one
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }

  return '';
}

/**
 * Get full active configuration for AI processing
 */
function getAiConfig() {
  const raw = getRawSettingsSync();
  const apiKey = getDecryptedGeminiKey();
  return {
    apiKey,
    hasApiKey: Boolean(apiKey),
    model: raw.geminiModel || 'gemini-2.0-flash',
    autoUseGemini: raw.autoUseGemini !== undefined ? raw.autoUseGemini : true,
    temperature: raw.temperature !== undefined ? raw.temperature : 0.2
  };
}

/**
 * Update system settings
 */
async function updateSettings(newSettings = {}) {
  const current = await getRawSettings();
  const updated = { ...current };

  // Handle Gemini API Key update
  if (typeof newSettings.geminiApiKey === 'string') {
    const key = newSettings.geminiApiKey.trim();
    if (key === '') {
      // Clear key
      updated.geminiApiKeyEncrypted = '';
    } else if (!key.includes('****')) {
      // New key provided (not the masked placeholder)
      updated.geminiApiKeyEncrypted = encrypt(key);
    }
  }

  if (newSettings.geminiModel) {
    updated.geminiModel = String(newSettings.geminiModel).trim();
  }

  if (newSettings.autoUseGemini !== undefined) {
    updated.autoUseGemini = Boolean(newSettings.autoUseGemini);
  }

  if (newSettings.temperature !== undefined) {
    const temp = parseFloat(newSettings.temperature);
    if (!isNaN(temp) && temp >= 0 && temp <= 2.0) {
      updated.temperature = temp;
    }
  }

  updated.updatedAt = new Date().toISOString();

  await writeJson(SETTINGS_FILE, updated);
  return await getPublicSettings();
}

/**
 * Test Gemini API connection
 */
async function testGeminiConnection(candidateKey = '', candidateModel = '') {
  let apiKey = candidateKey && candidateKey.trim() && !candidateKey.includes('****')
    ? candidateKey.trim()
    : getDecryptedGeminiKey();

  if (!apiKey) {
    return {
      success: false,
      error: '尚未設定 Gemini API Key，請先輸入有效的 API Key。'
    };
  }

  const model = candidateModel || (getAiConfig().model || 'gemini-2.0-flash');
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Ping test. Reply with: OK' }] }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1
        }
      }),
      signal: controller.signal
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.error && parsed.error.message) {
          errorMsg = parsed.error.message;
        }
      } catch (e) {}

      return {
        success: false,
        latencyMs,
        model,
        error: `Gemini API 驗證失敗: ${errorMsg}`
      };
    }

    const data = await response.json();
    let replyText = 'OK';
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      replyText = data.candidates[0].content.parts[0].text;
    } else if (data?.candidates?.[0]?.finishReason) {
      replyText = `Status: ${data.candidates[0].finishReason}`;
    } else if (data?.promptFeedback?.blockReason) {
      replyText = `Blocked: ${data.promptFeedback.blockReason}`;
    }

    return {
      success: true,
      latencyMs,
      model,
      message: `連線成功！Gemini API (${model}) 運作正常，回應時間 ${latencyMs}ms。`,
      data: replyText
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return {
        success: false,
        latencyMs,
        model,
        error: '連線逾時 (超過 12 秒)，請檢查網路連線或 API Key 設定。'
      };
    }
    logError('GEMINI_TEST_CONNECTION', err);
    return {
      success: false,
      latencyMs,
      model,
      error: `連線發生錯誤: ${err.message}`
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

const CURATED_DEFAULT_MODELS = [
  {
    id: 'gemini-3.7-flash',
    name: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash',
    description: '最新世代極速多模態與高精準結構化解析 (最推薦)',
    isRecommended: true,
    isLatest: true
  },
  {
    id: 'gemini-3.6-flash',
    name: 'gemini-3.6-flash',
    displayName: 'Gemini 3.6 Flash',
    description: '新一代高效能文字與多模態模型',
    isLatest: true
  },
  {
    id: 'gemini-2.5-flash',
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: '高效穩定多模態文字模型',
    isRecommended: false
  },
  {
    id: 'gemini-2.5-pro',
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    description: '複雜長合約深度邏輯推論',
    isRecommended: false
  },
  {
    id: 'gemini-flash-latest',
    name: 'gemini-flash-latest',
    displayName: 'Gemini Flash (自動對應最新版)',
    description: '自動綁定 Google 雲端當前最新發布之 Flash 模型',
    isRecommended: false,
    isLatest: true
  }
];

/**
 * Validate Gemini API Key format before making outbound network calls
 */
function isValidGeminiApiKeyFormat(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  // Valid Google Gemini API keys are typically ~39 characters starting with AIza, and have no spaces
  if (trimmed.length < 20) return false;
  if (/\s/.test(trimmed)) return false;
  if (trimmed.includes('****')) return false;
  // If it starts with AIza or has standard alphanumeric key structure
  if (trimmed.startsWith('AIza')) return true;
  return /^[A-Za-z0-9_-]{20,}$/.test(trimmed);
}

/**
 * Fetch list of available generation models from Google API or fallback list
 */
async function fetchAvailableGeminiModels(candidateKey = '') {
  let apiKey = candidateKey && candidateKey.trim() && !candidateKey.includes('****')
    ? candidateKey.trim()
    : getDecryptedGeminiKey();

  if (!apiKey || !isValidGeminiApiKeyFormat(apiKey)) {
    return {
      success: true,
      source: 'curated_defaults',
      models: CURATED_DEFAULT_MODELS
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) {
      let detailMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          detailMsg = `${detailMsg} (${errJson.error.message})`;
        }
      } catch (_) {}

      // Log as warning rather than critical error log to avoid false alarm in UI
      console.warn(`[GEMINI_FETCH_MODELS_WARN] ${detailMsg}`);

      return {
        success: true,
        source: 'curated_defaults',
        models: CURATED_DEFAULT_MODELS,
        warning: `無法從 Google API 獲取即時清單 (HTTP ${response.status})，已顯示內建最新模型`
      };
    }

    const data = await response.json();
    const rawList = Array.isArray(data.models) ? data.models : [];

    // Filter generation models (supporting generateContent)
    const filtered = rawList.filter(m => {
      if (!m.name) return false;
      const methods = m.supportedGenerationMethods || [];
      return methods.includes('generateContent') && !m.name.includes('embedding') && !m.name.includes('aqa');
    });

    const parsedModels = filtered.map(m => {
      const id = m.name.replace(/^models\//, '');
      const isRecommended = id === 'gemini-3.7-flash' || id === 'gemini-2.0-flash';
      const isLatest = id.includes('2.0') || id.includes('2.5') || id.includes('3.');
      return {
        id,
        name: id,
        displayName: m.displayName || id,
        description: m.description || '',
        isRecommended: id === 'gemini-3.7-flash',
        isLatest
      };
    });

    // Sort order: recommended first, then latest 2.x/3.x, then 1.5, then others
    parsedModels.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      if (a.isLatest && !b.isLatest) return -1;
      if (!a.isLatest && b.isLatest) return 1;
      return a.id.localeCompare(b.id);
    });

    return {
      success: true,
      source: 'live_google_api',
      totalCount: parsedModels.length,
      models: parsedModels.length > 0 ? parsedModels : CURATED_DEFAULT_MODELS
    };
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn(`[GEMINI_FETCH_MODELS_WARN] ${err.message}`);
    }
    return {
      success: true,
      source: 'curated_defaults',
      models: CURATED_DEFAULT_MODELS,
      warning: `網路連線異常 (${err.message})，已顯示內建最新模型`
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  getPublicSettings,
  getDecryptedGeminiKey,
  getAiConfig,
  updateSettings,
  testGeminiConnection,
  fetchAvailableGeminiModels,
  isValidGeminiApiKeyFormat,
  CURATED_DEFAULT_MODELS
};
