import React from 'react';
import {
  Settings,
  ChevronDown,
  Sparkles,
  Calendar,
  ShieldCheck,
  Users,
  Terminal,
} from 'lucide-react';

interface ToolsDropdownProps {
  isOpen: boolean;
  toolsMenuRef: React.RefObject<HTMLDivElement>;
  onToggle: () => void;
  onClose: () => void;
  onOpenSystemSettingsModal?: () => void;
  onOpenSchedulerLogModal: () => void;
  onOpenHolidayModal: () => void;
  onOpenContactModal: () => void;
  onOpenErrorLogModal: () => void;
}

export const ToolsDropdown: React.FC<ToolsDropdownProps> = ({
  isOpen,
  toolsMenuRef,
  onToggle,
  onClose,
  onOpenSystemSettingsModal,
  onOpenSchedulerLogModal,
  onOpenHolidayModal,
  onOpenContactModal,
  onOpenErrorLogModal,
}) => {
  return (
    <div ref={toolsMenuRef} style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        className="btn-secondary"
        style={{
          fontSize: '0.825rem',
          padding: '0.48rem 0.85rem',
          borderColor: isOpen ? 'var(--accent-secondary)' : 'var(--surface-glass-border)',
          background: isOpen ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <Settings size={16} color="#818cf8" />
        <span>⚙️ 系統與工具</span>
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
            width: '260px',
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
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              padding: '0.4rem 0.6rem 0.25rem',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '0.35rem',
            }}
          >
            組態與系統日誌模組 (SYSTEM & LOGS)
          </div>

          <button
            onClick={() => {
              onClose();
              if (onOpenSystemSettingsModal) onOpenSystemSettingsModal();
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
            <Sparkles size={17} color="#6366f1" />
            <div>
              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Gemini AI 與系統設定</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: '#e0e7ff',
                    color: '#4338ca',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  加密
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                API Key 配置、模型切換與連線測試
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenSchedulerLogModal();
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
            <Calendar size={17} color="#4f46e5" />
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>排程與通知發送日誌</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                背景 Scan 掃描與歷史紀錄
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenHolidayModal();
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
            <ShieldCheck size={17} color="#059669" />
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>DGPA 國定假日行事曆</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                政府辦公日曆與補班日運算
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenContactModal();
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
            <Users size={17} color="#2563eb" />
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>Outlook 企業通訊錄</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                匯入與管理成員 Email
              </div>
            </div>
          </button>

          <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.35rem 0' }} />

          <button
            onClick={() => {
              onClose();
              onOpenErrorLogModal();
            }}
            className="dropdown-item-hover"
            style={{
              width: '100%',
              padding: '0.55rem 0.65rem',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#dc2626',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Terminal size={17} color="#dc2626" />
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>Error Logs 診斷台</div>
              <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>
                後端例外與系統診斷 Console
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
