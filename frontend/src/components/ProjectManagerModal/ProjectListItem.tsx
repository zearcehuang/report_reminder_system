import React from 'react';
import { Project } from '../../types';
import { Calendar, Check, Trash2, User } from 'lucide-react';

interface ProjectListItemProps {
  proj: Project;
  isActive: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
  onDelete: () => void;
}

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
  proj,
  isActive,
  isSelected,
  isDeleting,
  onSelect,
  onToggleSelect,
  onDelete,
}) => {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: isSelected ? '#fff1f2' : isActive ? '#eff6ff' : '#ffffff',
        border: isSelected
          ? '2px solid #f43f5e'
          : isActive
          ? '2px solid #3b82f6'
          : '1px solid #e2e8f0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
      }}
      className="project-item-hover"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.35rem',
            }}
          >
            <span
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {proj.code}
            </span>
            <h4 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 600 }}>{proj.name}</h4>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '0.8rem',
              color: '#475569',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {proj.projectOwners && proj.projectOwners.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>團隊:</span>
                {proj.projectOwners.map((po, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: po.role.includes('業務')
                        ? '#fef3c7'
                        : po.role.includes('PM')
                        ? '#dbeafe'
                        : '#f3e8ff',
                      color: po.role.includes('業務')
                        ? '#b45309'
                        : po.role.includes('PM')
                        ? '#1d4ed8'
                        : '#6b21a8',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}
                  >
                    [{po.role}] {po.name}
                  </span>
                ))}
              </div>
            ) : (
              proj.ownerEmail && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: '#3730a3',
                    fontWeight: 600,
                  }}
                >
                  <User size={13} color="#4f46e5" /> 負責人:{' '}
                  {proj.ownerName ? `${proj.ownerName} (${proj.ownerEmail})` : proj.ownerEmail}
                </span>
              )
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={14} color="#2563eb" /> D-Day: {proj.dDay || '未設定'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isActive && (
          <div
            style={{
              background: 'var(--accent-gradient)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Check size={14} /> 目前使用中
          </div>
        )}

        <button
          type="button"
          className="btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          title="刪除此專案"
          style={{
            color: '#ef4444',
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #fee2e2',
            background: '#fef2f2',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
