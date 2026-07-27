import React, { useState } from 'react';
import { Project } from '../types';
import { ChevronDown, Folder, Plus, Settings2 } from 'lucide-react';

interface Props {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (project: Project) => void;
  onOpenProjectManager: () => void;
}

export const ProjectSwitcher: React.FC<Props> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenProjectManager,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#ffffff',
          border: '1px solid var(--surface-glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 0.85rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--surface-glass-border)')}
      >
        <div style={{
          background: 'var(--accent-gradient)',
          borderRadius: '6px',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Folder size={15} color="#fff" />
        </div>

        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
            目前專案
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>[{activeProject.code}]</span>
            <span>{activeProject.name}</span>
          </div>
        </div>

        <ChevronDown size={18} style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="animate-slide-down"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              minWidth: '280px',
              background: 'var(--dropdown-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--surface-glass-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              padding: '0.5rem',
            }}
          >
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', padding: '0.4rem 0.6rem', fontWeight: 600 }}>
              選擇履約專案
            </div>

            {projects.map((proj) => {
              const isSelected = proj.id === activeProject.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                    color: isSelected ? '#4338ca' : 'var(--text-primary)',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(241, 245, 249, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      [{proj.code}]
                    </span>
                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>{proj.name}</span>
                  </div>
                  {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary)' }} />}
                </div>
              );
            })}

            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.4rem 0' }} />

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenProjectManager();
              }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-secondary)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.825rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Settings2 size={16} /> 管理與新建專案...
            </button>
          </div>
        </>
      )}
    </div>
  );
};
