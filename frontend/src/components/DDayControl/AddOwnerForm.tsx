import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ProjectOwner } from '../../types';
import { PRESET_ROLES } from './types';

interface AddOwnerFormProps {
  onAddOwner: (owner: ProjectOwner) => Promise<void>;
}

export const AddOwnerForm: React.FC<AddOwnerFormProps> = ({ onAddOwner }) => {
  const [selectedRole, setSelectedRole] = useState('PM (專案經理)');
  const [customRole, setCustomRole] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const handleAdd = async () => {
    if (!ownerEmail.trim()) return;
    const finalRole = selectedRole === '自訂角色' ? customRole.trim() || '專案成員' : selectedRole;
    const finalName = ownerName.trim() || ownerEmail.split('@')[0];

    const newOwner: ProjectOwner = {
      id: `po-${Date.now()}`,
      role: finalRole,
      name: finalName,
      email: ownerEmail.trim(),
    };

    await onAddOwner(newOwner);
    setOwnerName('');
    setOwnerEmail('');
    setCustomRole('');
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr 1.5fr auto',
        gap: '0.65rem',
        alignItems: 'center',
      }}
    >
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

      {/* Owner Email */}
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
              handleAdd();
            }
          }}
          style={{ fontSize: '0.825rem', padding: '0.45rem 0.65rem' }}
        />
      </div>

      {/* Add Button */}
      <button
        type="button"
        className="btn-primary"
        onClick={handleAdd}
        style={{
          padding: '0.45rem 0.9rem',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
      >
        <Plus size={16} /> 新增負責人
      </button>
    </div>
  );
};
