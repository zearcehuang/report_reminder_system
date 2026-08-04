import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface ReportDateSectionProps {
  dateMode: 'offset' | 'date';
  setDateMode: (mode: 'offset' | 'date') => void;
  dayOffset: number;
  setDayOffset: (val: number) => void;
  targetDate: string;
  setTargetDate: (val: string) => void;
  getOffsetPreviewDate: () => string;
  getCalculatedOffset: () => number;
}

export const ReportDateSection: React.FC<ReportDateSectionProps> = ({
  dateMode,
  setDateMode,
  dayOffset,
  setDayOffset,
  targetDate,
  setTargetDate,
  getOffsetPreviewDate,
  getCalculatedOffset,
}) => {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
        修改履約死線日期
      </label>

      {/* Mode Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <button
          type="button"
          onClick={() => setDateMode('date')}
          style={{
            background: dateMode === 'date' ? 'rgba(79, 70, 229, 0.1)' : '#f8fafc',
            border: dateMode === 'date' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
            color: dateMode === 'date' ? '#4f46e5' : '#64748b',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
          }}
        >
          <Calendar size={16} /> 指定死線日期 (YYYY-MM-DD)
        </button>

        <button
          type="button"
          onClick={() => setDateMode('offset')}
          style={{
            background: dateMode === 'offset' ? 'rgba(79, 70, 229, 0.1)' : '#f8fafc',
            border: dateMode === 'offset' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
            color: dateMode === 'offset' ? '#4f46e5' : '#64748b',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
          }}
        >
          <Clock size={16} /> 開工日相對天數 (D + N 天)
        </button>
      </div>

      {/* Inputs */}
      {dateMode === 'date' ? (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="date"
              className="input-glass"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{ flex: 1, fontWeight: 700 }}
            />
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              自動反算開工日: <strong style={{ color: '#2563eb' }}>D + {getCalculatedOffset()} 天</strong>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--accent-primary)',
                fontWeight: 700,
              }}>
                D +
              </span>
              <input
                type="number"
                min="0"
                max="1000"
                className="input-glass"
                value={dayOffset}
                onChange={(e) => setDayOffset(Number(e.target.value))}
                style={{ paddingLeft: '2.5rem', fontWeight: 700 }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              計算目標日期: <strong style={{ color: '#2563eb' }}>{getOffsetPreviewDate()}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
