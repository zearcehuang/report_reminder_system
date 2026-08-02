import React from 'react';
import { Trash2 } from 'lucide-react';

interface RuleBatchToolbarProps {
  totalRules: number;
  selectedCount: number;
  onToggleSelectAll: () => void;
  onBatchDelete: () => void;
}

export const RuleBatchToolbar: React.FC<RuleBatchToolbarProps> = ({
  totalRules,
  selectedCount,
  onToggleSelectAll,
  onBatchDelete,
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      padding: '0.5rem 0.75rem',
      background: '#f8fafc',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid #e2e8f0',
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none', fontWeight: 600, color: '#334155' }}>
        <input
          type="checkbox"
          checked={totalRules > 0 && selectedCount === totalRules}
          onChange={onToggleSelectAll}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        全選規則 ({selectedCount}/{totalRules})
      </label>

      {selectedCount > 0 && (
        <button
          onClick={onBatchDelete}
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
          }}
        >
          <Trash2 size={14} /> 批次刪除選取規則 ({selectedCount})
        </button>
      )}
    </div>
  );
};
