import React from 'react';
import { Project, UserSession } from '../types';
import { ProjectSwitcher } from './ProjectSwitcher';
import { Calendar, Users, Bell, FileSpreadsheet, ShieldCheck, Terminal, FilePlus, KeyRound } from 'lucide-react';

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
}

export const Navbar: React.FC<Props> = ({
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
}) => {
  const getRoleBadgeStyle = (role: string) => {
    if (role === 'Admin') return { bg: '#fef2f2', color: '#dc2626', label: '👑 Admin' };
    if (role === 'PM') return { bg: '#eff6ff', color: '#2563eb', label: '💼 PM' };
    return { bg: '#f8fafc', color: '#475569', label: '👁️ Auditor' };
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

        {/* Right action controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* User Auth Role Badge Button */}
          <button
            onClick={onOpenUserAuthModal}
            className="btn-secondary"
            style={{
              fontSize: '0.825rem',
              padding: '0.45rem 0.85rem',
              background: roleStyle.bg,
              borderColor: roleStyle.color,
              color: roleStyle.color,
              fontWeight: 700,
            }}
            title="點擊切換使用者身分與檢視 RBAC 權限"
          >
            <KeyRound size={15} color={roleStyle.color} />
            <span>{roleStyle.label}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 500 }}>({currentUser.name.split(' ')[0]})</span>
          </button>

          {/* Manual Add Report Button (Disabled for Auditor) */}
          <button
            onClick={onOpenAddReportModal}
            disabled={currentUser.role === 'Auditor'}
            className="btn-primary"
            style={{
              fontSize: '0.825rem',
              padding: '0.45rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: currentUser.role === 'Auditor' ? 0.5 : 1,
              cursor: currentUser.role === 'Auditor' ? 'not-allowed' : 'pointer'
            }}
            title={currentUser.role === 'Auditor' ? "Auditor 唯讀權限無法新增報告" : "手動新增專案履約報告與死線提醒"}
          >
            <FilePlus size={16} />
            <span>手動新增履約報告</span>
          </button>

          {/* Automated Scheduler & Logs Button */}
          <button
            onClick={onOpenSchedulerLogModal}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
            title="檢視背景自動排程狀態與通知發送日誌"
          >
            <Calendar size={16} color="#818cf8" />
            <span>排程與通知日誌</span>
          </button>

          {/* DGPA Holiday Status Button */}
          <button
            onClick={onOpenHolidayModal}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
            title="檢視與同步行政院人事行政總處 (DGPA) 行事曆"
          >
            <ShieldCheck size={16} color="#34d399" />
            <span>DGPA 2026 行事曆</span>
          </button>

          {/* Contact Import Button */}
          <button
            onClick={onOpenContactModal}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
            title="匯入 Outlook 通訊錄 (CSV / vCard)"
          >
            <Users size={16} color="#60a5fa" />
            <span>Outlook 通訊錄</span>
          </button>

          {/* Error Logs Console Button */}
          <button
            onClick={onOpenErrorLogModal}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', borderColor: '#fca5a5', color: '#ef4444' }}
            title="檢視前後端 Error Log 診斷控制台"
          >
            <Terminal size={16} color="#ef4444" />
            <span>Error Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
