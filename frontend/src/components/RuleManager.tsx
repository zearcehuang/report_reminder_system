import React, { useState, useEffect } from 'react';
import { MilestoneRule, Contact } from '../types';
import { Layers, Plus, Trash2, Check, User, Mail, Sparkles, ChevronRight, ToggleLeft, ToggleRight, X } from 'lucide-react';

interface Props {
  projectId: string;
  rules: MilestoneRule[];
  contacts: Contact[];
  onSaveRules: (rules: MilestoneRule[]) => Promise<void>;
  projectDDay: string;
  onDeleteRule?: (projectId: string, ruleId: string) => Promise<void>;
  onBatchDeleteRules?: (projectId: string, ruleIds: string[]) => Promise<void>;
}

export const RuleManager: React.FC<Props> = ({
  projectId,
  rules,
  contacts,
  onSaveRules,
  projectDDay,
  onDeleteRule,
  onBatchDeleteRules,
}) => {
  const [localRules, setLocalRules] = useState<MilestoneRule[]>(rules);
  const [isSaving, setIsSaving] = useState(false);
  const [activeOwnerInputIndex, setActiveOwnerInputIndex] = useState<number | null>(null);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  useEffect(() => {
    setLocalRules(rules);
    setHasChanges(false);
    setSelectedRuleIds([]);
  }, [rules, projectId]);

  const handleUpdateRule = (index: number, updates: Partial<MilestoneRule>) => {
    const next = [...localRules];
    next[index] = { ...next[index], ...updates };
    setLocalRules(next);
    setHasChanges(true);
  };

  const handleAddRule = () => {
    const newRule: MilestoneRule = {
      id: `rule-${Date.now()}`,
      projectId,
      title: '自訂履約里程碑報告',
      dayOffset: 100,
      owners: ['pm.alex@company.com'],
      enabled: true,
    };
    setLocalRules([...localRules, newRule]);
    setHasChanges(true);
  };

  const handleRemoveRule = async (index: number) => {
    const targetRule = localRules[index];
    if (window.confirm(`確定要刪除規則「${targetRule.title}」嗎？`)) {
      if (onDeleteRule && targetRule.id) {
        await onDeleteRule(projectId, targetRule.id);
      }
      const next = localRules.filter((_, i) => i !== index);
      setLocalRules(next);
      setSelectedRuleIds(selectedRuleIds.filter(id => id !== targetRule.id));
      setHasChanges(true);
    }
  };

  const handleBatchDeleteRules = async () => {
    if (selectedRuleIds.length === 0) return;
    if (window.confirm(`確定要刪除選取的 ${selectedRuleIds.length} 項履約規則嗎？`)) {
      if (onBatchDeleteRules) {
        await onBatchDeleteRules(projectId, selectedRuleIds);
      }
      const next = localRules.filter(r => !selectedRuleIds.includes(r.id));
      setLocalRules(next);
      setSelectedRuleIds([]);
      setHasChanges(true);
    }
  };

  const toggleSelectRule = (id: string) => {
    if (selectedRuleIds.includes(id)) {
      setSelectedRuleIds(selectedRuleIds.filter(item => item !== id));
    } else {
      setSelectedRuleIds([...selectedRuleIds, id]);
    }
  };

  const toggleSelectAllRules = () => {
    if (selectedRuleIds.length === localRules.length) {
      setSelectedRuleIds([]);
    } else {
      setSelectedRuleIds(localRules.map(r => r.id));
    }
  };

  const handleAddOwnerTag = (ruleIndex: number, ownerEmail: string) => {
    if (!ownerEmail || localRules[ruleIndex].owners.includes(ownerEmail)) return;
    const nextOwners = [...localRules[ruleIndex].owners, ownerEmail];
    handleUpdateRule(ruleIndex, { owners: nextOwners });
    setOwnerSearchQuery('');
    setActiveOwnerInputIndex(null);
  };

  const handleRemoveOwnerTag = (ruleIndex: number, ownerEmail: string) => {
    const nextOwners = localRules[ruleIndex].owners.filter((o) => o !== ownerEmail);
    handleUpdateRule(ruleIndex, { owners: nextOwners });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveRules(localRules);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter contacts for dropdown autocomplete
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(ownerSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(ownerSearchQuery.toLowerCase())
  );

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            padding: '0.55rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
          }}>
            <Layers size={22} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>履約里程碑與通知負責人設定</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              預設 10 項標準驗收報告 Slots，提供單一/批次刪除與標籤式 Outlook 多負責人自動完成下拉
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={handleAddRule} style={{ fontSize: '0.85rem' }}>
            <Plus size={16} /> 新增里程碑
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            style={{ opacity: !hasChanges && !isSaving ? 0.7 : 1 }}
          >
            <Check size={16} />
            <span>{isSaving ? '儲存中...' : hasChanges ? '儲存規則變更' : '規則已是最新'}</span>
          </button>
        </div>
      </div>

      {/* Batch Select Toolbar */}
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
            checked={localRules.length > 0 && selectedRuleIds.length === localRules.length}
            onChange={toggleSelectAllRules}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          全選規則 ({selectedRuleIds.length}/{localRules.length})
        </label>

        {selectedRuleIds.length > 0 && (
          <button
            onClick={handleBatchDeleteRules}
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
            <Trash2 size={14} /> 批次刪除選取規則 ({selectedRuleIds.length})
          </button>
        )}
      </div>

      {/* Rules Table / Slots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {localRules.map((rule, idx) => {
          // Calculate preliminary date offset preview
          let datePreview = '未設定 D-Day';
          if (projectDDay) {
            const d = new Date(projectDDay);
            d.setDate(d.getDate() + rule.dayOffset);
            datePreview = d.toISOString().split('T')[0];
          }

          const isSelected = selectedRuleIds.includes(rule.id);

          return (
            <div
              key={rule.id}
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
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelectRule(rule.id)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />

              {/* Slot Number & Enable Switch */}
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
                  onClick={() => handleUpdateRule(idx, { enabled: !rule.enabled })}
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

              {/* Title Input */}
              <div>
                <input
                  type="text"
                  className="input-glass"
                  value={rule.title}
                  onChange={(e) => handleUpdateRule(idx, { title: e.target.value })}
                  placeholder="里程碑報告名稱"
                  disabled={!rule.enabled}
                  style={{ fontSize: '0.9rem', fontWeight: 600 }}
                />
              </div>

              {/* Day Offset (D+N) Input */}
              <div>
                <div style={{ position: 'relative' }}>
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
                    onChange={(e) => handleUpdateRule(idx, { dayOffset: Number(e.target.value) })}
                    disabled={!rule.enabled}
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  預計死線: {datePreview}
                </div>
              </div>

              {/* Multi-Owner Tag Input with Outlook Autocomplete */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '1px solid rgba(203, 213, 225, 0.9)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.6rem',
                  minHeight: '40px',
                }}>
                  {rule.owners.map((owner) => (
                    <span
                      key={owner}
                      style={{
                        background: '#e0e7ff',
                        border: '1px solid #c7d2fe',
                        color: '#3730a3',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <User size={11} /> {owner}
                      {rule.enabled && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOwnerTag(idx, owner)}
                          style={{ background: 'transparent', border: 'none', color: '#a5b4fc', cursor: 'pointer', display: 'flex' }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))}

                  {rule.enabled && (
                    <input
                      type="text"
                      placeholder={rule.owners.length === 0 ? '輸入負責人姓名或 Email (支援 Outlook 選單)...' : '+ 新增...'}
                      value={activeOwnerInputIndex === idx ? ownerSearchQuery : ''}
                      onFocus={() => {
                        setActiveOwnerInputIndex(idx);
                        setOwnerSearchQuery('');
                      }}
                      onChange={(e) => setOwnerSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && ownerSearchQuery.trim()) {
                          e.preventDefault();
                          handleAddOwnerTag(idx, ownerSearchQuery.trim());
                        }
                      }}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '0.8rem',
                        flex: 1,
                        minWidth: '120px',
                      }}
                    />
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {activeOwnerInputIndex === idx && ownerSearchQuery.trim().length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    marginTop: '0.2rem',
                  }}>
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleAddOwnerTag(idx, `${c.name} (${c.email})`)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          className="contact-dropdown-item"
                        >
                          <div>
                            <strong>{c.name}</strong> <span style={{ color: '#64748b' }}>({c.department})</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.email}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        按下 Enter 直接新增 「{ownerSearchQuery}」
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                type="button"
                className="btn-icon"
                onClick={() => handleRemoveRule(idx)}
                style={{ color: '#ef4444', border: '1px solid #fee2e2', background: '#fef2f2', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
                title="刪除此里程碑規則"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
