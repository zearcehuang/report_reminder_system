import React, { useState, useEffect, memo } from 'react';
import { MilestoneRule, Contact, Project } from '../types';
import { Layers, Plus, Check, FilePlus } from 'lucide-react';
import { RuleBatchToolbar } from './RuleManager/RuleBatchToolbar';
import { RuleItemRow } from './RuleManager/RuleItemRow';
import { useToast } from '../hooks/useToast';

interface Props {
  projectId: string;
  rules: MilestoneRule[];
  contacts: Contact[];
  onSaveRules: (rules: MilestoneRule[]) => Promise<void>;
  projectDDay: string;
  onDeleteRule?: (projectId: string, ruleId: string) => Promise<void>;
  onBatchDeleteRules?: (projectId: string, ruleIds: string[]) => Promise<void>;
  onOpenAddReportModal?: () => void;
  onEditRule?: (rule: MilestoneRule) => void;
  activeProject?: Project | null;
}

export const RuleManager: React.FC<Props> = memo(({
  projectId,
  rules,
  contacts,
  onSaveRules,
  projectDDay,
  onDeleteRule,
  onBatchDeleteRules,
  onOpenAddReportModal,
  onEditRule,
  activeProject,
}) => {
  const [localRules, setLocalRules] = useState<MilestoneRule[]>(rules);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const toast = useToast();

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

  const getSelectableOwners = () => {
    if (activeProject && activeProject.projectOwners && activeProject.projectOwners.length > 0) {
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

  const handleAddRule = () => {
    let defaultOwners = ['alex.chang@company.com'];

    if (activeProject && activeProject.projectOwners && activeProject.projectOwners.length > 0) {
      const pm = activeProject.projectOwners.find((po) => po.role.includes('PM') || po.role.includes('專案經理') || po.role.includes('負責人')) || activeProject.projectOwners[0];
      defaultOwners = [`[${pm.role}] ${pm.name} (${pm.email})`];
    } else if (activeProject && (activeProject.ownerEmail || activeProject.ownerName)) {
      const ownerStr = activeProject.ownerName
        ? `${activeProject.ownerName} (${activeProject.ownerEmail || ''})`
        : activeProject.ownerEmail!;
      defaultOwners = [ownerStr];
    } else if (contacts.length > 0) {
      defaultOwners = [`${contacts[0].name} (${contacts[0].email})`];
    }

    const newRule: MilestoneRule = {
      id: `temp-rule-${Date.now()}`,
      projectId,
      title: '自訂履約里程碑報告',
      dayOffset: 100,
      owners: defaultOwners,
      enabled: true,
    };
    setLocalRules([...localRules, newRule]);
    setHasChanges(true);
  };

  const handleRemoveRule = async (index: number) => {
    const targetRule = localRules[index];
    if (!targetRule) return;

    toast.confirm(
      '刪除履約規則',
      `確定要刪除規則「${targetRule.title}」嗎？`,
      async () => {
        try {
          const isServerRule = rules.some((r) => r.id === targetRule.id);
          if (onDeleteRule && targetRule.id && isServerRule) {
            await onDeleteRule(projectId, targetRule.id);
          }
          const next = localRules.filter((_, i) => i !== index);
          setLocalRules(next);
          setSelectedRuleIds((prev) => prev.filter((id) => id !== targetRule.id));
          setHasChanges(true);
          toast.success(`成功刪除規則：${targetRule.title}`);
        } catch (err: any) {
          toast.error(err.message || '刪除規則失敗');
        }
      }
    );
  };

  const handleBatchDeleteRules = async () => {
    if (selectedRuleIds.length === 0) return;
    toast.confirm(
      '批次刪除規則',
      `確定要刪除選取的 ${selectedRuleIds.length} 項履約規則嗎？`,
      async () => {
        try {
          const serverRuleIds = selectedRuleIds.filter((id) => rules.some((r) => r.id === id));
          if (onBatchDeleteRules && serverRuleIds.length > 0) {
            await onBatchDeleteRules(projectId, serverRuleIds);
          }
          const next = localRules.filter((r) => !selectedRuleIds.includes(r.id));
          setLocalRules(next);
          setSelectedRuleIds([]);
          setHasChanges(true);
          toast.success(`成功刪除 ${selectedRuleIds.length} 項規則`);
        } catch (err: any) {
          toast.error(err.message || '批次刪除規則失敗');
        }
      }
    );
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveRules(localRules);
      setHasChanges(false);
      toast.success('履約規則與負責人已成功儲存');
    } catch (err: any) {
      toast.error(err.message || '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

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
          {onOpenAddReportModal && (
            <button
              className="btn-primary"
              onClick={onOpenAddReportModal}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FilePlus size={16} /> 手動新增履約報告
            </button>
          )}
          <button className="btn-secondary" onClick={handleAddRule} style={{ fontSize: '0.85rem' }}>
            <Plus size={16} /> 快速新增空白列
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

      <RuleBatchToolbar
        totalRules={localRules.length}
        selectedCount={selectedRuleIds.length}
        onToggleSelectAll={toggleSelectAllRules}
        onBatchDelete={handleBatchDeleteRules}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {localRules.map((rule, idx) => (
          <RuleItemRow
            key={rule.id}
            rule={rule}
            idx={idx}
            isSelected={selectedRuleIds.includes(rule.id)}
            projectDDay={projectDDay}
            selectableTeam={selectableTeam}
            contacts={contacts}
            onToggleSelectRule={toggleSelectRule}
            onUpdateRule={handleUpdateRule}
            onRemoveRule={handleRemoveRule}
            onEditRule={onEditRule}
          />
        ))}
      </div>
    </div>
  );
});
