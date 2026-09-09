import React, { useState, useRef, useEffect, memo } from 'react';
import { Project, UserSession } from '../types';
import { ProjectSwitcher } from './ProjectSwitcher';
import { Bell, FilePlus } from 'lucide-react';
import { ToolsDropdown } from './Navbar/ToolsDropdown';
import { AccountDropdown } from './Navbar/AccountDropdown';

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
  onOpenSystemSettingsModal?: () => void;
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
  onOpenSystemSettingsModal,
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
            title={currentUser.role === 'Auditor' ? 'Auditor 唯讀權限無法新增報告' : '手動新增專案履約報告與死線提醒'}
          >
            <FilePlus size={16} />
            <span>➕ 手動新增履約報告</span>
          </button>

          {/* 2. Categorized Dropdown: System & Tools (⚙️ 系統與工具) */}
          <ToolsDropdown
            isOpen={isToolsMenuOpen}
            toolsMenuRef={toolsMenuRef}
            onToggle={() => {
              setIsToolsMenuOpen(!isToolsMenuOpen);
              setIsAccountMenuOpen(false);
            }}
            onClose={() => setIsToolsMenuOpen(false)}
            onOpenSystemSettingsModal={onOpenSystemSettingsModal}
            onOpenSchedulerLogModal={onOpenSchedulerLogModal}
            onOpenHolidayModal={onOpenHolidayModal}
            onOpenContactModal={onOpenContactModal}
            onOpenErrorLogModal={onOpenErrorLogModal}
          />

          {/* 3. Categorized Dropdown: Account & Permissions (🛡️ 帳號與權限) */}
          <AccountDropdown
            isOpen={isAccountMenuOpen}
            accountMenuRef={accountMenuRef}
            currentUser={currentUser}
            onToggle={() => {
              setIsAccountMenuOpen(!isAccountMenuOpen);
              setIsToolsMenuOpen(false);
            }}
            onClose={() => setIsAccountMenuOpen(false)}
            onOpenUserAuthModal={onOpenUserAuthModal}
            onOpenUserPermissionModal={onOpenUserPermissionModal}
          />
        </div>
      </div>
    </header>
  );
});
