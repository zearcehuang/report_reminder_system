import React from 'react';
import { ToggleRight, ToggleLeft, Edit3, Trash2 } from 'lucide-react';
import { MilestoneRule, Contact } from '../../types';
import { RuleOwnerSelector } from './RuleOwnerSelector';

interface RuleItemRowProps {
  rule: MilestoneRule;
  idx: number;
  isSelected: boolean;
  projectDDay: string;
  selectableTeam: { id?: string; role: string; name: string; email: string }[];
  contacts: Contact[];
  onToggleSelectRule: (id: string) => void;
  onUpdateRule: (idx: number, updates: Partial<MilestoneRule>) => void;
  onRemoveRule: (idx: number) => void;
  onEditRule?: (rule: MilestoneRule) => void;
}

export const RuleItemRow: React.FC<RuleItemRowProps> = ({
  rule,
  idx,
  isSelected,
  projectDDay,
  selectableTeam,
  contacts,
  onToggleSelectRule,
  onUpdateRule,
  onRemoveRule,
  onEditRule,
}) => {
  let datePreview = '未設定 D-Day';
  if (projectDDay) {
    const d = new Date(projectDDay);
    d.setDate(d.getDate() + rule.dayOffset);
    datePreview = d.toISOString().split('T')[0];
  }

  return (
    <div
      style={{
        background: isSelected ? '#fff1f2' : (rule.enabled ? '#ffffff' : 'rgba(241, 245, 249, 0.6)'),
        border: isSelected ? '2px solid #f43f5e' : '1px solid var(--surface-glass-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'grid',
        gridTemplateColumns: 'auto 80px 1.8fr 1fr 2fr auto',
        gap: '1rem',
        alignItems: 'center',
        opacity: rule.enabled ? 1 : 0.6,
        transition: 'all 0.2s ease',
      }}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelectRule(rule.id)}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          background: 'rgba(203, 213, 225, 0.5)',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontWeight: 700,
        }}>
          #{idx + 1}
        </span>

        <button
          type="button"
          onClick={() => onUpdateRule(idx, { enabled: !rule.enabled })}
          style={{
            background: 'transparent',
            border: 'none',
            color: rule.enabled ? 'var(--accent-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
          }}
          title={rule.enabled ? '關閉此里程碑' : '啟用此里程碑'}
        >
          {rule.enabled ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
        </button>
      </div>

      <div>
        <input
          type="text"
          className="input-glass"
          value={rule.title}
          onChange={(e) => onUpdateRule(idx, { title: e.target.value })}
          placeholder="里程碑報告名稱"
          disabled={!rule.enabled}
          style={{ fontSize: '0.9rem', fontWeight: 600 }}
        />
      </div>

      <div>
        <div style={{ position: 'relative', marginBottom: '0.25rem' }}>
          <span style={{
            position: 'absolute',
            left: '0.65rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--accent-primary)',
            fontWeight: 700,
          }}>
            D +
          </span>
          <input
            type="number"
            min="0"
            max="1000"
            className="input-glass"
            style={{ paddingLeft: '2.4rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
            value={rule.dayOffset}
            onChange={(e) => onUpdateRule(idx, { dayOffset: Number(e.target.value) })}
            disabled={!rule.enabled}
            title="修改 D+N 相對天數"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <input
            type="date"
            value={datePreview}
            disabled={!rule.enabled || !projectDDay}
            onChange={(e) => {
              const chosenDateStr = e.target.value;
              if (chosenDateStr && projectDDay) {
                const d1 = new Date(chosenDateStr);
                const d2 = new Date(projectDDay);
                const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
                if (!isNaN(diffDays)) {
                  onUpdateRule(idx, { dayOffset: Math.max(0, diffDays) });
                }
              }
            }}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '0.15rem 0.35rem',
              fontSize: '0.725rem',
              color: '#334155',
              fontWeight: 600,
              background: '#f8fafc',
              width: '100%',
              cursor: 'pointer',
            }}
            title="點擊日曆圖示即可直接選取死線日期 (自動連動 D+N)"
          />
        </div>
      </div>

      <RuleOwnerSelector
        ruleOwners={rule.owners}
        ruleEnabled={rule.enabled}
        selectableTeam={selectableTeam}
        contacts={contacts}
        onUpdateOwners={(owners) => onUpdateRule(idx, { owners })}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {onEditRule && (
          <button
            type="button"
            className="btn-icon"
            onClick={() => onEditRule(rule)}
            style={{ color: '#4f46e5', border: '1px solid #c7d2fe', background: '#e0e7ff', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
            title="編輯履約報告名稱與死線日期"
          >
            <Edit3 size={16} />
          </button>
        )}

        <button
          type="button"
          className="btn-icon"
          onClick={() => onRemoveRule(idx)}
          style={{ color: '#ef4444', border: '1px solid #fee2e2', background: '#fef2f2', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
          title="刪除此里程碑規則"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
