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
  const [advanceDays, setAdvanceDays] = useState(project.advanceNoticeDays);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setDDay(project.dDay);
    setAdvanceDays(project.advanceNoticeDays);
  }, [project]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProject({ dDay, advanceNoticeDays: advanceDays });
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
            <h3 style={{ fontSize: '1.1rem' }}>專案啟動日 (D-Day) 與提前提醒設定</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              設定合約/專案開工日起算點 (D-Day)，系統將自動推算 10 項履約里程碑繳交期限
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
            <Sparkles size={16} /> 已更新 D-Day 並重新計算行事曆！
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: '1.25rem', alignItems: 'flex-end' }}>
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
            <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Info size={12} /> 開工首日為: {dDay} ({getDayOfWeek(dDay)})
            </div>
          )}
        </div>

        {/* Advance Warning Days */}
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
             Teams / Email 提前提醒天數
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              min="1"
              max="60"
              className="input-glass"
              style={{ paddingLeft: '2.5rem', fontSize: '0.95rem', fontWeight: 600 }}
              value={advanceDays}
              onChange={(e) => setAdvanceDays(Number(e.target.value))}
            />
            <Clock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            在繳交死線前 {advanceDays} 天自動發送通知
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
            <span>{isSaving ? '儲存中...' : '套用並重算死線'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
