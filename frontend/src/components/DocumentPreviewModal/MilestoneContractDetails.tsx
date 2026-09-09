import React from 'react';
import { Package, Scale, BookOpen } from 'lucide-react';
import { ExtractedMilestone } from '../../types';

interface MilestoneContractDetailsProps {
  milestone: ExtractedMilestone;
  onUpdate: <K extends keyof ExtractedMilestone>(
    field: K,
    value: ExtractedMilestone[K]
  ) => void;
}

export const MilestoneContractDetails: React.FC<MilestoneContractDetailsProps> = ({
  milestone: m,
  onUpdate,
}) => {
  const deliverables = m.deliverables || [`${m.title} 文檔成果報告書`, '成果驗收清冊'];
  const penaltyTerms = m.penaltyTerms || '逾期每日按本案合約總價千分之一計罰違約金';
  const clauseRef = m.clauseReference || '參照標案需求說明書 (RFP) 履約規定';

  return (
    <div
      className="animate-fade-in"
      style={{
        marginTop: '0.65rem',
        paddingTop: '0.65rem',
        borderTop: '1px dashed #cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontSize: '0.775rem',
      }}
    >
      {/* Deliverables */}
      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-sm)',
          padding: '0.5rem 0.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: '#15803d',
            fontWeight: 700,
            marginBottom: '0.3rem',
          }}
        >
          <Package size={14} /> 📦 交付產出物清單 (Deliverables):
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {deliverables.map((item, idx) => (
            <span
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #86efac',
                color: '#166534',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              ✓ {item}
            </span>
          ))}
        </div>
      </div>

      {/* Penalty Terms */}
      <div
        style={{
          background: '#fffbe6',
          border: '1px solid #ffe58f',
          borderRadius: 'var(--radius-sm)',
          padding: '0.5rem 0.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: '#b45309',
            fontWeight: 700,
            marginBottom: '0.2rem',
          }}
        >
          <Scale size={14} /> ⚖️ 逾期違約罰則 (Penalty Terms):
        </div>
        <textarea
          value={penaltyTerms}
          onChange={(e) => onUpdate('penaltyTerms', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          rows={2}
          style={{
            color: '#78350f',
            fontWeight: 600,
            width: '100%',
            background: 'transparent',
            border: '1px solid transparent',
            borderBottom: '1px dashed #fcd34d',
            resize: 'none',
            outline: 'none',
          }}
        />
      </div>

      {/* Clause Reference */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-sm)',
          padding: '0.45rem 0.75rem',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <BookOpen size={14} color="#6366f1" style={{ flexShrink: 0 }} />
        <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>📜 條文依據:</span>
        <input
          type="text"
          value={clauseRef}
          onChange={(e) => onUpdate('clauseReference', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{
            color: '#334155',
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px dashed #cbd5e1',
            width: '100%',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
};
