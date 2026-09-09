import React from 'react';
import { KeyRound, Shield, ChevronDown } from 'lucide-react';
import { UserSession } from '../../types';

interface AccountDropdownProps {
  isOpen: boolean;
  accountMenuRef: React.RefObject<HTMLDivElement>;
  currentUser: UserSession;
  onToggle: () => void;
  onClose: () => void;
  onOpenUserAuthModal: () => void;
  onOpenUserPermissionModal: () => void;
}

export const AccountDropdown: React.FC<AccountDropdownProps> = ({
  isOpen,
  accountMenuRef,
  currentUser,
  onToggle,
  onClose,
  onOpenUserAuthModal,
  onOpenUserPermissionModal,
}) => {
  const getRoleBadgeStyle = (role: string) => {
    if (role === 'Admin') return { bg: '#fef2f2', color: '#dc2626', label: '👑 Admin' };
    if (role === 'PM') return { bg: '#eff6ff', color: '#2563eb', label: '💼 PM' };
    if (role === 'Auditor') return { bg: '#f8fafc', color: '#475569', label: '👁️ Auditor' };
    return { bg: '#faf5ff', color: '#9333ea', label: `🛡️ ${role}` };
  };

  const roleStyle = getRoleBadgeStyle(currentUser.role);

  return (
    <div ref={accountMenuRef} style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        className="btn-secondary"
        style={{
          fontSize: '0.825rem',
          padding: '0.48rem 0.85rem',
          background: roleStyle.bg,
          borderColor: roleStyle.color,
          color: roleStyle.color,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <KeyRound size={15} color={roleStyle.color} />
        <span>{roleStyle.label}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 500 }}>
          ({currentUser.name.split(' ')[0]})
        </span>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 0.5rem)',
            width: '270px',
            background: 'var(--dropdown-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--surface-glass-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15), var(--shadow-glow)',
            padding: '0.5rem',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '0.5rem 0.65rem 0.6rem',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '0.35rem',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              當前登入帳號 (SESSION)
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '0.15rem',
              }}
            >
              {currentUser.name}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
              {currentUser.email}
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenUserAuthModal();
            }}
            className="dropdown-item-hover"
            style={{
              width: '100%',
              padding: '0.55rem 0.65rem',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              transition: 'all 0.15s ease',
            }}
          >
            <KeyRound size={17} color="#0284c7" />
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>切換使用者身份</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                JWT 登入與快速帳號切換
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenUserPermissionModal();
            }}
            className="dropdown-item-hover"
            style={{
              width: '100%',
              padding: '0.55rem 0.65rem',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Shield size={17} color="#9333ea" />
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>使用者與角色權限維護</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                帳號 CRUD 與 Role 權限矩陣
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
