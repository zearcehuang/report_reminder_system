import React, { useState } from 'react';
import { Project } from '../../types';

interface CreateProjectFormProps {
  onCancel: () => void;
  onCreateProject: (project: Partial<Project>) => Promise<void>;
}

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  onCancel,
  onCreateProject,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [dDay, setDDay] = useState(new Date().toISOString().split('T')[0]);
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    setSubmitting(true);
    try {
      await onCreateProject({
        code,
        name,
        dDay,
        advanceNoticeDays,
        ownerName: ownerName.trim() || undefined,
        ownerEmail: ownerEmail.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            專案編號 (Project Code)
          </label>
          <input
            type="text"
            className="input-glass"
            placeholder="例如: PRJ-004"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            專案名稱 (Project Name)
          </label>
          <input
            type="text"
            className="input-glass"
            placeholder="例如: 全社整合通訊平台擴充案"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Owner Name & Owner Email */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            👤 專案負責人姓名 (選填)
          </label>
          <input
            type="text"
            className="input-glass"
            placeholder="例如: 張小明 (PM)"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            ✉️ 負責人 Email (新增報告時預設自動帶入)
          </label>
          <input
            type="email"
            className="input-glass"
            placeholder="例如: alex.chang@company.com"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            📅 專案啟動日 (D-Day)
          </label>
          <input
            type="date"
            className="input-glass"
            value={dDay}
            onChange={(e) => setDDay(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            🔔 提前提醒天數
          </label>
          <input
            type="number"
            min="1"
            max="30"
            className="input-glass"
            value={advanceNoticeDays}
            onChange={(e) => setAdvanceNoticeDays(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '建立中...' : '建立新專案'}
        </button>
      </div>
    </form>
  );
};
