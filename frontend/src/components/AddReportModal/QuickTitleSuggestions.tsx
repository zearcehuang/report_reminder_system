import React from 'react';

const QUICK_TITLE_SUGGESTIONS = [
  '專案執行計畫書 (PEP)',
  '需求規格確認書 (SRS)',
  '期中進度報告 Draft',
  '期中進度報告 Final',
  '期末成果報告',
  '資安弱點掃描與滲透測試報告',
  '系統開發與單元測試報告',
  '教育訓練與使用者手冊',
  '驗收與結案報告',
];

interface QuickTitleSuggestionsProps {
  currentTitle: string;
  onSelectTitle: (title: string) => void;
}

export const QuickTitleSuggestions: React.FC<QuickTitleSuggestionsProps> = ({ currentTitle, onSelectTitle }) => {
  return (
    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
      <span style={{ fontSize: '0.725rem', color: '#64748b', alignSelf: 'center', marginRight: '0.2rem' }}>快速帶入:</span>
      {QUICK_TITLE_SUGGESTIONS.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelectTitle(item)}
          style={{
            background: currentTitle === item ? 'rgba(79, 70, 229, 0.12)' : '#f1f5f9',
            border: currentTitle === item ? '1px solid #818cf8' : '1px solid #e2e8f0',
            color: currentTitle === item ? '#4f46e5' : '#475569',
            fontSize: '0.725rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          + {item}
        </button>
      ))}
    </div>
  );
};
