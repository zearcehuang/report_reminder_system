import React, { useState } from 'react';
import { UserSession, UserRole } from '../types';
import { KeyRound, X, Shield, User, Check, LogOut, Lock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onUserLoginSuccess: (user: UserSession) => void;
}

export const UserAuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onUserLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.loginUser(email, password);
      if (res.success && res.user) {
        onUserLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.message || '登入失敗，請檢查帳號密碼');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSwitch = async (accountEmail: string, accountPass: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.loginUser(accountEmail, accountPass);
      if (res.success && res.user) {
        onUserLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.message || '快速切換失敗');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === 'Admin') return { label: '👑 Admin 最高管理員', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    if (role === 'PM') return { label: '💼 PM 專案經理', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    return { label: '👁️ Auditor 唯讀審核員', bg: '#f8fafc', color: '#475569', border: '#cbd5e1' };
  };

  const currentRoleInfo = getRoleBadge(currentUser.role);

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '580px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)',
            }}>
              <KeyRound size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>使用者身份驗證與 RBAC 權限切換</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                登入與角色切換 (支持 Admin / PM / Auditor 三層級權限防護)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Current Active Session Card */}
        <div style={{
          background: currentRoleInfo.bg,
          border: `1px solid ${currentRoleInfo.border}`,
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>目前登入身份 (Current Active Session)</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
              {currentUser.name} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>({currentUser.email})</span>
            </div>
            <div style={{ fontSize: '0.775rem', color: '#475569', marginTop: '0.15rem' }}>
              所屬部門: <strong>{currentUser.department || '專案團隊'}</strong>
            </div>
          </div>

          <span style={{
            background: '#ffffff',
            color: currentRoleInfo.color,
            border: `1.5px solid ${currentRoleInfo.color}`,
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '0.8rem',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
          }}>
            {currentRoleInfo.label}
          </span>
        </div>

        {/* Quick Demo Role Switcher */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
            ⚡ 快速測試帳號一鍵切換 (Quick Role Switcher):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
            <button
              onClick={() => handleQuickSwitch('admin@company.com', 'admin123')}
              style={{
                background: currentUser.role === 'Admin' ? '#fef2f2' : '#ffffff',
                border: currentUser.role === 'Admin' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                padding: '0.65rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>👑 Admin 管理員</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>完全存取/全刪寫權限</div>
            </button>

            <button
              onClick={() => handleQuickSwitch('alex.chang@company.com', 'pm123')}
              style={{
                background: currentUser.role === 'PM' ? '#eff6ff' : '#ffffff',
                border: currentUser.role === 'PM' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                padding: '0.65rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>💼 PM 專案經理</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>專案編輯與派發權限</div>
            </button>

            <button
              onClick={() => handleQuickSwitch('auditor@company.com', 'auditor123')}
              style={{
                background: currentUser.role === 'Auditor' ? '#f8fafc' : '#ffffff',
                border: currentUser.role === 'Auditor' ? '2px solid #64748b' : '1px solid #e2e8f0',
                padding: '0.65rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>👁️ Auditor 審核員</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>純唯讀與日誌審視</div>
            </button>
          </div>
        </div>

        {/* Custom Login Form */}
        <form onSubmit={handleCustomLogin} style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
            🔒 自訂帳號密碼登入:
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Email 帳號</label>
              <input
                type="email"
                className="input-glass"
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.65rem', width: '100%' }}
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>密碼</label>
              <input
                type="password"
                className="input-glass"
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.65rem', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !email || !password}
              style={{ fontSize: '0.825rem', padding: '0.45rem 1rem' }}
            >
              {isLoading ? '驗登入中...' : '進行 JWT 登入'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
