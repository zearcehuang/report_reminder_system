import React, { useState, useEffect } from 'react';
import { UserSession, UserRole, UserItem } from '../types';
import { KeyRound, X, Shield, User, Check, LogOut, Lock, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [availableUsers, setAvailableUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const uList = await api.getUsers();
      setAvailableUsers(uList.filter(u => u.status === 'active'));
    } catch {
      // Fallback
    }
  };

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

  const handleQuickSwitch = async (user: UserItem) => {
    setError(null);
    setIsLoading(true);
    try {
      const DEFAULT_PASSWORDS: Record<string, string> = {
        'admin@company.com': 'admin123',
        'alex.chang@company.com': 'pm123',
        'auditor@company.com': 'auditor123'
      };
      const pwd = DEFAULT_PASSWORDS[user.email.toLowerCase()] || user.password || '123456';
      const res = await api.loginUser(user.email, pwd);
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
    if (role === 'Auditor') return { label: '👁️ Auditor 審核員', bg: '#f8fafc', color: '#475569', border: '#cbd5e1' };
    return { label: `🛡️ ${role} 專案角色`, bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff' };
  };

  const currentRoleInfo = getRoleBadge(currentUser.role);

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '620px', padding: '1.75rem' }}>
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>使用者身份驗證與 RBAC 權限切換</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                登入與角色切換 (支持動態 Users / Roles 持久化層級權限防護)
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
              所屬部門: <strong>{currentUser.department || '專案團隊'}</strong> | 職稱: <strong>{currentUser.title || '成員'}</strong>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155' }}>
              ⚡ 快速測試帳號一鍵切換 (Quick Role Switcher):
            </label>
            <button className="btn-icon" style={{ padding: '0.2rem' }} onClick={loadUsers} title="重新整理帳號清單">
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {availableUsers.map((u) => {
              const isCurrent = currentUser.email.toLowerCase() === u.email.toLowerCase();
              const badge = getRoleBadge(u.role);

              return (
                <button
                  key={u.id}
                  onClick={() => handleQuickSwitch(u)}
                  style={{
                    background: isCurrent ? badge.bg : '#ffffff',
                    border: isCurrent ? `2px solid ${badge.color}` : '1px solid #e2e8f0',
                    padding: '0.65rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isCurrent ? badge.color : '#1e293b' }}>
                    {u.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: badge.color, marginTop: '0.2rem' }}>
                    [{u.role}] {u.department || ''}
                  </div>
                </button>
              );
            })}
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
              {isLoading ? '驗證登入中...' : '進行 JWT 登入'}
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
