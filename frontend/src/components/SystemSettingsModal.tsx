import React from 'react';
import { SystemSettings } from '../types';
import { X, Lock, Sparkles, Zap, RefreshCw, ShieldCheck } from 'lucide-react';
import { ApiKeySection } from './SystemSettingsModal/ApiKeySection';
import { ModelSection } from './SystemSettingsModal/ModelSection';
import { ParameterSection } from './SystemSettingsModal/ParameterSection';
import { TestResultBanner } from './SystemSettingsModal/TestResultBanner';
import { useSystemSettings } from './SystemSettingsModal/useSystemSettings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (settings: SystemSettings) => void;
}

export const SystemSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const {
    settings,
    apiKeyInput,
    setApiKeyInput,
    selectedModel,
    setSelectedModel,
    isCustomModel,
    setIsCustomModel,
    customModelId,
    setCustomModelId,
    autoUseGemini,
    setAutoUseGemini,
    temperature,
    setTemperature,
    availableModels,
    modelSource,
    isFetchingModels,
    isLoading,
    isSaving,
    isTesting,
    testResult,
    effectiveModel,
    handleRefreshModels,
    handleTestConnection,
    handleSave,
  } = useSystemSettings(isOpen, onSettingsSaved);

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
            <ApiKeySection
              apiKeyInput={apiKeyInput}
              onChangeApiKey={setApiKeyInput}
              settings={settings}
            />

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--surface-glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.1rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <ModelSection
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                  isCustomModel={isCustomModel}
                  setIsCustomModel={setIsCustomModel}
                  customModelId={customModelId}
                  setCustomModelId={setCustomModelId}
                  availableModels={availableModels}
                  modelSource={modelSource}
                  isFetchingModels={isFetchingModels}
                  onRefreshModels={handleRefreshModels}
                  effectiveModel={effectiveModel}
                />
                <ParameterSection
                  temperature={temperature}
                  setTemperature={setTemperature}
                  autoUseGemini={autoUseGemini}
                  setAutoUseGemini={setAutoUseGemini}
                />
              </div>
            </div>

            {testResult && <TestResultBanner testResult={testResult} />}

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
                  opacity: (!hasConfiguredKey && !apiKeyInput.trim()) ? 0.5 : 1,
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
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
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
