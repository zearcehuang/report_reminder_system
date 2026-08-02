import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { SenderAccount } from '../../types';

interface SenderAuthCardProps {
  isSenderLoggedIn: boolean;
  activeSender: SenderAccount | null;
  senderEmail: string;
  senderName: string;
  senderPassword: string;
  isLoggingIn: boolean;
  loginError: string;
  setSenderEmail: (val: string) => void;
  setSenderName: (val: string) => void;
  setSenderPassword: (val: string) => void;
  onLogin: (e: React.FormEvent) => void;
  onLogout: () => void;
}

export const SenderAuthCard: React.FC<SenderAuthCardProps> = ({
  isSenderLoggedIn,
  activeSender,
  senderEmail,
  senderName,
  senderPassword,
  isLoggingIn,
  loginError,
  setSenderEmail,
  setSenderName,
  setSenderPassword,
  onLogin,
  onLogout
}) => {
  return (
    <div style={{
      background: isSenderLoggedIn ? '#f0fdf4' : '#fff1f2',
      border: isSenderLoggedIn ? '1.5px solid #86efac' : '1.5px solid #fca5a5',
      borderRadius: 'var(--radius-md)',
      padding: '0.9rem 1.1rem',
      marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSenderLoggedIn ? 0 : '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={18} color={isSenderLoggedIn ? '#16a34a' : '#dc2626'} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSenderLoggedIn ? '#166534' : '#991b1b' }}>
            {isSenderLoggedIn
              ? `✓ 已成功登入發布寄件者帳號: [${activeSender?.name}] (${activeSender?.email})`
              : '⚠️ 發布寄件者身分登入驗證 (正式發布 Outlook 會議信件前必須先登入帳號)'}
          </span>
        </div>
        {isSenderLoggedIn && (
          <button
            type="button"
            onClick={onLogout}
            style={{ background: '#ffffff', border: '1px solid #86efac', color: '#166534', fontSize: '0.725rem', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            切換寄件者帳號
          </button>
        )}
      </div>

      {!isSenderLoggedIn && (
        <form onSubmit={onLogin}>
          <p style={{ fontSize: '0.775rem', color: '#7f1d1d', margin: '0 0 0.65rem 0' }}>
            為確保 Outlook 會議預約信件能真實發出至權責對象信箱，發出前請先完成發布寄件者帳號驗證：
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr auto', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="email"
              className="input-glass"
              placeholder="寄件者 Email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}
              required
            />
            <input
              type="text"
              className="input-glass"
              placeholder="顯示姓名 (如: 張小明 PM)"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}
            />
            <input
              type="password"
              className="input-glass"
              placeholder="Outlook 授權密碼"
              value={senderPassword}
              onChange={(e) => setSenderPassword(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}
              required
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
              }}
            >
              {isLoggingIn ? '驗證中...' : '🔐 登入驗證身分'}
            </button>
          </div>
        </form>
      )}

      {loginError && (
        <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <AlertCircle size={15} />
          <span>{loginError}</span>
        </div>
      )}
    </div>
  );
};
