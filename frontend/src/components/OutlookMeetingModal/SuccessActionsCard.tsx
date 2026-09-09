import React from 'react';
import { Check, Calendar, Download, Mail } from 'lucide-react';

interface SuccessActionsCardProps {
  sendSuccess: string;
  outlookWebCalendarLink: string;
  icsDownloadUrl: string | null;
  icsFileName: string;
  mailtoLink: string;
}

export const SuccessActionsCard: React.FC<SuccessActionsCardProps> = ({
  sendSuccess,
  outlookWebCalendarLink,
  icsDownloadUrl,
  icsFileName,
  mailtoLink,
}) => {
  return (
    <div
      className="animate-fade-in"
      style={{
        background: '#ecfdf5',
        border: '1.5px solid #a7f3d0',
        color: '#047857',
        padding: '0.9rem 1.1rem',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '1.25rem',
        fontSize: '0.85rem',
        fontWeight: 600,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
        <Check size={20} color="#059669" />
        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{sendSuccess}</span>
      </div>

      <p style={{ fontSize: '0.775rem', color: '#065f46', margin: '0 0 0.65rem 0', fontWeight: 500 }}>
        💡 提醒：要讓會議「真正出現在您與受邀對象的 Outlook 行事曆」上，請選擇以下方式發出會議邀請：
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <a
          href={outlookWebCalendarLink}
          target="_blank"
          rel="noreferrer"
          style={{
            background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
            color: '#ffffff',
            padding: '0.5rem 0.85rem',
            borderRadius: '5px',
            fontSize: '0.8rem',
            textDecoration: 'none',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 2px 6px rgba(0, 120, 212, 0.25)',
          }}
        >
          <Calendar size={16} /> 📅 方式一：開啟 Outlook 網頁版行事曆正式發送 (點擊「傳送」後將自動出現在全員行事曆)
        </a>

        {icsDownloadUrl && (
          <a
            href={icsDownloadUrl}
            download={icsFileName}
            style={{
              background: '#059669',
              color: '#ffffff',
              padding: '0.45rem 0.85rem',
              borderRadius: '5px',
              fontSize: '0.8rem',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Download size={16} /> 📥 方式二：下載 Outlook 具名會議檔 ({icsFileName})，雙擊該檔會開啟 Outlook 桌面版會議邀請
          </a>
        )}

        <a
          href={mailtoLink}
          target="_blank"
          rel="noreferrer"
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#334155',
            padding: '0.35rem 0.75rem',
            borderRadius: '4px',
            fontSize: '0.775rem',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            width: 'fit-content',
          }}
        >
          <Mail size={14} /> ✉️ 方式三：開啟預設 Outlook 桌面郵件軟體
        </a>
      </div>
    </div>
  );
};
