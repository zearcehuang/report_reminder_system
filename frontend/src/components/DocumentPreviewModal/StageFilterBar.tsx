import React from 'react';
import { Sparkles, Layers } from 'lucide-react';
import { ExtractedMilestone } from '../../types';

interface StageFilterBarProps {
  stages: string[];
  selectedStageFilter: string;
  milestones: ExtractedMilestone[];
  onSelectStage: (stage: string) => void;
  onToggleSelectAll: (select: boolean) => void;
}

export const StageFilterBar: React.FC<StageFilterBarProps> = ({
  stages,
  selectedStageFilter,
  milestones,
  onSelectStage,
  onToggleSelectAll,
}) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
        border: '1px solid #c7d2fe',
        borderRadius: 'var(--radius-sm)',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontSize: '0.825rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3730a3', fontWeight: 600 }}>
          <Sparkles size={18} color="#4f46e5" />
          已萃取五維度結構化欄位（D+N 天數、📦 交付產出物、⚖️ 違約罰則與 📜 條文依據）
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onToggleSelectAll(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4338ca',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            全選
          </button>
          <span style={{ color: '#a5b4fc' }}>|</span>
          <button
            onClick={() => onToggleSelectAll(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            取消全選
          </button>
        </div>
      </div>

      {stages.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            paddingTop: '0.25rem',
            borderTop: '1px solid #c7d2fe',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: '#4338ca',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <Layers size={13} /> 階段篩選:
          </span>
          <button
            onClick={() => onSelectStage('all')}
            style={{
              fontSize: '0.725rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              border: selectedStageFilter === 'all' ? '1px solid #4f46e5' : '1px solid #c7d2fe',
              background: selectedStageFilter === 'all' ? '#4f46e5' : '#ffffff',
              color: selectedStageFilter === 'all' ? '#ffffff' : '#4338ca',
              cursor: 'pointer',
              fontWeight: selectedStageFilter === 'all' ? 700 : 500,
            }}
          >
            全部 ({milestones.length})
          </button>
          {stages.map((stage) => {
            const count = milestones.filter((m) => m.stage === stage).length;
            const isSelected = selectedStageFilter === stage;
            return (
              <button
                key={stage}
                onClick={() => onSelectStage(stage)}
                style={{
                  fontSize: '0.725rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  border: isSelected ? '1px solid #4f46e5' : '1px solid #c7d2fe',
                  background: isSelected ? '#4f46e5' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#4338ca',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                {stage} ({count})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
