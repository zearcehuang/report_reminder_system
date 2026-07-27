import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Calendar, Clock, Sparkles, Save, Info } from 'lucide-react';

interface Props {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  milestoneCount: number;
}

export const DDayControl: React.FC<Props> = ({ project, onUpdateProject, milestoneCount }) => {
  const [dDay, setDDay] = useState(project.dDay);
  const [noticeDaysList, setNoticeDaysList] = useState<number[]>(
    project.advanceNoticeDaysList && project.advanceNoticeDaysList.length > 0
      ? project.advanceNoticeDaysList
      : [project.advanceNoticeDays || 3]
  );
  const [customDayInput, setCustomDayInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setDDay(project.dDay);
    setNoticeDaysList(
      project.advanceNoticeDaysList && project.advanceNoticeDaysList.length > 0
        ? project.advanceNoticeDaysList
        : [project.advanceNoticeDays || 3]
    );
  }, [project]);

  const presetOptions = [1, 3, 5, 7, 14, 30];

  const handleToggleDay = (day: number) => {
    let updated: number[];
    if (noticeDaysList.includes(day)) {
      if (noticeDaysList.length === 1) return; // Keep at least one
      updated = noticeDaysList.filter((d) => d !== day);
    } else {
      updated = [...noticeDaysList, day].sort((a, b) => b - a);
    }
    setNoticeDaysList(updated);
  };

  const handleAddCustomDay = () => {
    const val = parseInt(customDayInput, 10);
    if (!isNaN(val) && val > 0 && !noticeDaysList.includes(val)) {
      const updated = [...noticeDaysList, val].sort((a, b) => b - a);
      setNoticeDaysList(updated);
      setCustomDayInput('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const maxDay = noticeDaysList.length > 0 ? Math.max(...noticeDaysList) : 3;
      await onUpdateProject({
        dDay,
        advanceNoticeDays: maxDay,
        advanceNoticeDaysList: noticeDaysList.sort((a, b) => b - a),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const getDayOfWeek = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return days[date.getDay()];
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>專案啟動日 (D-Day) 與多重提前預警設定</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              設定合約/專案開工日起算點 (D-Day)，可多選 Teams / Email 於死線前 1 天、3 天、7 天多重發送預警
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="animate-fade-in" style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.825rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <Sparkles size={16} /> 已套用多重預警 ({noticeDaysList.join(', ')} 天前)！
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.8fr auto', gap: '1.25rem', alignItems: 'flex-end' }}>
        {/* D-Day Date Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
            專案開工/啟動日期 (D-Day Baseline)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              className="input-glass"
              style={{ paddingLeft: '2.5rem', fontSize: '0.95rem', fontWeight: 600 }}
              value={dDay}
              onChange={(e) => setDDay(e.target.value)}
            />
            <Calendar size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          {dDay && (
            <div style={{ fontSize: '0.75rem', color: '#4338ca', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              <Info size={12} /> 開工首日為: {dDay} ({getDayOfWeek(dDay)})
            </div>
          )}
        </div>

        {/* Multi-Select Advance Warning Days */}
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
            🔔 Teams / Email 提前發送頻率 (可複選多個預警天數)
          </label>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
            {presetOptions.map((day) => {
              const isSelected = noticeDaysList.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleToggleDay(day)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    color: isSelected ? '#1d4ed8' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Clock size={12} color={isSelected ? '#2563eb' : '#94a3b8'} />
                  {day} 天前
                  {isSelected && <span style={{ fontSize: '0.7rem', color: '#2563eb' }}>✓</span>}
                </button>
              );
            })}

            {/* Custom Day Input Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="number"
                min="1"
                max="90"
                placeholder="+ 自訂天數"
                value={customDayInput}
                onChange={(e) => setCustomDayInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDay();
                  }
                }}
                style={{
                  width: '90px',
                  padding: '0.3rem 0.5rem',
                  fontSize: '0.75rem',
                  border: '1px dashed #94a3b8',
                  borderRadius: '6px',
                  background: '#ffffff',
                  outline: 'none',
                }}
              />
              {customDayInput && (
                <button
                  type="button"
                  onClick={handleAddCustomDay}
                  className="btn-primary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                >
                  新增
                </button>
              )}
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.4rem', fontWeight: 500 }}>
            目前已選預警天數: <strong style={{ color: '#2563eb' }}>{noticeDaysList.sort((a, b) => b - a).map(d => `${d}天前`).join('、')}</strong> (死線前將自動發送 {noticeDaysList.length} 次提醒)
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '0.65rem 1.5rem', height: '42px' }}
          >
            <Save size={18} />
            <span>{isSaving ? '儲存中...' : '套用預警與死線'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
