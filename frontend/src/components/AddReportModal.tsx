import React, { useState, useEffect } from 'react';
import { MilestoneRule, Contact, Project } from '../types';
import { FilePlus, X, Calendar, Clock, User, Plus, Sparkles, AlertCircle, FileText, Check, Users, CheckSquare } from 'lucide-react';
import { RuleOwnerSelector } from './RuleManager/RuleOwnerSelector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  contacts: Contact[];
  onAddReport: (newRule: MilestoneRule) => Promise<void>;
}

const QUICK_TITLE_SUGGESTIONS = [
  '專案執行計畫書 (PEP)',
  '需求規格確認書 (SRS)',
  '期中進度報告 Draft',
  '期中進度報告 Final',
  '期末成果報告',
  '資安弱點掃描與滲透測試報告',
  '系統開發與單元測試報告',
  '教育訓練與使用者手冊',
  '驗收與結案報告',
];

export const AddReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeProject,
  contacts,
  onAddReport,
}) => {
  const [title, setTitle] = useState('');
  const [dateMode, setDateMode] = useState<'offset' | 'date'>('offset');
  const [dayOffset, setDayOffset] = useState<number>(30);
  const [targetDate, setTargetDate] = useState<string>('');
  const [owners, setOwners] = useState<string[]>([]);
  const [ownerInput, setOwnerInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDateMode('offset');
      setDayOffset(30);
      setNotes('');
      setErrorMsg('');

      // Default owners: ONLY Project Manager / PM (專案負責人), not all outlook contacts/team members
      if (activeProject && activeProject.projectOwners && activeProject.projectOwners.length > 0) {
        const pm = activeProject.projectOwners.find((po) => po.role.includes('PM') || po.role.includes('專案經理') || po.role.includes('負責人')) || activeProject.projectOwners[0];
        const pmStr = `[${pm.role}] ${pm.name} (${pm.email})`;
        setOwners([pmStr]);
      } else if (activeProject && (activeProject.ownerEmail || activeProject.ownerName)) {
        const ownerStr = activeProject.ownerName
          ? `${activeProject.ownerName} (${activeProject.ownerEmail || ''})`
          : activeProject.ownerEmail!;
        setOwners([ownerStr]);
      } else if (contacts.length > 0) {
        setOwners([`${contacts[0].name} (${contacts[0].email})`]);
      } else {
        setOwners(['pm.alex@company.com']);
      }

      // Default target date based on project D-Day
      if (activeProject && activeProject.dDay) {
        const d = new Date(activeProject.dDay);
        d.setDate(d.getDate() + 30);
        setTargetDate(d.toISOString().split('T')[0]);
      } else {
        const today = new Date();
        today.setDate(today.getDate() + 30);
        setTargetDate(today.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, activeProject, contacts]);

  if (!isOpen || !activeProject) return null;

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
      const newRule: MilestoneRule = {
        id: `rule-${activeProject.id}-manual-${Date.now()}`,
        projectId: activeProject.id,
        title: title.trim(),
        dayOffset: finalOffset,
        owners: owners.length > 0 ? owners : ['專案負責人'],
        enabled: true,
        notes: notes.trim() || undefined,
      };

      await onAddReport(newRule);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || '新增報告失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Autocomplete suggestions for owner search across contacts & team members
  const getFilteredSuggestions = () => {
    if (!ownerInput.trim()) return [];
    const query = ownerInput.toLowerCase();
    const suggestions: { id: string; name: string; email: string; department: string; formatted: string }[] = [];
    const seenEmails = new Set<string>();

    if (activeProject && activeProject.projectOwners) {
      activeProject.projectOwners.forEach((po) => {
        if (!seenEmails.has(po.email.toLowerCase())) {
          seenEmails.add(po.email.toLowerCase());
          if (
            po.name.toLowerCase().includes(query) ||
            po.email.toLowerCase().includes(query) ||
            po.role.toLowerCase().includes(query)
          ) {
            suggestions.push({
              id: po.id || po.email,
              name: po.name,
              email: po.email,
              department: `團隊 ${po.role}`,
              formatted: `[${po.role}] ${po.name} (${po.email})`,
            });
          }
        }
      });
    }

    if (contacts) {
      contacts.forEach((c) => {
        if (!seenEmails.has(c.email.toLowerCase())) {
          seenEmails.add(c.email.toLowerCase());
          if (
            c.name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            (c.department && c.department.toLowerCase().includes(query))
          ) {
            suggestions.push({
              id: c.id,
              name: c.name,
              email: c.email,
              department: c.department || '通訊錄',
              formatted: `${c.name} (${c.email})`,
            });
          }
        }
      });
    }

    return suggestions;
  };

  const filteredSuggestions = getFilteredSuggestions();

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
              <FilePlus size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>手動新增專案履約報告</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                專案: {activeProject.name} ({activeProject.code})
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
              transition: 'all 0.2s ease',
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
              履約報告標題 / 里程碑名稱 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="input-glass"
              placeholder="例如：期中進度報告 (Midterm Report)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem 0.85rem' }}
            />

            {/* Quick suggestions */}
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', alignSelf: 'center', marginRight: '0.2rem' }}>快速帶入:</span>
              {QUICK_TITLE_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTitle(item)}
                  style={{
                    background: title === item ? 'rgba(79, 70, 229, 0.12)' : '#f1f5f9',
                    border: title === item ? '1px solid #818cf8' : '1px solid #e2e8f0',
                    color: title === item ? '#4f46e5' : '#475569',
                    fontSize: '0.725rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Deadline Calculation Mode */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              履約死線設定方式
            </label>

            {/* Radio / Tab Toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
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
                <Calendar size={16} /> 指定具體死線日期
              </button>
            </div>

            {/* Option Input Fields */}
            {dateMode === 'offset' ? (
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
                    預估死線日期: <strong style={{ color: '#2563eb' }}>{getOffsetPreviewDate()}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="date"
                    className="input-glass"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={{ flex: 1, fontWeight: 600 }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    相當於開工日: <strong style={{ color: '#2563eb' }}>D + {getCalculatedOffset()} 天</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Responsible Owners Input (Searchable Multi-Select Dropdown) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              權責負責人 / 通知對象 (下拉可多選 & 搜尋比對)
            </label>
            <RuleOwnerSelector
              ruleOwners={owners}
              selectableTeam={selectableTeam}
              contacts={contacts}
              onUpdateOwners={(newOwners) => setOwners(newOwners)}
              placeholder="+ 搜尋團隊角色/姓名/Email 或下拉多選..."
            />
          </div>

          {/* 4. Notes & Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              履約報告內容規範與備註說明 (選填)
            </label>
            <textarea
              rows={3}
              className="input-glass"
              placeholder="例如：需包含系統測試涵蓋率報告、教育訓練簽到表及資安掃描清冊..."
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
              <span>{isSubmitting ? '新增中...' : '確認新增履約報告'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
