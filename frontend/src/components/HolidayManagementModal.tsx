import React, { useState, useEffect } from 'react';
import { Holiday } from '../types';
import { ShieldCheck, X, Briefcase, Sun, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { SyncStatusBar } from './HolidayManagementModal/SyncStatusBar';
import { CustomHolidayForm } from './HolidayManagementModal/CustomHolidayForm';
import { HolidayRow } from './HolidayManagementModal/HolidayRow';

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

  const handleAddCustom = async (date: string, name: string, type: 'holiday' | 'workday') => {
    const isHol = type === 'holiday';
    await api.addCustomHoliday({
      date,
      name,
      isHoliday: isHol,
      isWorkday: !isHol,
      category: 'Custom',
    });
    await loadHolidays();
    if (onHolidayUpdated) onHolidayUpdated();
  };

  if (!isOpen) return null;

  const isRoutineWeekend = (h: Holiday): boolean => {
    const name = (h.name || h.description || '').trim();
    if (!name) return true;
    const weekendTerms = ['星期六', '星期日', '週六', '週日', '例假日', '週休二日', '休息日', '星期六、日', '週六日'];
    return weekendTerms.some((term) => name.includes(term));
  };

  const isMakeUpWorkday = (h: Holiday): boolean => {
    return h.isWorkday === true || h.isHoliday === false;
  };

  const nationalHolidays = holidays.filter((h) => !isMakeUpWorkday(h) && !isRoutineWeekend(h));
  const makeUpWorkdays = holidays.filter((h) => isMakeUpWorkday(h));
  const allFiltered = holidays.filter((h) => !isRoutineWeekend(h));

  const sortedNationalHolidays = [...nationalHolidays].sort((a, b) => a.date.localeCompare(b.date));
  const sortedMakeUpWorkdays = [...makeUpWorkdays].sort((a, b) => a.date.localeCompare(b.date));
  const sortedAll = [...allFiltered].sort((a, b) => a.date.localeCompare(b.date));

  const displayItems =
    activeTab === 'holidays'
      ? sortedNationalHolidays
      : activeTab === 'workdays'
      ? sortedMakeUpWorkdays
      : sortedAll;

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
        <SyncStatusBar
          nationalHolidaysCount={sortedNationalHolidays.length}
          makeUpWorkdaysCount={sortedMakeUpWorkdays.length}
          isSyncing={isSyncing}
          syncStatusMsg={syncStatusMsg}
          onSyncDGPA={handleSyncDGPA}
        />

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
        <CustomHolidayForm onAddCustom={handleAddCustom} />

        {/* Holiday Table */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
          {displayItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', fontSize: '0.875rem' }}>
              {activeTab === 'holidays' ? '無國定假日資料' : activeTab === 'workdays' ? '無補班日資料' : '無日曆資料'}
            </div>
          ) : (
            displayItems.map((h) => (
              <HolidayRow
                key={h.id || h.date}
                holiday={h}
                isWorkday={isMakeUpWorkday(h)}
                dayOfWeekName={getDayOfWeekName(h.date)}
              />
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
