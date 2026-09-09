import React, { useState } from 'react';
import { ProjectOwner } from '../../types';
import { Tag, Edit2, Trash2, Check, X } from 'lucide-react';
import { PRESET_ROLES } from './types';

interface OwnerListProps {
  projectOwners: ProjectOwner[];
  onUpdateOwner: (targetId: string, role: string, name: string, email: string) => Promise<void>;
  onRemoveOwner: (id?: string, email?: string) => Promise<void>;
}

export const OwnerList: React.FC<OwnerListProps> = ({
  projectOwners,
  onUpdateOwner,
  onRemoveOwner,
}) => {
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('PM (專案經理)');
  const [editCustomRole, setEditCustomRole] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');

  const handleStartEdit = (owner: ProjectOwner) => {
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

  const handleSaveEdit = async (targetId: string) => {
    if (!editName.trim() || !editEmail.trim()) return;
    const finalRole = editRole === '自訂角色' ? editCustomRole.trim() || '專案成員' : editRole;
    await onUpdateOwner(targetId, finalRole, editName.trim(), editEmail.trim());
    setEditingOwnerId(null);
  };

  const handleCancelEdit = () => {
    setEditingOwnerId(null);
  };

  if (projectOwners.length === 0) {
    return (
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '1rem' }}>
        目前尚未新增任何專案負責人，請利用下方表單新增成員。
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
      {projectOwners.map((owner) => {
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

              <input
                type="text"
                className="input-glass"
                placeholder="姓名"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ fontSize: '0.775rem', padding: '0.2rem 0.4rem', width: '90px', fontWeight: 600 }}
              />

              <input
                type="email"
                className="input-glass"
                placeholder="Email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                style={{ fontSize: '0.775rem', padding: '0.2rem 0.4rem', width: '160px' }}
              />

              <button
                type="button"
                onClick={() => handleSaveEdit(targetKey)}
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
                onClick={handleCancelEdit}
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

        const roleBg = owner.role.includes('業務')
          ? '#fef3c7'
          : owner.role.includes('PM')
          ? '#dbeafe'
          : '#f3e8ff';
        const roleColor = owner.role.includes('業務')
          ? '#b45309'
          : owner.role.includes('PM')
          ? '#1d4ed8'
          : '#6b21a8';

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
            <span
              style={{
                background: roleBg,
                color: roleColor,
                fontSize: '0.725rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <Tag size={11} /> {owner.role}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
              {owner.name}
            </span>
            <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
              &lt;{owner.email}&gt;
            </span>

            <button
              type="button"
              onClick={() => handleStartEdit(owner)}
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

            <button
              type="button"
              onClick={() => onRemoveOwner(owner.id, owner.email)}
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
      })}
    </div>
  );
};
