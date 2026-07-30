import React, { useState, useEffect } from 'react';
import { MilestoneRule, Contact, Project } from '../types';
import { Edit3, X, Calendar, Clock, User, Check, AlertCircle, Users } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  rule: MilestoneRule | null;
  contacts: Contact[];
  onSaveRule: (updatedRule: MilestoneRule) => Promise<void>;
}

export const EditReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeProject,
  rule,
  contacts,
  onSaveRule,
}) => {
  const [title, setTitle] = useState('');
  const [dateMode, setDateMode] = useState<'offset' | 'date'>('date');
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [targetDate, setTargetDate] = useState<string>('');
  const [owners, setOwners] = useState<string[]>([]);
  const [ownerInput, setOwnerInput] = useState('');
  const [notes, setNotes] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && rule && activeProject) {
      setTitle(rule.title || '');
      setDayOffset(rule.dayOffset ?? 0);
      setOwners(rule.owners || []);
      setNotes(rule.notes || '');
      setEnabled(rule.enabled !== undefined ? rule.enabled : true);
      setErrorMsg('');

      // Calculate initial target date from D-Day + dayOffset
      if (activeProject.dDay) {
        const d = new Date(activeProject.dDay);
        d.setDate(d.getDate() + (rule.dayOffset ?? 0));
        setTargetDate(d.toISOString().split('T')[0]);
      } else {
        setTargetDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, rule, activeProject]);

  if (!isOpen || !rule || !activeProject) return null;

  // Calculate preview date for offset mode
  const getOffsetPreviewDate = (): string => {
    if (!activeProject.dDay) return '未設定開工日 (D-Day)';
    const d = new Date(activeProject.dDay);
    d.setDate(d.getDate() + Number(dayOffset || 0));
    return d.toISOString().split('T')[0];
  };

  // Calculate calculated offset for specific date mode
  const getCalculatedOffset = (): number => {
    if (!activeProject.dDay || !targetDate) return 0;
    const d1 = new Date(targetDate);
    const d2 = new Date(activeProject.dDay);
    const diffTime = d1.getTime() - d2.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    return isNaN(diffDays) ? 0 : diffDays;
  };

  const handleAddOwner = (ownerStr: string) => {
    const trimmed = ownerStr.trim();
    if (!trimmed || owners.includes(trimmed)) return;
    setOwners([...owners, trimmed]);
    setOwnerInput('');
  };

  const handleRemoveOwner = (ownerStr: string) => {
    setOwners(owners.filter((o) => o !== ownerStr));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('請輸入履約報告名稱');
      return;
    }

    let finalOffset = dayOffset;
    if (dateMode === 'date') {
      finalOffset = getCalculatedOffset();
    }

    if (finalOffset < 0) {
      setErrorMsg('履約報告死線日期不可早於開工日 (D-Day)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const updated: MilestoneRule = {
        ...rule,
        title: title.trim(),
        dayOffset: finalOffset,
        owners: owners.length > 0 ? owners : ['專案負責人'],
        enabled,
        notes: notes.trim() || undefined,
      };

      await onSaveRule(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || '更新失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Autocomplete contacts
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(ownerInput.toLowerCase()) ||
      c.email.toLowerCase().includes(ownerInput.toLowerCase()) ||
      (c.department && c.department.toLowerCase().includes(ownerInput.toLowerCase()))
  );

  // Compute available team owners list for quick selection
  const getSelectableOwners = () => {
    if (activeProject.projectOwners && activeProject.projectOwners.length > 0) {
      return activeProject.projectOwners;
    }
    if (contacts && contacts.length > 0) {
      return contacts.map((c) => ({
        id: c.id,
        role: c.department || '團隊成員',
        name: c.name,
        email: c.email,
      }));
    }
    return [
      { id: 'po-1', role: 'PM (專案經理)', name: '張小明', email: 'alex.chang@company.com' },
      { id: 'po-2', role: '業務 (Sales)', name: '陳經理', email: 'sales.chen@company.com' },
      { id: 'po-3', role: 'SA (系統分析師)', name: '李大華', email: 'david.lee@company.com' },
      { id: 'po-4', role: 'QA (測試經理)', name: '陳美玲', email: 'meiling.chen@company.com' },
    ];
  };

  const selectableTeam = getSelectableOwners();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '640px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--surface-glass-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in"
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                background: 'var(--accent-gradient)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
              }}
            >
              <Edit3 size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>修改履約報告與死線日期</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                {activeProject.name} ({activeProject.code})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Report Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              履約報告名稱 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="input-glass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem 0.85rem', fontWeight: 600 }}
            />
          </div>

          {/* 2. Date Modification Mode */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              修改履約死線日期
            </label>

            {/* Mode Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setDateMode('date')}
                style={{
                  background: dateMode === 'date' ? 'rgba(79, 70, 229, 0.1)' : '#f8fafc',
                  border: dateMode === 'date' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  color: dateMode === 'date' ? '#4f46e5' : '#64748b',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Calendar size={16} /> 指定死線日期 (YYYY-MM-DD)
              </button>

              <button
                type="button"
                onClick={() => setDateMode('offset')}
                style={{
                  background: dateMode === 'offset' ? 'rgba(79, 70, 229, 0.1)' : '#f8fafc',
                  border: dateMode === 'offset' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  color: dateMode === 'offset' ? '#4f46e5' : '#64748b',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Clock size={16} /> 開工日相對天數 (D + N 天)
              </button>
            </div>

            {/* Inputs */}
            {dateMode === 'date' ? (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="date"
                    className="input-glass"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={{ flex: 1, fontWeight: 700 }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    自動反算開工日: <strong style={{ color: '#2563eb' }}>D + {getCalculatedOffset()} 天</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
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
                      value={dayOffset}
                      onChange={(e) => setDayOffset(Number(e.target.value))}
                      style={{ paddingLeft: '2.5rem', fontWeight: 700 }}
                    />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    計算目標日期: <strong style={{ color: '#2563eb' }}>{getOffsetPreviewDate()}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Responsible Owners Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              權責負責人 / 通知對象
            </label>

            {/* Quick Team Member Multi-Select Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 0.85rem',
              marginBottom: '0.75rem',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={15} color="#4f46e5" /> 專案負責人團隊名冊 (可單擊勾選多位成員):
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const allTeam = selectableTeam.map((po) => `[${po.role}] ${po.name} (${po.email})`);
                      setOwners(Array.from(new Set([...owners, ...allTeam])));
                    }}
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    + 全選團隊
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwners([])}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#64748b',
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    重置清空
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {selectableTeam.map((po) => {
                  const ownerStr = `[${po.role}] ${po.name} (${po.email})`;
                  const isSelected = owners.includes(ownerStr) || owners.some((o) => o.includes(po.email));

                  return (
                    <button
                      key={po.id || po.email}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setOwners(owners.filter((o) => !o.includes(po.email) && o !== ownerStr));
                        } else {
                          setOwners([...owners, ownerStr]);
                        }
                      }}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        border: isSelected ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                        background: isSelected ? '#e0e7ff' : '#ffffff',
                        color: isSelected ? '#3730a3' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        boxShadow: isSelected ? '0 1px 3px rgba(79, 70, 229, 0.2)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{
                        fontSize: '0.675rem',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '3px',
                        background: isSelected ? '#c7d2fe' : '#f1f5f9',
                        color: isSelected ? '#312e81' : '#475569',
                        fontWeight: 700,
                      }}>
                        {po.role}
                      </span>
                      {po.name}
                      {isSelected ? (
                        <span style={{ color: '#4338ca', fontWeight: 800, fontSize: '0.85rem' }}>✓</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.4rem',
                alignItems: 'center',
                background: '#ffffff',
                border: '1px solid rgba(203, 213, 225, 0.9)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.65rem',
                minHeight: '44px',
              }}>
                {owners.map((owner) => (
                  <span
                    key={owner}
                    style={{
                      background: '#e0e7ff',
                      border: '1px solid #c7d2fe',
                      color: '#3730a3',
                      fontWeight: 600,
                      fontSize: '0.775rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <User size={12} /> {owner}
                    <button
                      type="button"
                      onClick={() => handleRemoveOwner(owner)}
                      style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  placeholder={owners.length === 0 ? '搜尋 Outlook 通訊錄或輸入 Email...' : '+ 新增...'}
                  value={ownerInput}
                  onChange={(e) => setOwnerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && ownerInput.trim()) {
                      e.preventDefault();
                      handleAddOwner(ownerInput.trim());
                    }
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.85rem',
                    flex: 1,
                    minWidth: '140px',
                  }}
                />
              </div>

              {/* Autocomplete Dropdown */}
              {ownerInput.trim().length > 0 && (
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
                  maxHeight: '160px',
                  overflowY: 'auto',
                  marginTop: '0.2rem',
                }}>
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleAddOwner(`${c.name} (${c.email})`)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong>{c.name}</strong> <span style={{ color: '#64748b' }}>({c.department})</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.email}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                      按下 Enter 直接新增 「{ownerInput}」
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. Notes & Remarks */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              備註說明
            </label>
            <textarea
              rows={3}
              className="input-glass"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem 0.85rem', resize: 'vertical' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Check size={16} />
              <span>{isSubmitting ? '儲存中...' : '儲存變更'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
