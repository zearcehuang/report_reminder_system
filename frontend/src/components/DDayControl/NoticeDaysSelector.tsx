import React, { useState, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface NoticeDaysSelectorProps {
  noticeDaysList: number[];
  setNoticeDaysList: React.Dispatch<React.SetStateAction<number[]>>;
}

const PRESET_OPTIONS = [1, 3, 5, 7, 14, 30];

export const NoticeDaysSelector: React.FC<NoticeDaysSelectorProps> = ({
  noticeDaysList,
  setNoticeDaysList,
}) => {
  const [customDayInput, setCustomDayInput] = useState('');

  const handleToggleDay = useCallback((day: number) => {
    setNoticeDaysList((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort((a, b) => b - a);
      }
    });
  }, [setNoticeDaysList]);

  const handleAddCustomDay = useCallback(() => {
    const val = parseInt(customDayInput, 10);
    if (!isNaN(val) && val > 0 && !noticeDaysList.includes(val)) {
      setNoticeDaysList((prev) => [...prev, val].sort((a, b) => b - a));
      setCustomDayInput('');
    }
  }, [customDayInput, noticeDaysList, setNoticeDaysList]);

  const sortedDays = [...noticeDaysList].sort((a, b) => b - a);

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)',
          marginBottom: '0.4rem',
          fontWeight: 600,
        }}
      >
        📅 Outlook 會議預警提醒天數 (可複選)
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        {PRESET_OPTIONS.map((day) => {
          const isSelected = noticeDaysList.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleToggleDay(day)}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.775rem',
                fontWeight: 600,
                border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                background: isSelected ? '#eff6ff' : '#ffffff',
                color: isSelected ? '#1d4ed8' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Clock size={12} color={isSelected ? '#2563eb' : '#94a3b8'} />
              {day} 天前
              {isSelected && <span style={{ fontSize: '0.7rem', color: '#2563eb' }}>✓</span>}
            </button>
          );
        })}

        {/* Custom Day Input Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <input
            type="number"
            min="1"
            max="90"
            placeholder="+ 自訂天數"
            value={customDayInput}
            onChange={(e) => setCustomDayInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomDay();
              }
            }}
            style={{
              width: '90px',
              padding: '0.3rem 0.5rem',
              fontSize: '0.75rem',
              border: '1px dashed #94a3b8',
              borderRadius: '6px',
              background: '#ffffff',
              outline: 'none',
            }}
          />
          {customDayInput && (
            <button
              type="button"
              onClick={handleAddCustomDay}
              className="btn-primary"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
            >
              新增
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          color: '#475569',
          marginTop: '0.4rem',
          fontWeight: 500,
        }}
      >
        目前已選預警天數:{' '}
        <strong style={{ color: '#2563eb' }}>
          {sortedDays.map((d) => `${d}天前`).join('、')}
        </strong>{' '}
        (死線前將自動發送 {noticeDaysList.length} 次提醒)
      </div>
    </div>
  );
};
