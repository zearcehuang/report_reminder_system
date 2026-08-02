import React, { useState } from 'react';
import { User, X, Users } from 'lucide-react';
import { Contact } from '../../types';

interface RuleOwnerSelectorProps {
  ruleOwners: string[];
  ruleEnabled: boolean;
  selectableTeam: { id?: string; role: string; name: string; email: string }[];
  contacts: Contact[];
  onUpdateOwners: (owners: string[]) => void;
}

export const RuleOwnerSelector: React.FC<RuleOwnerSelectorProps> = ({
  ruleOwners,
  ruleEnabled,
  selectableTeam,
  contacts,
  onUpdateOwners,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddOwnerTag = (ownerEmail: string) => {
    if (!ownerEmail || ruleOwners.includes(ownerEmail)) return;
    onUpdateOwners([...ruleOwners, ownerEmail]);
    setSearchQuery('');
    setIsActive(false);
  };

  const handleRemoveOwnerTag = (ownerEmail: string) => {
    onUpdateOwners(ruleOwners.filter((o) => o !== ownerEmail));
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem',
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid rgba(203, 213, 225, 0.9)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.4rem 0.6rem',
        minHeight: '40px',
      }}>
        {ruleOwners.map((owner) => (
          <span
            key={owner}
            style={{
              background: '#e0e7ff',
              border: '1px solid #c7d2fe',
              color: '#3730a3',
              fontWeight: 600,
              fontSize: '0.75rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <User size={11} /> {owner}
            {ruleEnabled && (
              <button
                type="button"
                onClick={() => handleRemoveOwnerTag(owner)}
                style={{ background: 'transparent', border: 'none', color: '#a5b4fc', cursor: 'pointer', display: 'flex' }}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}

        {ruleEnabled && (
          <input
            type="text"
            placeholder={ruleOwners.length === 0 ? '手動 Email 或搜尋通訊錄...' : '+ 新增...'}
            value={searchQuery}
            onFocus={() => setIsActive(true)}
            onBlur={() => setTimeout(() => setIsActive(false), 200)}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                e.preventDefault();
                handleAddOwnerTag(searchQuery.trim());
              }
            }}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.8rem',
              flex: 1,
              minWidth: '100px',
            }}
          />
        )}
      </div>

      {ruleEnabled && (
        <div style={{
          marginTop: '0.4rem',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 'var(--radius-sm)',
          padding: '0.45rem 0.6rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={12} color="#4f46e5" /> 一鍵勾選專案團隊角色 (可多選):
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => {
                  const allTeam = selectableTeam.map((po) => `[${po.role}] ${po.name} (${po.email})`);
                  onUpdateOwners(Array.from(new Set([...ruleOwners, ...allTeam])));
                }}
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  fontSize: '0.675rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                + 全選團隊
              </button>
              <button
                type="button"
                onClick={() => onUpdateOwners([])}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#64748b',
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                清空
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {selectableTeam.map((po) => {
              const ownerStr = `[${po.role}] ${po.name} (${po.email})`;
              const isSelected = ruleOwners.includes(ownerStr) || ruleOwners.some((o) => o.includes(po.email));

              return (
                <button
                  key={po.id || po.email}
                  type="button"
                  onClick={() => {
                    let nextOwners: string[];
                    if (isSelected) {
                      nextOwners = ruleOwners.filter((o) => !o.includes(po.email) && o !== ownerStr);
                    } else {
                      nextOwners = [...ruleOwners, ownerStr];
                    }
                    onUpdateOwners(nextOwners);
                  }}
                  style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '5px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    border: isSelected ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                    background: isSelected ? '#e0e7ff' : '#ffffff',
                    color: isSelected ? '#3730a3' : '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.05rem 0.25rem',
                    borderRadius: '3px',
                    background: isSelected ? '#c7d2fe' : '#f1f5f9',
                    color: isSelected ? '#312e81' : '#475569',
                    fontWeight: 700,
                  }}>
                    {po.role}
                  </span>
                  {po.name}
                  {isSelected ? (
                    <span style={{ color: '#4338ca', fontWeight: 800 }}>✓</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isActive && searchQuery.trim().length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 20,
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          maxHeight: '180px',
          overflowY: 'auto',
          marginTop: '0.2rem',
        }}>
          {filteredContacts.length > 0 ? (
            filteredContacts.map((c) => (
              <div
                key={c.id}
                onClick={() => handleAddOwnerTag(`${c.name} (${c.email})`)}
                style={{
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                className="contact-dropdown-item"
              >
                <div>
                  <strong>{c.name}</strong> <span style={{ color: '#64748b' }}>({c.department})</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.email}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              按下 Enter 直接新增 「{searchQuery}」
            </div>
          )}
        </div>
      )}
    </div>
  );
};
