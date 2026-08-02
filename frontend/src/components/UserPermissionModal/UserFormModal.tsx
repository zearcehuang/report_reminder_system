import React, { useState, useEffect } from 'react';
import { UserItem, RoleItem } from '../../types';
import { X } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: UserItem | null;
  roles: RoleItem[];
  onSave: (data: {
    formName: string;
    formEmail: string;
    formPassword?: string;
    formRole: string;
    formDepartment: string;
    formTitle: string;
    formStatus: 'active' | 'inactive';
  }) => Promise<void>;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  editingUser,
  roles,
  onSave,
}) => {
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('PM');
  const [formDepartment, setFormDepartment] = useState('專案團隊');
  const [formTitle, setFormTitle] = useState('團隊成員');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setFormName(editingUser.name);
        setFormEmail(editingUser.email);
        setFormPassword('');
        setFormRole(editingUser.role);
        setFormDepartment(editingUser.department || '');
        setFormTitle(editingUser.title || '');
        setFormStatus(editingUser.status);
      } else {
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormRole(roles.length > 0 ? roles[0].name : 'PM');
        setFormDepartment('專案管理一部');
        setFormTitle('專案經理');
        setFormStatus('active');
      }
    }
  }, [isOpen, editingUser, roles]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      formName,
      formEmail,
      formPassword,
      formRole,
      formDepartment,
      formTitle,
      formStatus,
    });
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="glass-modal width-full animate-fade-in" style={{ maxWidth: '520px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {editingUser ? `編輯使用者：${editingUser.name}` : '➕ 新增系統使用者'}
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>姓名 *</label>
              <input
                type="text"
                className="input-glass"
                style={{ width: '100%', fontSize: '0.85rem' }}
                placeholder="例如: 張小明"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email 帳號 *</label>
              <input
                type="email"
                className="input-glass"
                style={{ width: '100%', fontSize: '0.85rem' }}
                placeholder="alex@company.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>密碼 / 重設密碼</label>
              <input
                type="password"
                className="input-glass"
                style={{ width: '100%', fontSize: '0.85rem' }}
                placeholder={editingUser ? '保持空白表示不變更' : '預設 123456'}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>指派角色群組</label>
              <select
                className="input-glass"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name} ({r.description})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>所屬部門</label>
              <input
                type="text"
                className="input-glass"
                style={{ width: '100%', fontSize: '0.85rem' }}
                placeholder="例如: 專案管理一部"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>職稱</label>
              <input
                type="text"
                className="input-glass"
                style={{ width: '100%', fontSize: '0.85rem' }}
                placeholder="例如: 專案經理"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              {editingUser ? '儲存更新' : '建立使用者'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
