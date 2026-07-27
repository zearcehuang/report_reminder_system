import React from 'react';
import { Project } from '../types';
import { ProjectSwitcher } from './ProjectSwitcher';
import { Calendar, Users, Bell, FileSpreadsheet, ShieldCheck } from 'lucide-react';

interface Props {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (project: Project) => void;
  onOpenProjectManager: () => void;
  onOpenHolidayModal: () => void;
  onOpenContactModal: () => void;
}

export const Navbar: React.FC<Props> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenProjectManager,
  onOpenHolidayModal,
  onOpenContactModal,
}) => {
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
                Automated Milestone & Teams Reminder Engine
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
          {/* DGPA Holiday Status Button */}
          <button
            onClick={onOpenHolidayModal}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
            title="檢視與同步行政院人事行政總處 (DGPA) 行事曆"
          >
            <ShieldCheck size={16} color="#34d399" />
            <span>DGPA 2026 行事曆</span>
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              fontSize: '0.7rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontWeight: 600,
            }}>
              已同步
            </span>
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
        </div>
      </div>
    </header>
  );
};
