import React from 'react';
import { Trash2 } from 'lucide-react';

interface ProjectBatchBarProps {
  totalProjects: number;
  selectedCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onBatchDelete: () => void;
  isDeleting: boolean;
}

export const ProjectBatchBar: React.FC<ProjectBatchBarProps> = ({
  totalProjects,
  selectedCount,
  isAllSelected,
  onToggleSelectAll,
  onBatchDelete,
  isDeleting,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
        padding: '0.5rem 0.75rem',
        background: '#f8fafc',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid #e2e8f0',
      }}
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
          userSelect: 'none',
          fontWeight: 600,
          color: '#334155',
        }}
      >
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={onToggleSelectAll}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        全選專案 ({selectedCount}/{totalProjects})
      </label>

      {selectedCount > 0 && (
        <button
          type="button"
          onClick={onBatchDelete}
          disabled={isDeleting}
          style={{
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '0.35rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 1px 2px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.15s ease',
          }}
        >
          <Trash2 size={14} /> 批次刪除 ({selectedCount})
        </button>
      )}
    </div>
  );
};
