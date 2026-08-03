import React, { useState, useRef, useEffect, memo } from 'react';
import { Project, UserSession } from '../types';
import { ProjectSwitcher } from './ProjectSwitcher';
import {
  Calendar,
  Users,
  Bell,
  ShieldCheck,
  Terminal,
  FilePlus,
  KeyRound,
  ChevronDown,
  Settings,
  Shield,
  BookOpen,
  UserCheck,
  Activity
} from 'lucide-react';

interface Props {
  projects: Project[];
  activeProject: Project;
  currentUser?: UserSession;
  onSelectProject: (project: Project) => void;
  onOpenProjectManager: () => void;
  onOpenHolidayModal: () => void;
  onOpenContactModal: () => void;
  onOpenErrorLogModal: () => void;
  onOpenAddReportModal: () => void;
  onOpenSchedulerLogModal: () => void;
  onOpenUserAuthModal: () => void;
  onOpenUserPermissionModal: () => void;
}

export const Navbar: React.FC<Props> = memo(({
  projects,
  activeProject,
  currentUser = { id: '1', email: 'admin@company.com', name: '系統最高管理員', role: 'Admin' },
  onSelectProject,
  onOpenProjectManager,
  onOpenHolidayModal,
  onOpenContactModal,
  onOpenErrorLogModal,
  onOpenAddReportModal,
  onOpenSchedulerLogModal,
  onOpenUserAuthModal,
  onOpenUserPermissionModal,
}) => {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Click-away listener to automatically close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'Admin') return { bg: '#fef2f2', color: '#dc2626', label: '👑 Admin' };
    if (role === 'PM') return { bg: '#eff6ff', color: '#2563eb', label: '💼 PM' };
    if (role === 'Auditor') return { bg: '#f8fafc', color: '#475569', label: '👁️ Auditor' };
    return { bg: '#faf5ff', color: '#9333ea', label: `🛡️ ${role}` };
  };

  const roleStyle = getRoleBadgeStyle(currentUser.role);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--surface-glass-border)',
        padding: '0.85rem 2rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--accent-gradient)',
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <Bell size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', lineHeight: '1.2' }}>
                <span className="gradient-text">專案履約報告</span> 繳交提醒系統
              </h1>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Automated Milestone & Outlook Meeting Publisher
              </p>
            </div>
          </div>

          <div style={{ height: '28px', width: '1px', background: 'rgba(203, 213, 225, 0.8)' }} />

          {/* Project Switcher */}
          <ProjectSwitcher
            projects={projects}
            activeProject={activeProject}
            onSelectProject={onSelectProject}
            onOpenProjectManager={onOpenProjectManager}
          />
        </div>

        {/* Right Action Menu Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* 1. Primary Action: Add Report */}
          <button
            onClick={onOpenAddReportModal}
            disabled={currentUser.role === 'Auditor'}
            className="btn-primary"
            style={{
              fontSize: '0.825rem',
              padding: '0.48rem 0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: currentUser.role === 'Auditor' ? 0.5 : 1,
              cursor: currentUser.role === 'Auditor' ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            }}
            title={currentUser.role === 'Auditor' ? "Auditor 唯讀權限無法新增報告" : "手動新增專案履約報告與死線提醒"}
          >
            <FilePlus size={16} />
            <span>➕ 手動新增履約報告</span>
          </button>

          {/* 2. Categorized Dropdown: System & Tools (⚙️ 系統與工具) */}
          <div ref={toolsMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setIsToolsMenuOpen(!isToolsMenuOpen);
                setIsAccountMenuOpen(false);
              }}
              className="btn-secondary"
              style={{
                fontSize: '0.825rem',
                padding: '0.48rem 0.85rem',
                borderColor: isToolsMenuOpen ? 'var(--accent-secondary)' : 'var(--surface-glass-border)',
                background: isToolsMenuOpen ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Settings size={16} color="#818cf8" />
              <span>⚙️ 系統與工具</span>
              <ChevronDown size={14} style={{ transform: isToolsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
            </button>

            {isToolsMenuOpen && (
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
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, padding: '0.4rem 0.6rem 0.25rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.35rem' }}>
                  組態與系統日誌模組 (SYSTEM & LOGS)
                </div>

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>背景 Scan 掃描與歷史紀錄</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>政府辦公日曆與補班日運算</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>匯入與管理成員 Email</div>
                  </div>
                </button>

                <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.35rem 0' }} />

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
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
                    <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>後端例外與系統診斷 Console</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 3. Categorized Dropdown: Account & Permissions (🛡️ 帳號與權限) */}
          <div ref={accountMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setIsAccountMenuOpen(!isAccountMenuOpen);
                setIsToolsMenuOpen(false);
              }}
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
              <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 500 }}>({currentUser.name.split(' ')[0]})</span>
              <ChevronDown size={14} style={{ transform: isAccountMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
            </button>

            {isAccountMenuOpen && (
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
                <div style={{ padding: '0.5rem 0.65rem 0.6rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.35rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>當前登入帳號 (SESSION)</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                    {currentUser.email}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>JWT 登入與快速帳號切換</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>帳號 CRUD 與 Role 權限矩陣</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
