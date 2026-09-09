import React from 'react';
import { Trash2 } from 'lucide-react';
import { ScheduleItem } from '../../types';

interface BatchSelectBarProps {
  filtered: ScheduleItem[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onBatchDelete: () => void;
  isDeleting: boolean;
}

export const BatchSelectBar: React.FC<BatchSelectBarProps> = ({
  filtered,
  selectedIds,
  setSelectedIds,
  onBatchDelete,
  isDeleting,
}) => {
  const isAllSelected =
    filtered.length > 0 &&
    filtered.every((s) => selectedIds.map(String).includes(String(s.id)));

  const handleToggleSelectAll = () => {
    const allFilteredIdStrs = filtered.map((s) => String(s.id));
    if (isAllSelected) {
      setSelectedIds(selectedIds.filter((id) => !allFilteredIdStrs.includes(String(id))));
    } else {
      const combined = Array.from(new Set([...selectedIds.map(String), ...allFilteredIdStrs]));
      setSelectedIds(combined);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
        padding: '0.55rem 0.85rem',
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
          onChange={handleToggleSelectAll}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        全選報告項目 ({selectedIds.length}/{filtered.length})
      </label>

      {selectedIds.length > 0 && (
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
          <Trash2 size={14} /> 批次刪除 ({selectedIds.length})
        </button>
      )}
    </div>
  );
};
