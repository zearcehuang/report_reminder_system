import React, { useState, useEffect } from 'react';
import { Holiday } from '../types';
import { ShieldCheck, X, RefreshCw, Plus, Upload, Calendar, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onHolidayUpdated?: () => void;
}

export const HolidayManagementModal: React.FC<Props> = ({ isOpen, onClose, onHolidayUpdated }) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadHolidays();
    }
  }, [isOpen]);

  const loadHolidays = async () => {
    const list = await api.getHolidays();
    setHolidays(list);
  };

  const handleSyncDGPA = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await api.syncDGPAHolidays();
      setSyncStatusMsg(res.message);
      await loadHolidays();
      if (onHolidayUpdated) onHolidayUpdated();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newName) return;
    await api.addCustomHoliday({
      date: newDate,
      name: newName,
      isHoliday: true,
      category: 'Custom',
    });
    setNewDate('');
    setNewName('');
    await loadHolidays();
    if (onHolidayUpdated) onHolidayUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '720px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}>
              <ShieldCheck size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>行政院人事行政總處 (DGPA) 行事曆與國定假日管理</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                自動同步政府行政機關辦公日曆表，避開補班日與國定假日
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Sync Button & Status */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#34d399', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
              DGPA 2026/2027 辦公日曆連線狀態: 正常運作中
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              目前已載入 {holidays.length} 天國定假日與彈性放假日資料
            </div>
          </div>

          <button
            className="btn-success"
            onClick={handleSyncDGPA}
            disabled={isSyncing}
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? '同步中...' : '立即同步 DGPA 資料庫'}</span>
          </button>
        </div>

        {syncStatusMsg && (
          <div className="animate-fade-in" style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <Check size={16} /> {syncStatusMsg}
          </div>
        )}

        {/* Custom Holiday Add Form */}
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <input
            type="date"
            className="input-glass"
            style={{ width: '170px' }}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
          <input
            type="text"
            className="input-glass"
            placeholder="自訂休假日名稱 (例如: 公司創立紀念日)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <button type="submit" className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            <Plus size={16} /> 新增自訂休假
          </button>
        </form>

        {/* Holiday Table */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
          {holidays.map((h) => (
            <div
              key={h.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--surface-glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#818cf8' }}>
                  {h.date}
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{h.name}</span>
              </div>
              <span style={{
                background: h.category === 'DGPA' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                color: h.category === 'DGPA' ? '#34d399' : '#c084fc',
                fontSize: '0.7rem',
                padding: '0.1rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 600,
              }}>
                {h.category}
              </span>
            </div>
          ))}
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
