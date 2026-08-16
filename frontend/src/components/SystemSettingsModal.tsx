import React, { useState, useEffect } from 'react';
import { SystemSettings, GeminiTestResult, GeminiModelInfo } from '../types';
import {
  Settings,
  X,
  Key,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Sliders,
  ShieldCheck,
  Check,
  DownloadCloud,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (settings: SystemSettings) => void;
}

const DEFAULT_FALLBACK_MODELS: GeminiModelInfo[] = [
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
    displayName: 'Gemini Flash (自動最新版)',
    description: '自動綁定 Google 雲端當前最新發布之 Flash 模型',
    isRecommended: false,
    isLatest: true
  }
];

export const SystemSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSettingsSaved
}) => {
  const { showSuccess, showError, showInfo } = useToast();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.7-flash');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelId, setCustomModelId] = useState('');
  const [autoUseGemini, setAutoUseGemini] = useState(true);
  const [temperature, setTemperature] = useState(0.2);

  const [availableModels, setAvailableModels] = useState<GeminiModelInfo[]>(DEFAULT_FALLBACK_MODELS);
  const [modelSource, setModelSource] = useState<'curated_defaults' | 'live_google_api' | string>('curated_defaults');
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<GeminiTestResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      setTestResult(null);
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      const configuredModel = data.geminiModel || 'gemini-2.0-flash';
      setSelectedModel(configuredModel);
      setAutoUseGemini(data.autoUseGemini !== undefined ? data.autoUseGemini : true);
      setTemperature(data.temperature !== undefined ? data.temperature : 0.2);
      setApiKeyInput(''); // Clear input so masked placeholder is shown

      // Fetch live models
      await loadAvailableModels('', configuredModel);
    } catch (e) {
      showError('載入系統設定失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableModels = async (keyOverride = '', currentModel = selectedModel) => {
    setIsFetchingModels(true);
    try {
      const res = await api.getAvailableGeminiModels(keyOverride);
      if (res && Array.isArray(res.models) && res.models.length > 0) {
        setAvailableModels(res.models);
        setModelSource(res.source);

        const targetModel = currentModel || selectedModel;
        const exists = res.models.some(m => m.id === targetModel);
        if (!exists && targetModel && targetModel !== 'custom') {
          setIsCustomModel(true);
          setCustomModelId(targetModel);
        }
      }
    } catch (e) {
      setAvailableModels(DEFAULT_FALLBACK_MODELS);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleRefreshModels = async () => {
    const candidateKey = apiKeyInput.trim();
    await loadAvailableModels(candidateKey, selectedModel);
    showInfo('已從 Google API 重新抓取可用模型清單');
  };

  const effectiveModel = isCustomModel ? (customModelId.trim() || 'gemini-2.0-flash') : selectedModel;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const candidateKey = apiKeyInput.trim();
      const result = await api.testGeminiConnection(candidateKey, effectiveModel);
      setTestResult(result);
      if (result.success) {
        showSuccess(`Gemini API 測試連線成功！(${result.latencyMs}ms)`);
        // Refresh models if user provided a working key
        if (candidateKey) {
          await loadAvailableModels(candidateKey, effectiveModel);
        }
      } else {
        showError(result.error || 'Gemini API 連線失敗');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || '連線測試發生未知異常'
      });
      showError('連線測試異常');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: { geminiApiKey?: string; geminiModel?: string; autoUseGemini?: boolean; temperature?: number } = {
        geminiModel: effectiveModel,
        autoUseGemini,
        temperature
      };

      if (apiKeyInput.trim() !== '') {
        payload.geminiApiKey = apiKeyInput.trim();
      }

      const res = await api.updateSettings(payload);
      if (res.success && res.settings) {
        setSettings(res.settings);
        setApiKeyInput('');
        showSuccess(res.message || '系統設定已安全加密儲存！');
        if (onSettingsSaved) {
          onSettingsSaved(res.settings);
        }
      } else {
        showError(res.error || '儲存設定失敗');
      }
    } catch (err: any) {
      showError(err.message || '儲存設定時發生錯誤');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const hasConfiguredKey = settings?.hasGeminiApiKey || false;

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '720px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Gemini AI 與系統安全設定
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                配置 Google Gemini API 金鑰、自動動態抓取可用模型清單與解析參數
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Security Alert / Encryption Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95) 0%, rgba(224, 231, 255, 0.95) 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.825rem',
          color: '#3730a3',
        }}>
          <ShieldCheck size={20} color="#4338ca" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 700 }}>AES-256-GCM 銀行級金鑰加密保護</span>
            <div style={{ fontSize: '0.75rem', color: '#4338ca', opacity: 0.9, marginTop: '2px' }}>
              所有 API 金鑰皆經過帶有隨機 IV 與 Auth Tag 的 Authenticated Encryption 加密儲存，前端絕不回傳明文。
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <RefreshCw size={32} className="spin-animation" color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>正在載入系統設定與可用模型...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* API Key Input Section */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--surface-glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                  <Key size={16} color="#6366f1" />
                  Google Gemini API Key
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {hasConfiguredKey ? (
                    <span style={{
                      fontSize: '0.725rem',
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}>
                      <CheckCircle2 size={12} />
                      已設定加密金鑰
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.725rem',
                      background: '#fffbeb',
                      color: '#d97706',
                      border: '1px solid #fde68a',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}>
                      <AlertTriangle size={12} />
                      尚未設定 (使用預設規則降級)
                    </span>
                  )}
                </div>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={hasConfiguredKey ? `目前金鑰: ${settings?.geminiApiKeyMasked} (如需更新請在此輸入新 Key)` : '請輸入 AIzaSy... 開頭的 Gemini API Key'}
                  className="input-field"
                  style={{
                    paddingRight: '6.5rem',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    background: '#f8fafc'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '0.6rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.4rem',
                    borderRadius: '4px'
                  }}
                >
                  {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  {showApiKey ? '隱藏' : '顯示'}
                </button>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                可在 Google AI Studio (<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>aistudio.google.com</a>) 免費獲取 Gemini API Key。
              </p>
            </div>

            {/* Model & AI Parameters Section */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--surface-glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.1rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Dynamic Model Selector */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                      <Cpu size={16} color="#06b6d4" />
                      Gemini 解析模型
                    </label>
                    <button
                      type="button"
                      onClick={handleRefreshModels}
                      disabled={isFetchingModels}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6366f1',
                        fontSize: '0.725rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.3rem',
                        borderRadius: '4px'
                      }}
                      title="從 Google API 重新抓取即時可用模型清單"
                    >
                      <RefreshCw size={12} className={isFetchingModels ? 'spin-animation' : ''} />
                      {isFetchingModels ? '抓取中...' : '自動抓取清單'}
                    </button>
                  </div>

                  {!isCustomModel ? (
                    <select
                      value={selectedModel}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomModel(true);
                        } else {
                          setSelectedModel(e.target.value);
                        }
                      }}
                      className="input-field"
                      style={{ fontSize: '0.85rem', background: '#f8fafc' }}
                    >
                      {availableModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName} {m.isRecommended ? '🔥 (官方推薦)' : m.isLatest ? '✨ (最新)' : ''}
                        </option>
                      ))}
                      <option value="__custom__">⚙️ 自訂模型名稱 (Custom Model ID)...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        type="text"
                        value={customModelId}
                        onChange={(e) => setCustomModelId(e.target.value)}
                        placeholder="例: gemini-3.7-flash 或 gemini-2.0-flash"
                        className="input-field"
                        style={{ fontSize: '0.85rem', background: '#f8fafc', flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomModel(false)}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        切換下拉
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <span>
                      {modelSource === 'live_google_api' ? '🌐 已連線 Google API (即時動態模型)' : '📦 內建預設模型清單'}
                    </span>
                    <span style={{ color: '#4f46e5', fontWeight: 600 }}>
                      目前指定: {effectiveModel}
                    </span>
                  </div>
                </div>

                {/* Temperature */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                      <Sliders size={16} color="#8b5cf6" />
                      溫度參數 (Temperature)
                    </label>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>0.0 (最精準結構化)</span>
                    <span>1.0 (創意生成)</span>
                  </div>
                </div>
              </div>

              {/* Priority Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: '#f8fafc',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    優先使用 Gemini AI 深度解析合約
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                    上傳 DOCX、PDF 或掃描檔時優先採用 Gemini AI 辨識合約五維度，連線失敗時自動回退規則引擎。
                  </div>
                </div>
                <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={autoUseGemini}
                    onChange={(e) => setAutoUseGemini(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: autoUseGemini ? '#4f46e5' : '#cbd5e1',
                    transition: '0.2s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: autoUseGemini ? '22px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '0.2s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>
            </div>

            {/* Test Result Feedback Box */}
            {testResult && (
              <div
                className="animate-fade-in"
                style={{
                  background: testResult.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  fontSize: '0.825rem'
                }}
              >
                {testResult.success ? (
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, color: testResult.success ? '#15803d' : '#b91c1c' }}>
                    {testResult.success ? '✅ API 連線測試成功' : '❌ API 連線失敗'}
                  </div>
                  <div style={{ color: testResult.success ? '#166534' : '#991b1b', marginTop: '2px', fontSize: '0.775rem' }}>
                    {testResult.message || testResult.error}
                  </div>
                  {testResult.latencyMs !== undefined && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                      ⚡ 往返延遲: <span style={{ fontWeight: 700, color: '#334155' }}>{testResult.latencyMs} ms</span> | 測試模型: {testResult.model}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || (!hasConfiguredKey && !apiKeyInput.trim())}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.825rem',
                  padding: '0.5rem 0.9rem',
                  opacity: (!hasConfiguredKey && !apiKeyInput.trim()) ? 0.5 : 1
                }}
              >
                {isTesting ? (
                  <>
                    <RefreshCw size={14} className="spin-animation" />
                    <span>測試連線中...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} color="#6366f1" />
                    <span>測試連線 ({effectiveModel})</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  style={{ fontSize: '0.825rem', padding: '0.5rem 1rem' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.825rem',
                    padding: '0.5rem 1.25rem',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="spin-animation" />
                      <span>加密儲存中...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>加密儲存設定</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
