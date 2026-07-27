import React, { useState } from 'react';
import { Project } from '../types';
import { FolderPlus, X, Calendar, Clock, Check, Edit3, Briefcase } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProject: Project;
  onSelectProject: (project: Project) => void;
  onCreateProject: (project: Partial<Project>) => Promise<void>;
}

export const ProjectManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [dDay, setDDay] = useState('2026-08-01');
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmitNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    setSubmitting(true);
    try {
      await onCreateProject({ code, name, dDay, advanceNoticeDays });
      setCode('');
      setName('');
      setIsAdding(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '640px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--accent-gradient)',
              padding: '0.6rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}>
              <Briefcase size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>專案管理中心</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>切換或新增履約報告提醒專案</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Project List */}
        {!isAdding ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {projects.map((proj) => {
                const isActive = proj.id === activeProject.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj);
                      onClose();
                    }}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? '#eff6ff' : '#ffffff',
                      border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                    }}
                    className="project-item-hover"
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{
                          background: '#e0e7ff',
                          color: '#4338ca',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}>
                          {proj.code}
                        </span>
                        <h4 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 600 }}>{proj.name}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: '#475569' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={14} color="#2563eb" /> D-Day: {proj.dDay || '未設定'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} color="#d97706" /> 提前 {proj.advanceNoticeDays} 天提醒
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <div style={{
                        background: 'var(--accent-gradient)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}>
                        <Check size={14} /> 目前使用中
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setIsAdding(true)}>
                <FolderPlus size={18} /> 新建專案
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitNewProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
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
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  專案啟動日 (D-Day)
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
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  提前提醒天數
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
              <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>
                取消
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '建立中...' : '建立新專案'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
