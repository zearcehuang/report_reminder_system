import React from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import { SchedulerStatus } from '../../types';

interface StatusBannerProps {
  status: SchedulerStatus | null;
  logCount: number;
  isScanning: boolean;
  isLoading: boolean;
  onRunScanNow: () => void;
  onReload: () => void;
  formatDateTime: (isoStr?: string) => string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  status,
  logCount,
  isScanning,
  isLoading,
  onRunScanNow,
  onReload,
  formatDateTime,
}) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
        border: '1px solid #bfdbfe',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>排程運作狀態</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '0.2rem',
            fontWeight: 700,
            color: '#1e40af',
            fontSize: '0.9rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'inline-block',
            }}
          />
          {status?.schedulePattern || '每日 09:00 AM 常駐觸發'}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>上次檢查時間</div>
        <div
          style={{
            marginTop: '0.2rem',
            fontWeight: 700,
            color: '#0f172a',
            fontSize: '0.85rem',
          }}
        >
          {formatDateTime(status?.lastScanTime)}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>歷史累計通知紀錄</div>
        <div
          style={{
            marginTop: '0.2rem',
            fontWeight: 700,
            color: '#4338ca',
            fontSize: '1rem',
          }}
        >
          {logCount} 筆
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          className="btn-primary"
          onClick={onRunScanNow}
          disabled={isScanning}
          style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', whiteSpace: 'nowrap' }}
        >
          <Zap size={15} className={isScanning ? 'animate-spin' : ''} />
          <span>{isScanning ? '掃描中...' : '立即掃描發送'}</span>
        </button>

        <button
          className="btn-icon"
          onClick={onReload}
          title="重新載入"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
};
