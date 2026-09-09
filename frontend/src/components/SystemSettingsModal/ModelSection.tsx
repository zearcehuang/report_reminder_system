import React from 'react';
import { Cpu, RefreshCw } from 'lucide-react';
import { GeminiModelInfo } from '../../types';

interface ModelSectionProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isCustomModel: boolean;
  setIsCustomModel: (val: boolean) => void;
  customModelId: string;
  setCustomModelId: (val: string) => void;
  availableModels: GeminiModelInfo[];
  modelSource: string;
  isFetchingModels: boolean;
  onRefreshModels: () => void;
  effectiveModel: string;
}

export const ModelSection: React.FC<ModelSectionProps> = ({
  selectedModel,
  onSelectModel,
  isCustomModel,
  setIsCustomModel,
  customModelId,
  setCustomModelId,
  availableModels,
  modelSource,
  isFetchingModels,
  onRefreshModels,
  effectiveModel,
}) => {
  return (
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
          <Cpu size={16} color="#06b6d4" />
          Gemini 解析模型
        </label>
        <button
          type="button"
          onClick={onRefreshModels}
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
            borderRadius: '4px',
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
              onSelectModel(e.target.value);
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginTop: '0.35rem',
        }}
      >
        <span>
          {modelSource === 'live_google_api'
            ? '🌐 已連線 Google API (即時動態模型)'
            : '📦 內建預設模型清單'}
        </span>
        <span style={{ color: '#4f46e5', fontWeight: 600 }}>目前指定: {effectiveModel}</span>
      </div>
    </div>
  );
};
