import React, { useState, useEffect } from 'react';
import { Holiday } from '../types';
import { ShieldCheck, X, RefreshCw, Plus, Check, Briefcase, Sun, Calendar } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'holidays' | 'workdays' | 'all'>('holidays');
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'holiday' | 'workday'>('holiday');

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
    const isHol = newType === 'holiday';
    await api.addCustomHoliday({
      date: newDate,
      name: newName,
      isHoliday: isHol,
      isWorkday: !isHol,
      category: 'Custom',
    });
    setNewDate('');
    setNewName('');
    await loadHolidays();
    if (onHolidayUpdated) onHolidayUpdated();
  };

  if (!isOpen) return null;

  const isRoutineWeekend = (h: Holiday): boolean => {
    const name = (h.name || (h as any).description || '').trim();
    if (!name) return true;
    const weekendTerms = ['星期六', '星期日', '週六', '週日', '例假日', '週休二日', '休息日', '星期六、日', '週六日'];
    return weekendTerms.some(term => name.includes(term));
  };

  const isMakeUpWorkday = (h: Holiday): boolean => {
    return h.isWorkday === true || h.isHoliday === false;
  };

  const nationalHolidays = holidays.filter(h => !isMakeUpWorkday(h) && !isRoutineWeekend(h));
  const makeUpWorkdays = holidays.filter(h => isMakeUpWorkday(h));
  const allFiltered = holidays.filter(h => !isRoutineWeekend(h));

  const sortedNationalHolidays = [...nationalHolidays].sort((a, b) => a.date.localeCompare(b.date));
  const sortedMakeUpWorkdays = [...makeUpWorkdays].sort((a, b) => a.date.localeCompare(b.date));
  const sortedAll = [...allFiltered].sort((a, b) => a.date.localeCompare(b.date));

  const displayItems = activeTab === 'holidays' ? sortedNationalHolidays : activeTab === 'workdays' ? sortedMakeUpWorkdays : sortedAll;

  const getDayOfWeekName = (dateStr: string) => {
    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : days[d.getDay()];
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '750px', padding: '1.75rem' }}>
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
              <h2 style={{ fontSize: '1.2rem' }}>行政院人事行政總處 (DGPA) 行事曆與國定假日/補班日管理</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                自動同步政府行政機關辦公日曆表，精確設定國定假日與彈性補班日
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Sync Button & Status */}
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
              DGPA 2026/2027 辦公日曆連線狀態: 正常運作中
            </div>
            <div style={{ fontSize: '0.775rem', color: '#065f46' }}>
              已載入 <strong>{sortedNationalHolidays.length}</strong> 天國定假日、<strong>{sortedMakeUpWorkdays.length}</strong> 天補班日 (已按日期依序排列)
            </div>
          </div>

          <button
            className="btn-success"
            onClick={handleSyncDGPA}
            disabled={isSyncing}
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? '同步中...' : '同步 DGPA 行事曆'}</span>
          </button>
        </div>

        {syncStatusMsg && (
          <div className="animate-fade-in" style={{
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
          }}>
            <Check size={16} /> {syncStatusMsg}
          </div>
        )}

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('holidays')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'holidays' ? '#d1fae5' : 'transparent',
              color: activeTab === 'holidays' ? '#047857' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            <Sun size={15} /> 國定假日 ({sortedNationalHolidays.length})
          </button>

          <button
            onClick={() => setActiveTab('workdays')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'workdays' ? '#dbeafe' : 'transparent',
              color: activeTab === 'workdays' ? '#1e40af' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            <Briefcase size={15} /> 補班日 ({sortedMakeUpWorkdays.length})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'all' ? '#f3e8ff' : 'transparent',
              color: activeTab === 'all' ? '#6b21a8' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            <Calendar size={15} /> 全部明細 ({sortedAll.length})
          </button>
        </div>

        {/* Custom Holiday / Workday Add Form */}
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'holiday' | 'workday')}
            className="input-glass"
            style={{ width: '130px', fontSize: '0.825rem', padding: '0.45rem 0.5rem' }}
          >
            <option value="holiday">🌴 國定假日</option>
            <option value="workday">💼 補班日</option>
          </select>
          <input
            type="date"
            className="input-glass"
            style={{ width: '160px' }}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
          <input
            type="text"
            className="input-glass"
            placeholder={newType === 'holiday' ? "自訂放假日名稱 (例: 公司創立紀念日)" : "自訂補班日說明 (例: 補春節連假彈性放假)"}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <button type="submit" className="btn-secondary" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
            <Plus size={16} /> 新增
          </button>
        </form>

        {/* Holiday Table */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
          {displayItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', fontSize: '0.875rem' }}>
              {activeTab === 'holidays' ? '無國定假日資料' : activeTab === 'workdays' ? '無補班日資料' : '無日曆資料'}
            </div>
          ) : (
            displayItems.map((h) => {
              const name = h.name || (h as any).description || (isMakeUpWorkday(h) ? '補行上班日' : '國定假日');
              const category = h.category || (h as any).source || 'DGPA';
              const isWork = isMakeUpWorkday(h);
              const dayStr = getDayOfWeekName(h.date);

              return (
                <div
                  key={h.id || h.date}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isWork ? '#1e40af' : '#4338ca' }}>
                      {h.date} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>({dayStr})</span>
                    </span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      background: isWork ? '#dbeafe' : '#d1fae5',
                      color: isWork ? '#1e40af' : '#047857',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}>
                      {isWork ? '💼 補班日 (上班)' : '🌴 國定假日 (放假)'}
                    </span>

                    <span style={{
                      background: category === 'DGPA' ? '#f1f5f9' : '#f3e8ff',
                      color: category === 'DGPA' ? '#475569' : '#7e22ce',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}>
                      {category}
                    </span>
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

