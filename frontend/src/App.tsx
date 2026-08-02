import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, MilestoneRule, ScheduleItem, Contact, DocumentExtractResult, ExtractedMilestone } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { DDayControl } from './components/DDayControl';
import { RuleManager } from './components/RuleManager';
import { DocumentUploader } from './components/DocumentUploader';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { ScheduleTimeline } from './components/ScheduleTimeline';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { HolidayManagementModal } from './components/HolidayManagementModal';
import { ContactImportModal } from './components/ContactImportModal';
import { ErrorLogModal } from './components/ErrorLogModal';
import { AddReportModal } from './components/AddReportModal';
import { EditReportModal } from './components/EditReportModal';
import { SchedulerLogModal } from './components/SchedulerLogModal';
import { UserAuthModal } from './components/UserAuthModal';
import { UserPermissionModal } from './components/UserPermissionModal';
import { UserSession } from './types';
import { useAppModals } from './hooks/useModals';
import { Calendar, Layers, FileText, CheckCircle2, Clock, Sparkles, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [rules, setRules] = useState<MilestoneRule[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession>(api.getAuthSession());
  
  // Custom hook for managing all modal states
  const modals = useAppModals();
  const [editingRule, setEditingRule] = useState<MilestoneRule | null>(null);
  const [extractResult, setExtractResult] = useState<DocumentExtractResult | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'timeline'>('dashboard');

  useEffect(() => {
    initData();
  }, []);

  const initData = useCallback(async () => {
    setIsLoading(true);
    try {
      const projList = await api.getProjects();
      setProjects(projList);
      if (projList.length > 0) {
        const current = projList[0];
        setActiveProject(current);
        await loadProjectDetails(current.id);
      } else {
        setActiveProject(null);
        setRules([]);
        setSchedules([]);
      }
      const contactList = await api.getContacts();
      setContacts(contactList);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProjectDetails = useCallback(async (projectId: string) => {
    const r = await api.getRules(projectId);
    setRules(r);
    const s = await api.getSchedules(projectId);
    setSchedules(s);
  }, []);

  const handleSelectProject = async (project: Project) => {
    setActiveProject(project);
    await loadProjectDetails(project.id);
  };

  const handleCreateProject = async (projData: Partial<Project>) => {
    const created = await api.createProject(projData);
    const updatedList = await api.getProjects();
    setProjects(updatedList);
    setActiveProject(created);
    await loadProjectDetails(created.id);
  };

  const handleDeleteProject = async (projectId: string) => {
    await api.deleteProject(projectId);
    const updatedList = await api.getProjects();
    setProjects(updatedList);
    if (activeProject && activeProject.id === projectId) {
      if (updatedList.length > 0) {
        setActiveProject(updatedList[0]);
        await loadProjectDetails(updatedList[0].id);
      } else {
        setActiveProject(null);
        setRules([]);
        setSchedules([]);
      }
    }
  };

  const handleBatchDeleteProjects = async (projectIds: string[]) => {
    await api.batchDeleteProjects(projectIds);
    const updatedList = await api.getProjects();
    setProjects(updatedList);
    if (activeProject && projectIds.includes(activeProject.id)) {
      if (updatedList.length > 0) {
        setActiveProject(updatedList[0]);
        await loadProjectDetails(updatedList[0].id);
      } else {
        setActiveProject(null);
        setRules([]);
        setSchedules([]);
      }
    }
  };

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!activeProject) return;
    const updated = await api.updateProject(activeProject.id, updates);
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    const s = await api.getSchedules(updated.id);
    setSchedules(s);
  };

  const handleSaveRules = async (updatedRules: MilestoneRule[]) => {
    if (!activeProject) return;
    const saved = await api.saveRules(activeProject.id, updatedRules);
    setRules(saved);
    const s = await api.getSchedules(activeProject.id);
    setSchedules(s);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!activeProject) return;
    await api.deleteRule(activeProject.id, scheduleId);
    await loadProjectDetails(activeProject.id);
  };

  const handleBatchDeleteSchedules = async (scheduleIds: string[]) => {
    if (!activeProject) return;
    await api.batchDeleteRules(activeProject.id, scheduleIds);
    await loadProjectDetails(activeProject.id);
  };

  const handleDeleteRule = async (projectId: string, ruleId: string) => {
    await api.deleteRule(projectId, ruleId);
    await loadProjectDetails(projectId);
  };

  const handleBatchDeleteRules = async (projectId: string, ruleIds: string[]) => {
    await api.batchDeleteRules(projectId, ruleIds);
    await loadProjectDetails(projectId);
  };

  const handleToggleSubmitted = async (scheduleId: string, isCompleted: boolean) => {
    if (!activeProject) return;
    await api.markAsSubmitted(scheduleId, isCompleted);
    const s = await api.getSchedules(activeProject.id);
    setSchedules(s);
  };

  const handleDocumentExtractSuccess = (result: DocumentExtractResult) => {
    setExtractResult(result);
    modals.documentPreview.open();
  };

  const handleConfirmImportDocumentMilestones = async (selected: ExtractedMilestone[]) => {
    if (!activeProject) return;

    const newRules: MilestoneRule[] = selected.map((m, idx) => ({
      id: `rule-${activeProject.id}-ext-${Date.now()}-${idx}`,
      projectId: activeProject.id,
      title: m.title,
      dayOffset: m.dayOffset,
      owners: m.owners && m.owners.length > 0 ? m.owners : ['張小明 (PM)'],
      enabled: true,
    }));

    await handleSaveRules(newRules);
  };

  const handleAddReport = async (newRule: MilestoneRule) => {
    if (!activeProject) return;
    const updated = [...rules, newRule];
    await handleSaveRules(updated);
  };

  const handleEditRule = (rule: MilestoneRule) => {
    setEditingRule(rule);
    modals.editReport.open();
  };

  const handleEditScheduleDate = (scheduleItem: ScheduleItem) => {
    const matchedRule = rules.find(r => r.id === scheduleItem.ruleId || r.id === scheduleItem.id);
    if (matchedRule) {
      setEditingRule(matchedRule);
    } else {
      setEditingRule({
        id: scheduleItem.ruleId || scheduleItem.id,
        projectId: scheduleItem.projectId || activeProject?.id || '',
        title: scheduleItem.title,
        dayOffset: scheduleItem.dDayOffset,
        owners: scheduleItem.owners || [],
        enabled: true,
      });
    }
    modals.editReport.open();
  };

  const handleSaveEditedRule = async (updatedRule: MilestoneRule) => {
    if (!activeProject) return;
    const existingIdx = rules.findIndex(r => r.id === updatedRule.id);
    let nextRules: MilestoneRule[];
    if (existingIdx !== -1) {
      nextRules = [...rules];
      nextRules[existingIdx] = updatedRule;
    } else {
      nextRules = [...rules, updatedRule];
    }
    await handleSaveRules(nextRules);
    modals.editReport.close();
    setEditingRule(null);
  };

  const handleHolidayOrContactUpdated = async () => {
    if (activeProject) {
      const s = await api.getSchedules(activeProject.id);
      setSchedules(s);
    }
    const c = await api.getContacts();
    setContacts(c);
  };

  const { totalMilestones, submittedCount, pendingCount, shiftedCount } = useMemo(() => ({
    totalMilestones: rules.filter(r => r.enabled).length,
    submittedCount: schedules.filter(s => s.status === 'Submitted').length,
    pendingCount: schedules.filter(s => s.status === 'Pending').length,
    shiftedCount: schedules.filter(s => s.wasShiftedByHoliday).length,
  }), [rules, schedules]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles size={36} className="animate-spin" color="var(--accent-secondary)" style={{ margin: '0 auto 1rem' }} />
          <h2>載入專案履約報告繳交提醒系統中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <Navbar
        projects={projects}
        activeProject={activeProject || { id: '', code: 'PRJ-NONE', name: '尚無專案', dDay: '', advanceNoticeDays: 3, status: 'active', updatedAt: '' }}
        currentUser={currentUser}
        onSelectProject={handleSelectProject}
        onOpenProjectManager={modals.projectManager.open}
        onOpenHolidayModal={modals.holiday.open}
        onOpenContactModal={modals.contact.open}
        onOpenErrorLogModal={modals.errorLog.open}
        onOpenAddReportModal={modals.addReport.open}
        onOpenSchedulerLogModal={modals.schedulerLog.open}
        onOpenUserAuthModal={modals.userAuth.open}
        onOpenUserPermissionModal={modals.userPermission.open}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        {activeProject ? (
          <>
            {/* Top Summary Banner Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
              <div className="glass-card stat-card">
                <div className="stat-card-label">
                  當前開工日 (D-DAY)
                </div>
                <div className="stat-card-value">
                  <Calendar size={22} color="var(--accent-secondary)" />
                  {activeProject.dDay || '尚未指定'}
                </div>
                <div className="stat-card-sublabel">
                  提前 <strong style={{ color: '#fbbf24' }}>{activeProject.advanceNoticeDays} 天</strong> 自動推播通知
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-card-label">
                  已啟用履約報告數
                </div>
                <div className="stat-card-value">
                  <Layers size={22} color="#818cf8" />
                  {totalMilestones} 項 Slots
                </div>
                <div className="stat-card-sublabel">
                  標準里程碑規則已載入
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-card-label">
                  繳交進度狀態
                </div>
                <div className="stat-card-value" style={{ color: '#34d399' }}>
                  <CheckCircle2 size={22} color="#10b981" />
                  {submittedCount} / {schedules.length} 已完成
                </div>
                <div className="stat-card-sublabel">
                  剩餘 <strong style={{ color: '#fbbf24' }}>{pendingCount} 項</strong> 待履約報告
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-card-label">
                  DGPA 休假順延調整
                </div>
                <div className="stat-card-value" style={{ color: '#c084fc' }}>
                  <Sparkles size={22} color="#c084fc" />
                  {shiftedCount} 項死線已順延
                </div>
                <div className="stat-card-sublabel">
                  自動避開週休與政府辦公日曆
                </div>
              </div>
            </div>

            {/* View Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              >
                <Layers size={17} /> 完整管控儀表板
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              >
                <Clock size={17} /> 履約死線時間軸 ({schedules.length})
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
              >
                <FileText size={17} /> 里程碑規則與負責人
              </button>
            </div>

            {/* Tab contents */}
            {activeTab === 'dashboard' && (
              <div className="animate-fade-in">
                <DDayControl
                  project={activeProject}
                  onUpdateProject={handleUpdateProject}
                  milestoneCount={totalMilestones}
                  contacts={contacts}
                />

                <DocumentUploader
                  projectDDay={activeProject.dDay}
                  onExtractSuccess={handleDocumentExtractSuccess}
                />

                <ScheduleTimeline
                  project={activeProject}
                  schedules={schedules}
                  onToggleSubmitted={handleToggleSubmitted}
                  onRefreshSchedules={() => loadProjectDetails(activeProject.id)}
                  onDeleteSchedule={handleDeleteSchedule}
                  onBatchDeleteSchedules={handleBatchDeleteSchedules}
                  onOpenAddReportModal={modals.addReport.open}
                  onEditScheduleDate={handleEditScheduleDate}
                />

                <RuleManager
                  projectId={activeProject.id}
                  rules={rules}
                  contacts={contacts}
                  onSaveRules={handleSaveRules}
                  projectDDay={activeProject.dDay}
                  onDeleteRule={handleDeleteRule}
                  onBatchDeleteRules={handleBatchDeleteRules}
                  onOpenAddReportModal={modals.addReport.open}
                  onEditRule={handleEditRule}
                  activeProject={activeProject}
                />
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="animate-fade-in">
                <DDayControl
                  project={activeProject}
                  onUpdateProject={handleUpdateProject}
                  milestoneCount={totalMilestones}
                  contacts={contacts}
                />
                <ScheduleTimeline
                  project={activeProject}
                  schedules={schedules}
                  onToggleSubmitted={handleToggleSubmitted}
                  onRefreshSchedules={() => loadProjectDetails(activeProject.id)}
                  onDeleteSchedule={handleDeleteSchedule}
                  onBatchDeleteSchedules={handleBatchDeleteSchedules}
                  onOpenAddReportModal={modals.addReport.open}
                  onEditScheduleDate={handleEditScheduleDate}
                />
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="animate-fade-in">
                <RuleManager
                  projectId={activeProject.id}
                  rules={rules}
                  contacts={contacts}
                  onSaveRules={handleSaveRules}
                  projectDDay={activeProject.dDay}
                  onDeleteRule={handleDeleteRule}
                  onBatchDeleteRules={handleBatchDeleteRules}
                  onOpenAddReportModal={modals.addReport.open}
                  onEditRule={handleEditRule}
                  activeProject={activeProject}
                />
              </div>
            )}
          </>
        ) : (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', marginTop: '2rem' }}>
            <AlertCircle size={48} color="var(--accent-secondary)" style={{ margin: '0 auto 1rem' }} />
            <h2>目前尚無可用的專案</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              請開啟專案管理中心點擊「新建專案」以開始管理履約報告提醒。
            </p>
            <button className="btn-primary" onClick={modals.projectManager.open}>
              開啟專案管理中心
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--surface-glass-border)',
        padding: '1.25rem 2rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(9, 13, 22, 0.8)',
      }}>
        專案報告繳交提醒系統 © 2026 | Report Submission Reminder System
      </footer>

      {/* Global Modals */}
      <ProjectManagerModal
        isOpen={modals.projectManager.isOpen}
        onClose={modals.projectManager.close}
        projects={projects}
        activeProject={activeProject || { id: '', code: '', name: '', dDay: '', advanceNoticeDays: 3, status: 'active', updatedAt: '' }}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onBatchDeleteProjects={handleBatchDeleteProjects}
      />

      <HolidayManagementModal
        isOpen={modals.holiday.isOpen}
        onClose={modals.holiday.close}
        onHolidayUpdated={handleHolidayOrContactUpdated}
      />

      <ContactImportModal
        isOpen={modals.contact.isOpen}
        onClose={modals.contact.close}
        onContactsUpdated={handleHolidayOrContactUpdated}
      />

      <DocumentPreviewModal
        isOpen={modals.documentPreview.isOpen}
        onClose={modals.documentPreview.close}
        extractResult={extractResult}
        onConfirmImport={handleConfirmImportDocumentMilestones}
      />

      <ErrorLogModal
        isOpen={modals.errorLog.isOpen}
        onClose={modals.errorLog.close}
      />

      <AddReportModal
        isOpen={modals.addReport.isOpen}
        onClose={modals.addReport.close}
        activeProject={activeProject}
        contacts={contacts}
        onAddReport={handleAddReport}
      />

      <EditReportModal
        isOpen={modals.editReport.isOpen}
        onClose={() => {
          modals.editReport.close();
          setEditingRule(null);
        }}
        activeProject={activeProject}
        rule={editingRule}
        contacts={contacts}
        onSaveRule={handleSaveEditedRule}
      />

      <SchedulerLogModal
        isOpen={modals.schedulerLog.isOpen}
        onClose={modals.schedulerLog.close}
      />

      <UserAuthModal
        isOpen={modals.userAuth.isOpen}
        onClose={modals.userAuth.close}
        currentUser={currentUser}
        onUserLoginSuccess={(u) => setCurrentUser(u)}
      />

      <UserPermissionModal
        isOpen={modals.userPermission.isOpen}
        onClose={modals.userPermission.close}
        currentUser={currentUser}
      />
    </div>
  );
};
