import React from 'react';
import { ExtractedMilestone } from '../../types';
import { Clock, ChevronDown, ChevronUp, Sparkles, User } from 'lucide-react';
import { MilestoneContractDetails } from './MilestoneContractDetails';

export const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '啟動籌備': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  '需求分析': { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe' },
  '系統設計': { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
  '系統開發': { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
  '期中審查': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  '測試驗收': { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  '期末結案': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  '維護保固': { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  '定期進度報告': { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
};

interface MilestoneCardProps {
  milestone: ExtractedMilestone;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: (e: React.MouseEvent) => void;
  onUpdate: <K extends keyof ExtractedMilestone>(
    field: K,
    value: ExtractedMilestone[K]
  ) => void;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone: m,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onUpdate,
}) => {
  const stageStyle = STAGE_COLORS[m.stage || ''] || {
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
  };

  return (
    <div
      onClick={onToggleSelect}
      style={{
        background: m.selected ? '#ffffff' : '#f8fafc',
        border: m.selected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.15rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: m.selected
          ? '0 4px 12px rgba(79, 70, 229, 0.08)'
          : '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        <input
          type="checkbox"
          checked={m.selected}
          onChange={onToggleSelect}
          style={{
            marginTop: '0.35rem',
            width: '17px',
            height: '17px',
            accentColor: '#4f46e5',
            cursor: 'pointer',
          }}
        />

        <div style={{ flex: 1 }}>
          {/* Top Row: Title + Stage + DayOffset + Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.35rem',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
              {m.stage && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    background: stageStyle.bg,
                    color: stageStyle.text,
                    border: `1px solid ${stageStyle.border}`,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.stage}
                </span>
              )}
              <input
                type="text"
                value={m.title}
                onChange={(e) => onUpdate('title', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: '0.95rem',
                  color: m.selected ? '#0f172a' : '#334155',
                  fontWeight: 700,
                  border: '1px solid transparent',
                  borderBottom: '1px dashed #cbd5e1',
                  background: 'transparent',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Day Offset Badge */}
              <span
                style={{
                  background: '#e0e7ff',
                  color: '#3730a3',
                  padding: '0.15rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Clock size={12} color="#4f46e5" />
                D +{' '}
                <input
                  type="number"
                  value={m.dayOffset ?? 0}
                  onChange={(e) => onUpdate('dayOffset', parseInt(e.target.value, 10) || 0)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '42px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed #818cf8',
                    color: '#3730a3',
                    fontWeight: 700,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <span>{m.dayType === 'workday' ? '工作天' : '日曆天'}</span>
              </span>

              <button
                className="btn-icon"
                onClick={onToggleExpand}
                style={{ padding: '0.2rem' }}
                title={isExpanded ? '折疊五維度合約細節' : '展開五維度合約細節'}
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* Snippet / Original Text */}
          <p style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '0.45rem', fontStyle: 'italic' }}>
            {m.originalText || m.title || ''}
          </p>

          {/* Badges Bar */}
          <div
            style={{
              display: 'flex',
              gap: '0.45rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: isExpanded ? '0.65rem' : '0',
            }}
          >
            {m.location && (
              <span
                style={{
                  fontSize: '0.7rem',
                  color: '#4338ca',
                  fontWeight: 600,
                  background: '#e0e7ff',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '4px',
                }}
              >
                📍 {m.location}
              </span>
            )}

            {m.source?.includes('gemini') ? (
              <span
                style={{
                  fontSize: '0.7rem',
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                  color: '#4338ca',
                  border: '1px solid #c7d2fe',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 700,
                }}
              >
                <Sparkles size={11} color="#6366f1" />
                Gemini AI ({m.confidence || 96}%)
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.7rem',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 600,
                }}
              >
                ⚡ 啟發式規則 ({m.confidence || 85}%)
              </span>
            )}

            {(m.owners || ['張小明 (PM)']).map((owner) => (
              <span
                key={owner}
                style={{
                  fontSize: '0.725rem',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  background: '#f1f5f9',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                }}
              >
                <User size={12} color="#4f46e5" /> {owner}
              </span>
            ))}
          </div>

          {/* Collapsible 5D Contract Details */}
          {isExpanded && (
            <MilestoneContractDetails milestone={m} onUpdate={onUpdate} />
          )}
        </div>
      </div>
    </div>
  );
};
