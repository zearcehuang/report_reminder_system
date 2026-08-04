import React, { useState, useEffect } from 'react';
import { MilestoneRule, Contact, Project } from '../types';
import { FilePlus, X, Check, AlertCircle } from 'lucide-react';
import { RuleOwnerSelector } from './RuleManager/RuleOwnerSelector';
import { useReportDateOffset } from '../hooks/useReportDateOffset';
import { ReportDateSection } from './EditReportModal/ReportDateSection';
import { QuickTitleSuggestions } from './AddReportModal/QuickTitleSuggestions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  contacts: Contact[];
  onAddReport: (newRule: MilestoneRule) => Promise<void>;
}

export const AddReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeProject,
  contacts,
  onAddReport,
}) => {
  const [title, setTitle] = useState('');
  const [owners, setOwners] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    dateMode,
    setDateMode,
    dayOffset,
    setDayOffset,
    targetDate,
    setTargetDate,
    getOffsetPreviewDate,
    getCalculatedOffset,
  } = useReportDateOffset({ activeProject, rule: null, isOpen });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setNotes('');
      setErrorMsg('');

      // Default owners
      if (activeProject && activeProject.projectOwners && activeProject.projectOwners.length > 0) {
        const pm = activeProject.projectOwners.find((po) => po.role.includes('PM') || po.role.includes('專案經理') || po.role.includes('負責人')) || activeProject.projectOwners[0];
        setOwners([`[${pm.role}] ${pm.name} (${pm.email})`]);
      } else if (activeProject && (activeProject.ownerEmail || activeProject.ownerName)) {
        setOwners([activeProject.ownerName ? `${activeProject.ownerName} (${activeProject.ownerEmail || ''})` : activeProject.ownerEmail!]);
      } else if (contacts.length > 0) {
        setOwners([`${contacts[0].name} (${contacts[0].email})`]);
      } else {
        setOwners(['pm.alex@company.com']);
      }
    }
  }, [isOpen, activeProject, contacts]);

  if (!isOpen || !activeProject) return null;

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '新增報告失敗，請稍後重試';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectableOwners = () => {
    if (activeProject.projectOwners && activeProject.projectOwners.length > 0) {
      return activeProject.projectOwners;
    }
    if (contacts && contacts.length > 0) {
      return contacts.map((c) => ({ id: c.id, role: c.department || '團隊成員', name: c.name, email: c.email }));
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
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
        background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff', borderRadius: 'var(--radius-lg)', width: '100%',
          maxWidth: '640px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--surface-glass-border)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in"
      >
        <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
              <FilePlus size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>手動新增專案履約報告</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>專案: {activeProject.name} ({activeProject.code})</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem', borderRadius: 'var(--radius-sm)', display: 'flex', transition: 'all 0.2s ease' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              履約報告標題 / 里程碑名稱 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input type="text" className="input-glass" placeholder="例如：期中進度報告 (Midterm Report)" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem 0.85rem' }} />
            <QuickTitleSuggestions currentTitle={title} onSelectTitle={setTitle} />
          </div>

          <ReportDateSection
            dateMode={dateMode}
            setDateMode={setDateMode}
            dayOffset={dayOffset}
            setDayOffset={setDayOffset}
            targetDate={targetDate}
            setTargetDate={setTargetDate}
            getOffsetPreviewDate={getOffsetPreviewDate}
            getCalculatedOffset={getCalculatedOffset}
          />

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              權責負責人 / 通知對象 (下拉可多選 & 搜尋比對)
            </label>
            <RuleOwnerSelector ruleOwners={owners} selectableTeam={selectableTeam} contacts={contacts} onUpdateOwners={setOwners} />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              履約報告內容規範與備註說明 (選填)
            </label>
            <textarea rows={3} className="input-glass" placeholder="例如：需包含系統測試涵蓋率報告、教育訓練簽到表及資安掃描清冊..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem 0.85rem', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>取消</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} /> <span>{isSubmitting ? '新增中...' : '確認新增履約報告'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
