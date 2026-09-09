import React, { useState, useEffect, memo, useCallback } from 'react';
import { Project, ProjectOwner, Contact } from '../types';
import { Calendar, Sparkles, Save, Info, Users } from 'lucide-react';
import { OwnerList } from './DDayControl/OwnerList';
import { AddOwnerForm } from './DDayControl/AddOwnerForm';
import { NoticeDaysSelector } from './DDayControl/NoticeDaysSelector';

interface Props {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  milestoneCount: number;
  contacts?: Contact[];
}

export const DDayControl: React.FC<Props> = memo(({ project, onUpdateProject }) => {
  const [dDay, setDDay] = useState(project.dDay);
  const [projectOwners, setProjectOwners] = useState<ProjectOwner[]>([]);
  const [noticeDaysList, setNoticeDaysList] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setDDay(project.dDay);
    setNoticeDaysList(
      project.advanceNoticeDaysList && project.advanceNoticeDaysList.length > 0
        ? project.advanceNoticeDaysList
        : [project.advanceNoticeDays || 3]
    );

    if (project.projectOwners && project.projectOwners.length > 0) {
      setProjectOwners(project.projectOwners);
    } else if (project.ownerEmail || project.ownerName) {
      setProjectOwners([
        {
          id: 'po-default',
          role: 'PM (專案經理)',
          name: project.ownerName || '專案經理',
          email: project.ownerEmail || 'alex.chang@company.com',
        },
      ]);
    } else {
      setProjectOwners([
        { id: 'po-1', role: 'PM (專案經理)', name: '張小明', email: 'alex.chang@company.com' },
        { id: 'po-2', role: '業務 (Sales)', name: '陳經理', email: 'sales.chen@company.com' },
      ]);
    }
  }, [project]);

  const persistOwners = async (updated: ProjectOwner[]) => {
    setProjectOwners(updated);
    const primaryPM = updated.find((o) => o.role.includes('PM')) || updated[0];
    await onUpdateProject({
      projectOwners: updated,
      ownerName: primaryPM ? `${primaryPM.name} (${primaryPM.role})` : undefined,
      ownerEmail: primaryPM ? primaryPM.email : undefined,
    });
  };

  const handleAddOwner = async (newOwner: ProjectOwner) => {
    const updated = [...projectOwners, newOwner];
    await persistOwners(updated);
  };

  const handleUpdateOwner = async (targetId: string, role: string, name: string, email: string) => {
    const updated = projectOwners.map((po) => {
      const matchKey = po.id || po.email;
      if (matchKey === targetId) {
        return { ...po, role, name, email };
      }
      return po;
    });
    await persistOwners(updated);
  };

  const handleRemoveOwner = useCallback(
    async (id?: string, email?: string) => {
      const updated = projectOwners.filter((o) => (id ? o.id !== id : o.email !== email));
      await persistOwners(updated);
    },
    [projectOwners, onUpdateProject]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const maxDay = noticeDaysList.length > 0 ? Math.max(...noticeDaysList) : 3;
      const primaryPM = projectOwners.find((o) => o.role.includes('PM')) || projectOwners[0];

      await onUpdateProject({
        dDay,
        ownerName: primaryPM ? `${primaryPM.name} (${primaryPM.role})` : undefined,
        ownerEmail: primaryPM ? primaryPM.email : undefined,
        projectOwners,
        advanceNoticeDays: maxDay,
        advanceNoticeDaysList: noticeDaysList.sort((a, b) => b - a),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  }, [dDay, projectOwners, noticeDaysList, onUpdateProject]);

  const getDayOfWeek = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return days[date.getDay()];
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
      {/* Section Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
          }}>
            <Users size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>專案團隊角色 (業務/PM/SA等)、開工日 (D-Day) 與多重預警設定</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              可新增、修改姓名與 Email、維護多位專案負責人角色 (業務、PM、SA、QA 等)
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
            <Sparkles size={16} /> 已套用專案團隊與死線設定！
          </div>
        )}
      </div>

      {/* Multi-Role Project Owners Manager Box */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-md)',
        padding: '1.1rem 1.25rem',
        marginBottom: '1.25rem',
      }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem' }}>
          👥 專案負責人團隊名冊 (點擊鉛筆圖示可隨時修改成員姓名或 Email)
        </label>

        <OwnerList
          projectOwners={projectOwners}
          onUpdateOwner={handleUpdateOwner}
          onRemoveOwner={handleRemoveOwner}
        />

        <AddOwnerForm onAddOwner={handleAddOwner} />
      </div>

      {/* D-Day & Warning Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr auto', gap: '1.25rem', alignItems: 'flex-end' }}>
        {/* D-Day Date Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
            📅 專案開工日 (D-Day Baseline)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              className="input-glass"
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem', fontWeight: 600 }}
              value={dDay}
              onChange={(e) => setDDay(e.target.value)}
            />
            <Calendar size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          {dDay && (
            <div style={{ fontSize: '0.75rem', color: '#4338ca', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              <Info size={12} /> 開工首日為: {dDay} ({getDayOfWeek(dDay)})
            </div>
          )}
        </div>

        {/* Multi-Select Advance Warning Days */}
        <NoticeDaysSelector
          noticeDaysList={noticeDaysList}
          setNoticeDaysList={setNoticeDaysList}
        />

        {/* Save Button */}
        <div>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '0.65rem 1.5rem', height: '42px' }}
          >
            <Save size={18} />
            <span>{isSaving ? '儲存中...' : '套用專案團隊與死線'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
