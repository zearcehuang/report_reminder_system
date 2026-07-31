import React, { useState, useEffect } from 'react';
import { NotificationLog, SchedulerStatus } from '../types';
import { Clock, X, RefreshCw, Zap, Trash2, Search, CheckCircle2, AlertTriangle, Send, Calendar, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

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
        api.getNotificationLogs()
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

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.projectCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reportTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.owners || []).some(o => o.toLowerCase().includes(searchTerm.toLowerCase()));

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
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>排程運作狀態</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              {status?.schedulePattern || '每日 09:00 AM 常駐觸發'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>上次檢查時間</div>
            <div style={{ marginTop: '0.2rem', fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
              {formatDateTime(status?.lastScanTime)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>歷史累計通知紀錄</div>
            <div style={{ marginTop: '0.2rem', fontWeight: 700, color: '#4338ca', fontSize: '1rem' }}>
              {logs.length} 筆
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              onClick={handleRunScanNow}
              disabled={isScanning}
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', whiteSpace: 'nowrap' }}
            >
              <Zap size={15} className={isScanning ? 'animate-spin' : ''} />
              <span>{isScanning ? '掃描中...' : '立即掃描發送'}</span>
            </button>

            <button
              className="btn-icon"
              onClick={loadData}
              title="重新載入"
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

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
            filteredLogs.map((log) => {
              const triggerColor = log.triggerType === 'Overdue' ? '#dc2626' : log.triggerType === 'DueToday' ? '#d97706' : '#2563eb';
              const triggerBg = log.triggerType === 'Overdue' ? '#fef2f2' : log.triggerType === 'DueToday' ? '#fffbe6' : '#eff6ff';
              const triggerText = log.triggerType === 'Overdue' ? '已逾期' : log.triggerType === 'DueToday' ? '今日到期' : '預警提醒';

              return (
                <div
                  key={log.id}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        background: triggerBg,
                        color: triggerColor,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                      }}>
                        {triggerText}
                      </span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        [{log.projectCode}] {log.reportTitle}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.775rem' }}>
                        (死線: {log.deadlineDate})
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#475569', fontSize: '0.775rem' }}>
                    <div>
                      受邀人員: <span style={{ fontWeight: 600, color: '#334155' }}>{(log.owners || []).join(', ') || '全體成員'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: 600 }}>
                        {log.channel}
                      </span>
                      <span style={{
                        color: log.status === 'Success' ? '#059669' : '#d97706',
                        fontWeight: 700
                      }}>
                        {log.status === 'Success' ? '✓ 發送成功' : '⚠️ 部分失敗'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
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
