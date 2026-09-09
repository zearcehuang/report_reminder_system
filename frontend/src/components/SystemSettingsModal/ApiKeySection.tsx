import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SystemSettings } from '../../types';

interface ApiKeySectionProps {
  apiKeyInput: string;
  onChangeApiKey: (val: string) => void;
  settings: SystemSettings | null;
}

export const ApiKeySection: React.FC<ApiKeySectionProps> = ({
  apiKeyInput,
  onChangeApiKey,
  settings,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const hasConfiguredKey = settings?.hasGeminiApiKey || false;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--surface-glass-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.1rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <label
          style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-primary)',
          }}
        >
          <Key size={16} color="#6366f1" />
          Google Gemini API Key
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {hasConfiguredKey ? (
            <span
              style={{
                fontSize: '0.725rem',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={12} />
              已設定加密金鑰
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.725rem',
                background: '#fffbeb',
                color: '#d97706',
                border: '1px solid #fde68a',
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 600,
              }}
            >
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
          onChange={(e) => onChangeApiKey(e.target.value)}
          placeholder={
            hasConfiguredKey
              ? `目前金鑰: ${settings?.geminiApiKeyMasked} (如需更新請在此輸入新 Key)`
              : '請輸入 AIzaSy... 開頭的 Gemini API Key'
          }
          className="input-field"
          style={{
            paddingRight: '6.5rem',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            background: '#f8fafc',
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
            borderRadius: '4px',
          }}
        >
          {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
          {showApiKey ? '隱藏' : '顯示'}
        </button>
      </div>
      <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
        可在 Google AI Studio (
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#6366f1', textDecoration: 'underline' }}
        >
          aistudio.google.com
        </a>
        ) 免費獲取 Gemini API Key。
      </p>
    </div>
  );
};
