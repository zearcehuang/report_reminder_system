import React from 'react';
import { NotificationLog } from '../../types';

interface LogItemProps {
  log: NotificationLog;
  formatDateTime: (isoStr?: string) => string;
}

export const LogItem: React.FC<LogItemProps> = ({ log, formatDateTime }) => {
  const triggerColor =
    log.triggerType === 'Overdue'
      ? '#dc2626'
      : log.triggerType === 'DueToday'
      ? '#d97706'
      : '#2563eb';
  const triggerBg =
    log.triggerType === 'Overdue'
      ? '#fef2f2'
      : log.triggerType === 'DueToday'
      ? '#fffbe6'
      : '#eff6ff';
  const triggerText =
    log.triggerType === 'Overdue'
      ? '已逾期'
      : log.triggerType === 'DueToday'
      ? '今日到期'
      : '預警提醒';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-sm)',
        padding: '0.75rem 1rem',
        fontSize: '0.825rem',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.4rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              background: triggerBg,
              color: triggerColor,
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.7rem',
            }}
          >
            {triggerText}
          </span>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>
            [{log.projectCode}] {log.reportTitle}
          </span>
          <span style={{ color: '#64748b', fontSize: '0.775rem' }}>
            (死線: {log.deadlineDate})
          </span>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {formatDateTime(log.timestamp)}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#475569',
          fontSize: '0.775rem',
        }}
      >
        <div>
          受邀人員:{' '}
          <span style={{ fontWeight: 600, color: '#334155' }}>
            {(log.owners || []).join(', ') || '全體成員'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              background: '#f1f5f9',
              color: '#475569',
              padding: '0.1rem 0.4rem',
              borderRadius: '3px',
              fontWeight: 600,
            }}
          >
            {log.channel}
          </span>
          <span
            style={{
              color: log.status === 'Success' ? '#059669' : '#d97706',
              fontWeight: 700,
            }}
          >
            {log.status === 'Success' ? '✓ 發送成功' : '⚠️ 部分失敗'}
          </span>
        </div>
      </div>
    </div>
  );
};
