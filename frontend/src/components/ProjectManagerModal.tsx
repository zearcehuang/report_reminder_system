import React, { useState } from 'react';
import { Project } from '../types';
import { FolderPlus, X, Calendar, Clock, Check, Briefcase, Trash2, CheckSquare, Square, User, Mail } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProject: Project;
  onSelectProject: (project: Project) => void;
  onCreateProject: (project: Partial<Project>) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onBatchDeleteProjects: (projectIds: string[]) => Promise<void>;
}

export const ProjectManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onBatchDeleteProjects,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [dDay, setDDay] = useState('2026-08-01');
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const toggleSelectProject = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === projects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(projects.map(p => p.id));
    }
  };

  const handleDeleteSingle = async (proj: Project) => {
    if (window.confirm(`確定要刪除專案「[${proj.code}] ${proj.name}」嗎？刪除後無法復原。`)) {
      setIsDeleting(true);
      try {
        await onDeleteProject(proj.id);
        setSelectedIds(selectedIds.filter(id => id !== proj.id));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`確定要刪除選取的 ${selectedIds.length} 個專案嗎？此動作無法復原。`)) {
      setIsDeleting(true);
      try {
        await onBatchDeleteProjects(selectedIds);
        setSelectedIds([]);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSubmitNewProject = async (e: React.FormEvent) => {
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
      setCode('');
      setName('');
      setOwnerName('');
      setOwnerEmail('');
      setIsAdding(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '680px', padding: '1.75rem' }}>
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
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>切換、新增或批次刪除專案</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Project List */}
        {!isAdding ? (
          <div>
            {/* Batch Action Toolbar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #e2e8f0',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none', fontWeight: 600, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={projects.length > 0 && selectedIds.length === projects.length}
                  onChange={toggleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                全選專案 ({selectedIds.length}/{projects.length})
              </label>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 1px 2px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={14} /> 批次刪除 ({selectedIds.length})
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {projects.map((proj) => {
                const isActive = proj.id === activeProject.id;
                const isSelected = selectedIds.includes(proj.id);

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
                      background: isSelected ? '#fff1f2' : (isActive ? '#eff6ff' : '#ffffff'),
                      border: isSelected ? '2px solid #f43f5e' : (isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                    }}
                    className="project-item-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectProject(proj.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />

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
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#475569', flexWrap: 'wrap', alignItems: 'center' }}>
                          {proj.projectOwners && proj.projectOwners.length > 0 ? (
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>團隊:</span>
                              {proj.projectOwners.map((po, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    background: po.role.includes('業務') ? '#fef3c7' : (po.role.includes('PM') ? '#dbeafe' : '#f3e8ff'),
                                    color: po.role.includes('業務') ? '#b45309' : (po.role.includes('PM') ? '#1d4ed8' : '#6b21a8'),
                                    fontSize: '0.725rem',
                                    fontWeight: 700,
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                  }}
                                >
                                  [{po.role}] {po.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            proj.ownerEmail && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#3730a3', fontWeight: 600 }}>
                                <User size={13} color="#4f46e5" /> 負責人: {proj.ownerName ? `${proj.ownerName} (${proj.ownerEmail})` : proj.ownerEmail}
                              </span>
                            )
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={14} color="#2563eb" /> D-Day: {proj.dDay || '未設定'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isActive && (
                        <div style={{
                          background: 'var(--accent-gradient)',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}>
                          <Check size={14} /> 目前使用中
                        </div>
                      )}

                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingle(proj);
                        }}
                        disabled={isDeleting}
                        title="刪除此專案"
                        style={{
                          color: '#ef4444',
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #fee2e2',
                          background: '#fef2f2',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
