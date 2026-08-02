import React from 'react';
import { Clock } from 'lucide-react';

interface NoticeDaysPickerProps {
  presetDayOptions: number[];
  selectedNoticeDays: number[];
  calculatedDate: string | undefined;
  onToggleNoticeDay: (day: number) => void;
  getNoticeDateStr: (dueDateIso: string | undefined, daysBefore: number) => string;
}

export const NoticeDaysPicker: React.FC<NoticeDaysPickerProps> = ({
  presetDayOptions,
  selectedNoticeDays,
  calculatedDate,
  onToggleNoticeDay,
  getNoticeDateStr,
}) => {
  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 'var(--radius-md)',
      padding: '0.85rem 1rem',
      marginBottom: '1.25rem',
    }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Clock size={14} color="#0078d4" /> 選擇 Outlook 會議預警包含的天數 (可複選):
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        {presetDayOptions.map((day) => {
          const isSelected = selectedNoticeDays.includes(day);
          const datePreview = getNoticeDateStr(calculatedDate, day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onToggleNoticeDay(day)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.775rem',
                fontWeight: 600,
                border: isSelected ? '2px solid #0078d4' : '1px solid #cbd5e1',
                background: isSelected ? '#eff6ff' : '#ffffff',
                color: isSelected ? '#005a9e' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{day} 天前預警 ({datePreview})</span>
              {isSelected && <span style={{ fontSize: '0.75rem', color: '#0078d4', fontWeight: 700 }}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
