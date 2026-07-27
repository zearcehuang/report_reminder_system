import React, { useState, useEffect } from 'react';
import { MilestoneRule, Contact } from '../types';
import { Layers, Plus, Trash2, Check, User, Mail, Sparkles, ChevronRight, ToggleLeft, ToggleRight, X } from 'lucide-react';

interface Props {
  projectId: string;
  rules: MilestoneRule[];
  contacts: Contact[];
  onSaveRules: (rules: MilestoneRule[]) => Promise<void>;
  projectDDay: string;
}

export const RuleManager: React.FC<Props> = ({
  projectId,
  rules,
  contacts,
  onSaveRules,
  projectDDay,
}) => {
  const [localRules, setLocalRules] = useState<MilestoneRule[]>(rules);
  const [isSaving, setIsSaving] = useState(false);
  const [activeOwnerInputIndex, setActiveOwnerInputIndex] = useState<number | null>(null);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalRules(rules);
    setHasChanges(false);
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

  const handleRemoveRule = (index: number) => {
    const next = localRules.filter((_, i) => i !== index);
    setLocalRules(next);
    setHasChanges(true);
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
              預設 10 項標準驗收報告 Slots，提供標籤式 Outlook 多負責人自動完成下拉
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

          return (
            <div
              key={rule.id}
              style={{
                background: rule.enabled ? '#ffffff' : 'rgba(241, 245, 249, 0.6)',
                border: '1px solid var(--surface-glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'grid',
                gridTemplateColumns: '80px 1.8fr 1fr 2fr auto',
                gap: '1rem',
                alignItems: 'center',
                opacity: rule.enabled ? 1 : 0.6,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Slot Number & Enable Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                      placeholder={rule.owners.length === 0 ? '輸入 Outlook Email 搜尋...' : '+ 新增負責人'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        outline: 'none',
                        flex: 1,
                        minWidth: '130px',
                      }}
                      value={activeOwnerInputIndex === idx ? ownerSearchQuery : ''}
                      onFocus={() => {
                        setActiveOwnerInputIndex(idx);
                        setOwnerSearchQuery('');
                      }}
                      onChange={(e) => setOwnerSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && ownerSearchQuery) {
                          e.preventDefault();
                          handleAddOwnerTag(idx, ownerSearchQuery);
                        }
                      }}
                    />
                  )}
                </div>

                {/* Outlook Autocomplete Dropdown (Bright Light Mode Style) */}
                {activeOwnerInputIndex === idx && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 80 }}
                      onClick={() => setActiveOwnerInputIndex(null)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid #cbd5e1',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.08)',
                        zIndex: 90,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        padding: '0.45rem',
                      }}
                    >
                      <div style={{
                        fontSize: '0.725rem',
                        color: '#475569',
                        background: '#f8fafc',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        marginBottom: '0.35rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #f1f5f9'
                      }}>
                        <span>👥 Outlook 聯絡人快速選擇</span>
                        <span style={{ fontSize: '0.675rem', color: '#94a3b8', fontWeight: 500 }}>共 {filteredContacts.length} 筆</span>
                      </div>
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleAddOwnerTag(idx, c.email)}
                            style={{
                              padding: '0.45rem 0.65rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              transition: 'background 0.15s ease',
                              marginBottom: '2px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                              <div style={{ fontSize: '0.725rem', color: '#475569' }}>{c.email}</div>
                            </div>
                            {c.department && (
                              <span style={{
                                fontSize: '0.7rem',
                                color: '#4338ca',
                                background: '#e0e7ff',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontWeight: 600
                              }}>
                                {c.department}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div
                          onClick={() => handleAddOwnerTag(idx, ownerSearchQuery)}
                          style={{
                            padding: '0.5rem 0.65rem',
                            fontSize: '0.8rem',
                            color: '#2563eb',
                            background: '#eff6ff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          + 使用自訂 Email: "{ownerSearchQuery}"
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Action Delete */}
              <div>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleRemoveRule(idx)}
                  title="刪除此里程碑"
                >
                  <Trash2 size={16} color="#f87171" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
