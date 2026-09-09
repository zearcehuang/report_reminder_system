import React, { useState, useEffect } from 'react';
import { NotificationLog, SchedulerStatus } from '../types';
import { Clock, X, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { StatusBanner } from './SchedulerLogModal/StatusBanner';
import { LogItem } from './SchedulerLogModal/LogItem';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SchedulerLogModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [st, lg] = await Promise.all([
        api.getSchedulerStatus(),
        api.getNotificationLogs(),
      ]);
      setStatus(st);
      setLogs(lg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunScanNow = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await api.triggerSchedulerRunNow();
      setScanMessage(res.message);
      await loadData();
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('確定要清空所有背景排程通知發送日誌嗎？')) return;
    await api.clearNotificationLogs();
    await loadData();
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.projectCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reportTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.owners || []).some((o) => o.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    return log.triggerType === filterType;
  });

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '尚未執行';
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleString('zh-TW', { hour12: false });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '840px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            }}>
              <Clock size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>背景自動排程與通知發送日誌</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                每日自動稽核專案履約死線，向負責同仁派發 MS Teams 與 Outlook 預警通知
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Status Dashboard Banner */}
        <StatusBanner
          status={status}
          logCount={logs.length}
          isScanning={isScanning}
          isLoading={isLoading}
          onRunScanNow={handleRunScanNow}
          onReload={loadData}
          formatDateTime={formatDateTime}
        />

        {scanMessage && (
          <div className="animate-fade-in" style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            fontSize: '0.825rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <CheckCircle2 size={16} /> {scanMessage}
          </div>
        )}

        {/* Filter & Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="input-glass"
                style={{ paddingLeft: '2.1rem', fontSize: '0.825rem', width: '100%' }}
                placeholder="搜尋專案、報告名稱、負責人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="input-glass"
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.6rem', width: '130px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">全部類型 ({logs.length})</option>
              <option value="AdvanceNotice">🔔 預警提醒</option>
              <option value="DueToday">📌 今日到期</option>
              <option value="Overdue">⚠️ 已逾期通知</option>
            </select>
          </div>

          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                color: '#ef4444',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Trash2 size={14} /> 清空日誌
            </button>
          )}
        </div>

        {/* Logs Table List */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem 1rem', fontSize: '0.875rem' }}>
              {logs.length === 0 ? '目前尚無背景排程通知紀錄（系統將於每日 09:00 AM 自動稽核）' : '無符合條件的通知紀錄'}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <LogItem key={log.id} log={log} formatDateTime={formatDateTime} />
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
