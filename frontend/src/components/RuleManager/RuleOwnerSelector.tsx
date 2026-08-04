import React, { useState, useRef, useEffect } from 'react';
import { User, X, Users, ChevronDown, ChevronUp, Check, Search } from 'lucide-react';
import { Contact } from '../../types';

interface RuleOwnerSelectorProps {
  ruleOwners: string[];
  ruleEnabled?: boolean;
  selectableTeam: { id?: string; role: string; name: string; email: string }[];
  contacts: Contact[];
  onUpdateOwners: (owners: string[]) => void;
  placeholder?: string;
}

export const RuleOwnerSelector: React.FC<RuleOwnerSelectorProps> = ({
  ruleOwners,
  ruleEnabled = true,
  selectableTeam,
  contacts,
  onUpdateOwners,
  placeholder = '+ 搜尋團隊角色/姓名/Email 或下拉多選...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOwner = (ownerStr: string, email: string) => {
    const isSelected = ruleOwners.includes(ownerStr) || ruleOwners.some((o) => o.includes(email));
    if (isSelected) {
      onUpdateOwners(ruleOwners.filter((o) => !o.includes(email) && o !== ownerStr));
    } else {
      onUpdateOwners([...ruleOwners, ownerStr]);
    }
  };

  const handleAddCustomEmail = (emailStr: string) => {
    const trimmed = emailStr.trim();
    if (!trimmed || ruleOwners.includes(trimmed)) return;
    onUpdateOwners([...ruleOwners, trimmed]);
    setSearchQuery('');
  };

  const query = searchQuery.toLowerCase().trim();

  const filteredTeam = selectableTeam.filter(
    (po) => !query || po.name.toLowerCase().includes(query) || po.email.toLowerCase().includes(query) || po.role.toLowerCase().includes(query)
  );

  const filteredContacts = contacts.filter(
    (c) => !query || c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query) || (c.department && c.department.toLowerCase().includes(query))
  );

  const SelectItem = ({
    isSelected, onClick, role, name, email, dept
  }: { isSelected: boolean, onClick: () => void, role?: string, name: string, email: string, dept?: string }) => (
    <div
      onClick={onClick}
      style={{
        padding: '0.45rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: isSelected ? '#eff6ff' : 'transparent', transition: 'background 0.1s ease',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: '#4f46e5', cursor: 'pointer' }} />
        {role && <span style={{ fontSize: '0.675rem', padding: '0.05rem 0.35rem', borderRadius: '3px', background: isSelected ? '#c7d2fe' : '#e2e8f0', color: isSelected ? '#312e81' : '#475569', fontWeight: 700 }}>{role}</span>}
        <strong style={{ color: '#1e293b' }}>{name}</strong>
        {dept && <span style={{ fontSize: '0.725rem', color: '#64748b' }}>({dept})</span>}
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({email})</span>
      </div>
      {isSelected && <Check size={15} color="#4f46e5" />}
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => ruleEnabled && setIsOpen((prev) => !prev)}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', background: '#ffffff',
          border: isOpen ? '1.5px solid #4f46e5' : '1px solid #cbd5e1', borderRadius: 'var(--radius-sm)',
          padding: '0.45rem 0.65rem', minHeight: '42px', cursor: ruleEnabled ? 'pointer' : 'not-allowed',
          boxShadow: isOpen ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : 'none', transition: 'all 0.15s ease',
        }}
      >
        {ruleOwners.map((owner) => (
          <span key={owner} style={{ background: '#e0e7ff', border: '1px solid #c7d2fe', color: '#3730a3', fontWeight: 600, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <User size={12} /> {owner}
            {ruleEnabled && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onUpdateOwners(ruleOwners.filter((o) => o !== owner)); }} style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <X size={12} />
              </button>
            )}
          </span>
        ))}

        {ruleEnabled && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: '160px', gap: '0.3rem' }} onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
            <Search size={13} color="#94a3b8" />
            <input type="text" placeholder={ruleOwners.length === 0 ? placeholder : '+ 新增/搜尋通知人...'} value={searchQuery} onFocus={() => setIsOpen(true)} onChange={(e) => { setSearchQuery(e.target.value); if (!isOpen) setIsOpen(true); }} onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { e.preventDefault(); handleAddCustomEmail(searchQuery); } }} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.825rem', width: '100%', color: '#334155' }} />
          </div>
        )}

        {ruleEnabled && <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', paddingLeft: '0.2rem' }}>{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>}
      </div>

      {isOpen && ruleEnabled && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-sm)', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)', maxHeight: '260px', overflowY: 'auto', padding: '0.5rem 0' }}>
          <div style={{ padding: '0.35rem 0.75rem 0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', marginTop: '-0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={13} color="#4f46e5" /> 專案團隊與通訊錄成員 (可勾選多位):
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button type="button" onClick={() => onUpdateOwners(Array.from(new Set([...ruleOwners, ...selectableTeam.map((po) => `[${po.role}] ${po.name} (${po.email})`)])))} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '0.675rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '3px', cursor: 'pointer' }}>+ 全選團隊</button>
              <button type="button" onClick={() => onUpdateOwners([])} style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.675rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: '3px', cursor: 'pointer' }}>重置清空</button>
            </div>
          </div>

          {filteredTeam.length > 0 && (
            <div>
              <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>專案負責人團隊名冊 ({filteredTeam.length})</div>
              {filteredTeam.map((po) => {
                const ownerStr = `[${po.role}] ${po.name} (${po.email})`;
                return (
                  <SelectItem key={po.id || po.email} isSelected={ruleOwners.includes(ownerStr) || ruleOwners.some(o => o.includes(po.email))} onClick={() => handleToggleOwner(ownerStr, po.email)} role={po.role} name={po.name} email={po.email} />
                );
              })}
            </div>
          )}

          {filteredContacts.length > 0 && (
            <div style={{ marginTop: filteredTeam.length > 0 ? '0.4rem' : 0 }}>
              <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Outlook 通訊錄對象 ({filteredContacts.length})</div>
              {filteredContacts.map((c) => {
                const ownerStr = `${c.name} (${c.email})`;
                return (
                  <SelectItem key={c.id} isSelected={ruleOwners.includes(ownerStr) || ruleOwners.some(o => o.includes(c.email))} onClick={() => handleToggleOwner(ownerStr, c.email)} name={c.name} email={c.email} dept={c.department} />
                );
              })}
            </div>
          )}

          {searchQuery.trim().length > 0 && (
            <div onClick={() => handleAddCustomEmail(searchQuery.trim())} style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: '#4f46e5', cursor: 'pointer', fontWeight: 700, borderTop: '1px dashed #cbd5e1', marginTop: '0.35rem', background: '#faf5ff' }}>
              + 按下 Enter 或點擊以此 Email 新增：「{searchQuery.trim()}」
            </div>
          )}

          {filteredTeam.length === 0 && filteredContacts.length === 0 && searchQuery.trim().length === 0 && (
            <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>無相符的團隊或通訊錄聯絡人</div>
          )}
        </div>
      )}
    </div>
  );
};
