import React from 'react';
import { Sliders } from 'lucide-react';

interface ParameterSectionProps {
  temperature: number;
  setTemperature: (val: number) => void;
  autoUseGemini: boolean;
  setAutoUseGemini: (val: boolean) => void;
}

export const ParameterSection: React.FC<ParameterSectionProps> = ({
  temperature,
  setTemperature,
  autoUseGemini,
  setAutoUseGemini,
}) => {
  return (
    <>
      {/* Temperature Slider */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.4rem',
          }}
        >
          <label
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-primary)',
            }}
          >
            <Sliders size={16} color="#8b5cf6" />
            溫度參數 (Temperature)
          </label>
          <span
            style={{
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#6366f1',
            }}
          >
            {temperature}
          </span>
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>0.0 (最精準結構化)</span>
          <span>1.0 (創意生成)</span>
        </div>
      </div>

      {/* Priority Auto-use Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem',
          background: '#f8fafc',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            優先使用 Gemini AI 深度解析合約
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
            上傳 DOCX、PDF 或掃描檔時優先採用 Gemini AI 辨識合約五維度，連線失敗時自動回退規則引擎。
          </div>
        </div>
        <label
          className="toggle-switch"
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '44px',
            height: '24px',
            flexShrink: 0,
          }}
        >
          <input
            type="checkbox"
            checked={autoUseGemini}
            onChange={(e) => setAutoUseGemini(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: autoUseGemini ? '#4f46e5' : '#cbd5e1',
              transition: '0.2s',
              borderRadius: '24px',
            }}
          >
            <span
              style={{
                position: 'absolute',
                content: '""',
                height: '18px',
                width: '18px',
                left: autoUseGemini ? '22px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                transition: '0.2s',
                borderRadius: '50%',
              }}
            />
          </span>
        </label>
      </div>
    </>
  );
};
