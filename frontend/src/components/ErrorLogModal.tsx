import React, { useState, useEffect } from 'react';
import { errorLogger, LogEntry } from '../services/logger';
import { Terminal, X, RefreshCw, Trash2, Copy, Check, Server, Monitor } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ErrorLogModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'frontend' | 'backend'>('frontend');
  const [frontendLogs, setFrontendLogs] = useState<LogEntry[]>([]);
  const [backendLogsText, setBackendLogsText] = useState<string>('');
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  const refreshLogs = async () => {
    setFrontendLogs([...errorLogger.getLogs()]);
    setLoadingBackend(true);
    try {
      const bLogs = await errorLogger.fetchBackendLogs();
      setBackendLogsText(bLogs);
    } finally {
      setLoadingBackend(false);
    }
  };

  const handleClearFrontend = () => {
    errorLogger.clearLogs();
    setFrontendLogs([]);
  };

  const handleCopyLogs = () => {
    const textToCopy = activeTab === 'frontend'
      ? JSON.stringify(frontendLogs, null, 2)
      : backendLogsText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '850px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              padding: '0.6rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}>
              <Terminal size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>前後端 Error Log 診斷控制台</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                即時追蹤前端 React 例外與後端 Express API 錯誤紀錄
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Controls & Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setActiveTab('frontend')}
              style={{
                background: activeTab === 'frontend' ? '#ffffff' : 'transparent',
                border: 'none',
                color: activeTab === 'frontend' ? '#ef4444' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: activeTab === 'frontend' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Monitor size={14} /> 前端系統 Logs ({frontendLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('backend')}
              style={{
                background: activeTab === 'backend' ? '#ffffff' : 'transparent',
                border: 'none',
                color: activeTab === 'backend' ? '#ef4444' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: activeTab === 'backend' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Server size={14} /> 後端 Server Log (/data/error.log)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={refreshLogs} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              <RefreshCw size={14} className={loadingBackend ? 'animate-spin' : ''} /> 重新整理
            </button>
            <button className="btn-secondary" onClick={handleCopyLogs} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? '已複製內容' : '複製內容'}
            </button>
            {activeTab === 'frontend' && (
              <button
                className="btn-secondary"
                onClick={handleClearFrontend}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fee2e2' }}
              >
                <Trash2 size={14} /> 清除前端 Logs
              </button>
            )}
          </div>
        </div>

        {/* Log Viewer Container */}
        {activeTab === 'frontend' ? (
          <div style={{
            background: '#090d16',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            maxHeight: '400px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            {frontendLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {frontendLogs.map((entry) => (
                  <div key={entry.id} style={{ borderBottom: '1px dashed #1e293b', paddingBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                      <span style={{ background: '#7f1d1d', color: '#fca5a5', padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 700 }}>
                        {entry.source}
                      </span>
                      <strong style={{ color: '#f8fafc' }}>{entry.message}</strong>
                    </div>
                    {entry.stack && (
                      <pre style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.725rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {entry.stack}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                目前沒有前端 Error Log 紀錄 (系統運作正常)
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: '#090d16',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            maxHeight: '400px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.775rem',
            color: '#38bdf8',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            border: '1px solid rgba(56, 189, 248, 0.3)',
          }}>
            {loadingBackend ? '從伺服器讀取後端 error.log 中...' : (backendLogsText || '尚無後端錯誤紀錄')}
          </div>
        )}
      </div>
    </div>
  );
};
