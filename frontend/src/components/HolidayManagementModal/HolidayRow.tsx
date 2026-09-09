import React from 'react';
import { Holiday } from '../../types';

interface HolidayRowProps {
  holiday: Holiday;
  isWorkday: boolean;
  dayOfWeekName: string;
}

export const HolidayRow: React.FC<HolidayRowProps> = ({
  holiday,
  isWorkday,
  dayOfWeekName,
}) => {
  const name = holiday.name || holiday.description || (isWorkday ? '補行上班日' : '國定假日');
  const category = holiday.category || 'DGPA';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-sm)',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: isWorkday ? '#1e40af' : '#4338ca',
          }}
        >
          {holiday.date}{' '}
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
            ({dayOfWeekName})
          </span>
        </span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            background: isWorkday ? '#dbeafe' : '#d1fae5',
            color: isWorkday ? '#1e40af' : '#047857',
            fontSize: '0.7rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          {isWorkday ? '💼 補班日 (上班)' : '🌴 國定假日 (放假)'}
        </span>

        <span
          style={{
            background: category === 'DGPA' ? '#f1f5f9' : '#f3e8ff',
            color: category === 'DGPA' ? '#475569' : '#7e22ce',
            fontSize: '0.7rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          {category}
        </span>
      </div>
    </div>
  );
};
