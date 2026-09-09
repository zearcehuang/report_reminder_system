import React from 'react';
import { ScheduleItem } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  User,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import { ScheduleCardActions } from './ScheduleCardActions';

interface ScheduleCardProps {
  item: ScheduleItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEditScheduleDate?: (item: ScheduleItem) => void;
  onToggleSubmitted: (id: string, isCompleted: boolean) => Promise<void>;
  onSelectForOutlook: (item: ScheduleItem) => void;
  onDeleteSingle: (item: ScheduleItem) => void;
  isDeleting: boolean;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onEditScheduleDate,
  onToggleSubmitted,
  onSelectForOutlook,
  onDeleteSingle,
  isDeleting,
}) => {
  const itemIdStr = String(item.id);

  const getStatusBadge = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'Submitted':
        return (
          <span className="badge badge-submitted">
            <CheckCircle2 size={13} /> 已繳交驗收
          </span>
        );
      case 'Sent':
        return (
          <span className="badge badge-sent">
            <Send size={13} /> 已發送提醒
          </span>
        );
      case 'Failed':
        return (
          <span className="badge badge-failed">
            <AlertTriangle size={13} /> 發送失敗
          </span>
        );
      default:
        return (
          <span className="badge badge-pending">
            <Clock size={13} /> 等待繳交 (Pending)
          </span>
        );
    }
  };

  const daysList =
    item.advanceNoticeDaysList && item.advanceNoticeDaysList.length > 0
      ? item.advanceNoticeDaysList
      : [item.advanceNoticeDays || 3];

  const noticePills = daysList
    .sort((a, b) => b - a)
    .map((days) => {
      const d = new Date(item.calculatedDate);
      d.setDate(d.getDate() - days);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${days}天前(${mm}/${dd})`;
    });

  return (
    <div
      style={{
        position: 'relative',
        background: isSelected ? '#fff1f2' : '#ffffff',
        border: isSelected ? '2px solid #f43f5e' : '1px solid var(--surface-glass-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'grid',
        gridTemplateColumns: 'auto 1.8fr 1.2fr 1fr auto',
        gap: '1.25rem',
        alignItems: 'center',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className="timeline-card-hover"
    >
      {/* Checkbox for batch select */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(itemIdStr)}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
      </div>

      {/* Timeline node dot */}
      <div
        style={{
          position: 'absolute',
          left: '-1.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background:
            item.status === 'Submitted'
              ? '#10b981'
              : item.wasShiftedByHoliday
              ? '#9333ea'
              : '#4f46e5',
          border: '3px solid #ffffff',
          boxShadow:
            item.status === 'Submitted'
              ? '0 0 10px rgba(16, 185, 129, 0.4)'
              : '0 0 10px rgba(79, 70, 229, 0.4)',
        }}
      />

      {/* Left: Milestone Title & Info */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.35rem',
          }}
        >
          <span
            style={{
              background: 'rgba(79, 70, 229, 0.12)',
              color: '#4f46e5',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            D + {item.dDayOffset} 天
          </span>
          <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{item.title}</h4>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <User size={13} color="#64748b" /> {item.owners.join(', ')}
          </span>
        </div>

        {item.deliverables && item.deliverables.length > 0 && (
          <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {item.deliverables.slice(0, 3).map((deliv, i) => (
              <span
                key={i}
                style={{
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.7rem',
                  padding: '0.05rem 0.35rem',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                📦 {deliv}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Middle: Calculated Date & Holiday Shift Badge */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '0.25rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>死線日期:</span>
          <strong
            style={{
              fontSize: '1rem',
              color: item.wasShiftedByHoliday ? '#9333ea' : 'var(--text-primary)',
            }}
          >
            {item.calculatedDate}
          </strong>
          {onEditScheduleDate && (
            <button
              type="button"
              onClick={() => onEditScheduleDate(item)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4f46e5',
                cursor: 'pointer',
                padding: '0.1rem 0.25rem',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title="修改此履約報告死線日期"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>

        <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {item.wasShiftedByHoliday && (
            <span
              className="badge badge-holiday"
              style={{ fontSize: '0.7rem', display: 'inline-flex', width: 'fit-content' }}
            >
              <ShieldAlert size={11} /> 因 {item.holidayName} 避開假日順延
            </span>
          )}
          <span
            style={{
              fontSize: '0.725rem',
              color: '#2563eb',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Clock size={11} color="#2563eb" /> 預警天數: {noticePills.join(' • ')}
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        {getStatusBadge(item.status)}
        {item.submittedAt && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            於 {new Date(item.submittedAt).toLocaleDateString()} 完成
          </div>
        )}
      </div>

      {/* Actions */}
      <ScheduleCardActions
        item={item}
        onEditScheduleDate={onEditScheduleDate}
        onToggleSubmitted={onToggleSubmitted}
        onSelectForOutlook={onSelectForOutlook}
        onDeleteSingle={onDeleteSingle}
        isDeleting={isDeleting}
      />
    </div>
  );
};
