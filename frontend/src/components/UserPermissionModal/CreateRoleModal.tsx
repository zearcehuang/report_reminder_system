import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (roleData: { name: string; description: string }) => Promise<void>;
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name: newRoleName, description: newRoleDesc });
    setNewRoleName('');
    setNewRoleDesc('');
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="glass-modal width-full animate-fade-in" style={{ maxWidth: '460px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>➕ 新增自訂角色群組</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>角色代號 / 名稱 *</label>
            <input
              type="text"
              className="input-glass"
              style={{ width: '100%', fontSize: '0.85rem' }}
              placeholder="例如: QA_Leader"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>角色描述</label>
            <textarea
              className="input-glass"
              style={{ width: '100%', fontSize: '0.85rem', height: '70px' }}
              placeholder="請簡述此角色的職責與權限範圍..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              建立角色
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
