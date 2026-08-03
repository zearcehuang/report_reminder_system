import React, { useState, useCallback } from 'react';
import { MilestoneRule, DocumentExtractResult, ExtractedMilestone, ScheduleItem } from './types';
import { Navbar } from './components/Navbar';
import { DDayControl } from './components/DDayControl';
import { RuleManager } from './components/RuleManager';
import { DocumentUploader } from './components/DocumentUploader';
import { ScheduleTimeline } from './components/ScheduleTimeline';
import { useAppModals } from './hooks/useModals';
import { Sparkles, AlertCircle, Layers, Clock, FileText } from 'lucide-react';
import { useAppData } from './hooks/useAppData';
import { DashboardSummary } from './components/DashboardSummary';

const GlobalModalContainer = React.lazy(() => import('./components/GlobalModalContainer').then(module => ({ default: module.GlobalModalContainer })));
export const App: React.FC = () => {
  const appData = useAppData();
  const modals = useAppModals();
  const [editingRule, setEditingRule] = useState<MilestoneRule | null>(null);
  const [extractResult, setExtractResult] = useState<DocumentExtractResult | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'timeline'>('dashboard');

  const handleDocumentExtractSuccess = useCallback((result: DocumentExtractResult) => {
    setExtractResult(result);
    modals.documentPreview.open();
  }, [modals.documentPreview]);

  const handleConfirmImportDocumentMilestones = useCallback(async (selected: ExtractedMilestone[]) => {
    if (!appData.activeProject) return;
    const project = appData.activeProject;
    
    // Default owner: ONLY Project Manager / PM (專案負責人), not all outlook contacts
    let pmOwnerStr = '張小明 (PM)';
    if (project.projectOwners && project.projectOwners.length > 0) {
      const pm = project.projectOwners.find((po) => po.role.includes('PM') || po.role.includes('專案經理') || po.role.includes('負責人')) || project.projectOwners[0];
      pmOwnerStr = `[${pm.role}] ${pm.name} (${pm.email})`;
    } else if (project.ownerName || project.ownerEmail) {
      pmOwnerStr = project.ownerName
        ? `${project.ownerName} (${project.ownerEmail || ''})`
        : project.ownerEmail!;
    }

    const newRules: MilestoneRule[] = selected.map((m, idx) => ({
      id: `rule-${project.id}-ext-${Date.now()}-${idx}`,
      projectId: project.id,
      title: m.title,
      dayOffset: m.dayOffset,
      owners: [pmOwnerStr],
      enabled: true,
    }));
    await appData.handleSaveRules(newRules);
  }, [appData.activeProject, appData.handleSaveRules]);

  const handleAddReport = useCallback(async (newRule: MilestoneRule) => {
    if (!appData.activeProject) return;
    const updated = [...appData.rules, newRule];
    await appData.handleSaveRules(updated);
  }, [appData.activeProject, appData.rules, appData.handleSaveRules]);

  const handleEditRule = useCallback((rule: MilestoneRule) => {
    setEditingRule(rule);
    modals.editReport.open();
  }, [modals.editReport]);

  const handleEditScheduleDate = useCallback((scheduleItem: ScheduleItem) => {
    const matchedRule = appData.rules.find(r => r.id === scheduleItem.ruleId || r.id === scheduleItem.id);
    if (matchedRule) {
      setEditingRule(matchedRule);
    } else {
      setEditingRule({
        id: scheduleItem.ruleId || scheduleItem.id,
        projectId: scheduleItem.projectId || appData.activeProject?.id || '',
        title: scheduleItem.title,
        dayOffset: scheduleItem.dDayOffset,
        owners: scheduleItem.owners || [],
        enabled: true,
      });
    }
    modals.editReport.open();
  }, [appData.rules, appData.activeProject?.id, modals.editReport]);

  const handleSaveEditedRule = useCallback(async (updatedRule: MilestoneRule) => {
    if (!appData.activeProject) return;
    const existingIdx = appData.rules.findIndex(r => r.id === updatedRule.id);
    let nextRules: MilestoneRule[];
    if (existingIdx !== -1) {
      nextRules = [...appData.rules];
      nextRules[existingIdx] = updatedRule;
    } else {
      nextRules = [...appData.rules, updatedRule];
    }
    await appData.handleSaveRules(nextRules);
    modals.editReport.close();
    setEditingRule(null);
  }, [appData.activeProject, appData.rules, appData.handleSaveRules, modals.editReport]);

  if (appData.isLoading) {
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
      <Navbar
        projects={appData.projects}
        activeProject={appData.activeProject || { id: '', code: 'PRJ-NONE', name: '尚無專案', dDay: '', advanceNoticeDays: 3, status: 'active', updatedAt: '' }}
        currentUser={appData.currentUser}
        onSelectProject={appData.handleSelectProject}
        onOpenProjectManager={modals.projectManager.open}
        onOpenHolidayModal={modals.holiday.open}
        onOpenContactModal={modals.contact.open}
        onOpenErrorLogModal={modals.errorLog.open}
        onOpenAddReportModal={modals.addReport.open}
        onOpenSchedulerLogModal={modals.schedulerLog.open}
        onOpenUserAuthModal={modals.userAuth.open}
        onOpenUserPermissionModal={modals.userPermission.open}
      />

      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        {appData.activeProject ? (
          <>
            <DashboardSummary
              activeProject={appData.activeProject}
              totalMilestones={appData.stats.totalMilestones}
              submittedCount={appData.stats.submittedCount}
              pendingCount={appData.stats.pendingCount}
              shiftedCount={appData.stats.shiftedCount}
            />

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
                <Clock size={17} /> 履約死線時間軸 ({appData.schedules.length})
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
              >
                <FileText size={17} /> 里程碑規則與負責人
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <div className="animate-fade-in">
                <DDayControl
                  project={appData.activeProject}
                  onUpdateProject={appData.handleUpdateProject}
                  milestoneCount={appData.stats.totalMilestones}
                  contacts={appData.contacts}
                />
                <DocumentUploader
                  projectDDay={appData.activeProject.dDay}
                  onExtractSuccess={handleDocumentExtractSuccess}
                />
                <ScheduleTimeline
                  project={appData.activeProject}
                  schedules={appData.schedules}
                  onToggleSubmitted={appData.handleToggleSubmitted}
                  onRefreshSchedules={() => appData.loadProjectDetails(appData.activeProject!.id)}
                  onDeleteSchedule={appData.handleDeleteSchedule}
                  onBatchDeleteSchedules={appData.handleBatchDeleteSchedules}
                  onOpenAddReportModal={modals.addReport.open}
                  onEditScheduleDate={handleEditScheduleDate}
                />
                <RuleManager
                  projectId={appData.activeProject.id}
                  rules={appData.rules}
                  contacts={appData.contacts}
                  onSaveRules={appData.handleSaveRules}
                  projectDDay={appData.activeProject.dDay}
                  onDeleteRule={appData.handleDeleteRule}
                  onBatchDeleteRules={appData.handleBatchDeleteRules}
                  onOpenAddReportModal={modals.addReport.open}
                  onEditRule={handleEditRule}
                  activeProject={appData.activeProject}
                />
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="animate-fade-in">
                <DDayControl
                  project={appData.activeProject}
                  onUpdateProject={appData.handleUpdateProject}
                  milestoneCount={appData.stats.totalMilestones}
                  contacts={appData.contacts}
                />
                <ScheduleTimeline
                  project={appData.activeProject}
                  schedules={appData.schedules}
                  onToggleSubmitted={appData.handleToggleSubmitted}
                  onRefreshSchedules={() => appData.loadProjectDetails(appData.activeProject!.id)}
                  onDeleteSchedule={appData.handleDeleteSchedule}
                  onBatchDeleteSchedules={appData.handleBatchDeleteSchedules}
                  onOpenAddReportModal={modals.addReport.open}
                  onEditScheduleDate={handleEditScheduleDate}
                />
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="animate-fade-in">
                <RuleManager
                  projectId={appData.activeProject.id}
                  rules={appData.rules}
                  contacts={appData.contacts}
                  onSaveRules={appData.handleSaveRules}
                  projectDDay={appData.activeProject.dDay}
                  onDeleteRule={appData.handleDeleteRule}
                  onBatchDeleteRules={appData.handleBatchDeleteRules}
                  onOpenAddReportModal={modals.addReport.open}
                  onEditRule={handleEditRule}
                  activeProject={appData.activeProject}
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

      <React.Suspense fallback={null}>
        <GlobalModalContainer
          modals={modals}
          projects={appData.projects}
          activeProject={appData.activeProject}
          contacts={appData.contacts}
          currentUser={appData.currentUser}
          extractResult={extractResult}
          editingRule={editingRule}
          setEditingRule={setEditingRule}
          setCurrentUser={appData.setCurrentUser}
          handleSelectProject={appData.handleSelectProject}
          handleCreateProject={appData.handleCreateProject}
          handleDeleteProject={appData.handleDeleteProject}
          handleBatchDeleteProjects={appData.handleBatchDeleteProjects}
          handleHolidayOrContactUpdated={appData.handleHolidayOrContactUpdated}
          handleConfirmImportDocumentMilestones={handleConfirmImportDocumentMilestones}
          handleAddReport={handleAddReport}
          handleSaveEditedRule={handleSaveEditedRule}
        />
      </React.Suspense>
    </div>
  );
};
