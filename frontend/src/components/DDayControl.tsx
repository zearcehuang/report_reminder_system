import React, { useState, useEffect, memo } from 'react';
import { Project, ProjectOwner, Contact } from '../types';
import { Calendar, Clock, Sparkles, Save, Info, User, Mail, Plus, Trash2, Users, Tag, ShieldCheck, Edit2, Check, X } from 'lucide-react';

interface Props {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  milestoneCount: number;
  contacts?: Contact[];
}

const PRESET_ROLES = [
  'PM (專案經理)',
  '業務 (Sales)',
  'SA (系統分析師)',
  'PG (開發工程師)',
  'QA (測試經理)',
  '架構師',
  '通訊窗口',
  '自訂角色',
];

export const DDayControl: React.FC<Props> = memo(({ project, onUpdateProject, milestoneCount, contacts = [] }) => {
  const [dDay, setDDay] = useState(project.dDay);
  const [projectOwners, setProjectOwners] = useState<ProjectOwner[]>([]);
  const [noticeDaysList, setNoticeDaysList] = useState<number[]>([]);
  const [customDayInput, setCustomDayInput] = useState('');

  // Add Owner States
  const [selectedRole, setSelectedRole] = useState('PM (專案經理)');
  const [customRole, setCustomRole] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [contactSearch, setContactSearch] = useState('');

  // Inline Edit Owner States
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('PM (專案經理)');
  const [editCustomRole, setEditCustomRole] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');

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

  const handleAddOwner = async () => {
    if (!ownerEmail.trim()) return;
    const finalRole = selectedRole === '自訂角色' ? customRole.trim() || '專案成員' : selectedRole;
    const finalName = ownerName.trim() || ownerEmail.split('@')[0];

    const newOwner: ProjectOwner = {
      id: `po-${Date.now()}`,
      role: finalRole,
      name: finalName,
      email: ownerEmail.trim(),
    };

    const updated = [...projectOwners, newOwner];
    setProjectOwners(updated);
    setOwnerName('');
    setOwnerEmail('');
    setCustomRole('');
    setContactSearch('');

    // Immediately persist to backend & App state
    const primaryPM = updated.find((o) => o.role.includes('PM')) || updated[0];
    await onUpdateProject({
      projectOwners: updated,
      ownerName: primaryPM ? `${primaryPM.name} (${primaryPM.role})` : undefined,
      ownerEmail: primaryPM ? primaryPM.email : undefined,
    });
  };

  const handleStartEditOwner = (owner: ProjectOwner) => {
    const id = owner.id || owner.email;
    setEditingOwnerId(id);
    if (PRESET_ROLES.includes(owner.role)) {
      setEditRole(owner.role);
      setEditCustomRole('');
    } else {
      setEditRole('自訂角色');
      setEditCustomRole(owner.role);
    }
    setEditName(owner.name);
    setEditEmail(owner.email);
  };

  const handleSaveEditOwner = async (targetId: string) => {
    if (!editName.trim() || !editEmail.trim()) return;
    const finalRole = editRole === '自訂角色' ? editCustomRole.trim() || '專案成員' : editRole;

    const updated = projectOwners.map((po) => {
      const matchKey = po.id || po.email;
      if (matchKey === targetId) {
        return {
          ...po,
          role: finalRole,
          name: editName.trim(),
          email: editEmail.trim(),
        };
      }
      return po;
    });

    setProjectOwners(updated);
    setEditingOwnerId(null);

    // Immediately persist to backend & App state
    const primaryPM = updated.find((o) => o.role.includes('PM')) || updated[0];
    await onUpdateProject({
      projectOwners: updated,
      ownerName: primaryPM ? `${primaryPM.name} (${primaryPM.role})` : undefined,
      ownerEmail: primaryPM ? primaryPM.email : undefined,
    });
  };

  const handleCancelEditOwner = () => {
    setEditingOwnerId(null);
  };

  const handleRemoveOwner = async (id?: string, email?: string) => {
    const updated = projectOwners.filter((o) => (id ? o.id !== id : o.email !== email));
    setProjectOwners(updated);

    // Immediately persist to backend & App state
    const primaryPM = updated.find((o) => o.role.includes('PM')) || updated[0];
    await onUpdateProject({
      projectOwners: updated,
      ownerName: primaryPM ? `${primaryPM.name} (${primaryPM.role})` : undefined,
      ownerEmail: primaryPM ? primaryPM.email : undefined,
    });
  };

  const handleSave = async () => {
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
  };

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

        {/* Existing Project Owners Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {projectOwners.length > 0 ? (
            projectOwners.map((owner) => {
              const targetKey = owner.id || owner.email;
              const isEditing = editingOwnerId === targetKey;

              if (isEditing) {
                return (
                  <div
                    key={targetKey}
                    style={{
                      background: '#ffffff',
                      border: '2px solid #6366f1',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.15)',
                    }}
                  >
                    {/* Role Dropdown */}
                    <select
                      className="input-glass"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', fontWeight: 600 }}
                    >
                      {PRESET_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    {editRole === '自訂角色' && (
                      <input
                        type="text"
                        className="input-glass"
                        placeholder="自訂角色"
                        value={editCustomRole}
                        onChange={(e) => setEditCustomRole(e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: '90px' }}
                      />
                    )}

                    {/* Edit Name */}
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="姓名"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ fontSize: '0.775rem', padding: '0.2rem 0.4rem', width: '90px', fontWeight: 600 }}
                    />

                    {/* Edit Email */}
                    <input
                      type="email"
                      className="input-glass"
                      placeholder="Email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      style={{ fontSize: '0.775rem', padding: '0.2rem 0.4rem', width: '160px' }}
                    />

                    {/* Save / Cancel Buttons */}
                    <button
                      type="button"
                      onClick={() => handleSaveEditOwner(targetKey)}
                      style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.25rem 0.45rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                      }}
                      title="儲存變更"
                    >
                      <Check size={13} /> 儲存
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditOwner}
                      style={{
                        background: '#f1f5f9',
                        color: '#64748b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '0.25rem 0.4rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="取消"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={targetKey}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <span style={{
                    background: owner.role.includes('業務') ? '#fef3c7' : (owner.role.includes('PM') ? '#dbeafe' : '#f3e8ff'),
                    color: owner.role.includes('業務') ? '#b45309' : (owner.role.includes('PM') ? '#1d4ed8' : '#6b21a8'),
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}>
                    <Tag size={11} /> {owner.role}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                    {owner.name}
                  </span>
                  <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
                    &lt;{owner.email}&gt;
                  </span>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleStartEditOwner(owner)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6366f1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.15rem',
                      borderRadius: '4px',
                      marginLeft: '0.2rem',
                    }}
                    title="修改此成員姓名/Email/角色"
                  >
                    <Edit2 size={13} color="#4f46e5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveOwner(owner.id, owner.email)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.15rem',
                      borderRadius: '4px',
                    }}
                    title="移除此負責人"
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
              目前尚未新增任何專案負責人，請利用下方表單新增成員。
            </div>
          )}
        </div>

        {/* Add New Owner Input Group */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr auto', gap: '0.65rem', alignItems: 'center' }}>
          {/* Role Selector */}
          <div>
            <select
              className="input-glass"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.65rem', fontWeight: 600 }}
            >
              {PRESET_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {selectedRole === '自訂角色' && (
              <input
                type="text"
                className="input-glass"
                placeholder="輸入角色 (如: 專案總監)"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                style={{ marginTop: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
              />
            )}
          </div>

          {/* Owner Name */}
          <div>
            <input
              type="text"
              className="input-glass"
              placeholder="姓名 (如: 張小明)"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.65rem' }}
            />
          </div>

          {/* Owner Email with Contact Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              className="input-glass"
              placeholder="Email (如: alex.chang@company.com)"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOwner();
                }
              }}
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.65rem' }}
            />
          </div>

          {/* Add Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleAddOwner}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Plus size={16} /> 新增負責人
          </button>
        </div>
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
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
            📅 Outlook 會議預警提醒天數 (可複選)
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
            <span>{isSaving ? '儲存中...' : '套用專案團隊與死線'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

