import React from 'react';
import { RefreshCw, Check } from 'lucide-react';

interface SyncStatusBarProps {
  nationalHolidaysCount: number;
  makeUpWorkdaysCount: number;
  isSyncing: boolean;
  syncStatusMsg: string | null;
  onSyncDGPA: () => void;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({
  nationalHolidaysCount,
  makeUpWorkdaysCount,
  isSyncing,
  syncStatusMsg,
  onSyncDGPA,
}) => {
  return (
    <>
      <div
        style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
            DGPA 2026/2027 辦公日曆連線狀態: 正常運作中
          </div>
          <div style={{ fontSize: '0.775rem', color: '#065f46' }}>
            已載入 <strong>{nationalHolidaysCount}</strong> 天國定假日、
            <strong>{makeUpWorkdaysCount}</strong> 天補班日 (已按日期依序排列)
          </div>
        </div>

        <button
          className="btn-success"
          onClick={onSyncDGPA}
          disabled={isSyncing}
          style={{ fontSize: '0.85rem' }}
        >
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          <span>{isSyncing ? '同步中...' : '同步 DGPA 行事曆'}</span>
        </button>
      </div>

      {syncStatusMsg && (
        <div
          className="animate-fade-in"
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Check size={16} /> {syncStatusMsg}
        </div>
      )}
    </>
  );
};
