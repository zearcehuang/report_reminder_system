import React, { useState, useEffect } from 'react';
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
import { Calendar, Layers, FileText, CheckCircle2, Clock, Sparkles, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [rules, setRules] = useState<MilestoneRule[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  // Modals visibility
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Document preview state
  const [extractResult, setExtractResult] = useState<DocumentExtractResult | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Loading indicator
  const [isLoading, setIsLoading] = useState(true);

  // Active view tab (All-in-one Dashboard vs Timeline focus)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'timeline'>('dashboard');

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setIsLoading(true);
    try {
      const projList = await api.getProjects();
      setProjects(projList);
      if (projList.length > 0) {
        const current = projList[0];
        setActiveProject(current);
        await loadProjectDetails(current.id);
      }
      const contactList = await api.getContacts();
      setContacts(contactList);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectDetails = async (projectId: string) => {
    const r = await api.getRules(projectId);
    setRules(r);
    const s = await api.getSchedules(projectId);
    setSchedules(s);
  };

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

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!activeProject) return;
    const updated = await api.updateProject(activeProject.id, updates);
    setActiveProject(updated);
    // Reload schedules because D-Day changed
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

  const handleToggleSubmitted = async (scheduleId: string, isCompleted: boolean) => {
    if (!activeProject) return;
    await api.markAsSubmitted(scheduleId, isCompleted);
    const s = await api.getSchedules(activeProject.id);
    setSchedules(s);
  };

  const handleDocumentExtractSuccess = (result: DocumentExtractResult) => {
    setExtractResult(result);
    setIsPreviewModalOpen(true);
  };

  const handleConfirmImportDocumentMilestones = async (selected: ExtractedMilestone[]) => {
    if (!activeProject) return;

    // Convert extracted milestones to rules
    const newRules: MilestoneRule[] = selected.map((m, idx) => ({
      id: `rule-${activeProject.id}-ext-${Date.now()}-${idx}`,
      projectId: activeProject.id,
      title: m.title,
      dayOffset: m.dayOffset,
      owners: m.owners,
      enabled: true,
    }));

    const combinedRules = [...rules, ...newRules];
    await handleSaveRules(combinedRules);
  };

  const handleHolidayOrContactUpdated = async () => {
    if (activeProject) {
      const s = await api.getSchedules(activeProject.id);
      setSchedules(s);
    }
    const c = await api.getContacts();
    setContacts(c);
  };

  if (isLoading || !activeProject) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles size={36} className="animate-spin" color="var(--accent-secondary)" style={{ margin: '0 auto 1rem' }} />
          <h2>載入專案履約報告繳交提醒系統中...</h2>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalMilestones = rules.filter(r => r.enabled).length;
  const submittedCount = schedules.filter(s => s.status === 'Submitted').length;
  const pendingCount = schedules.filter(s => s.status === 'Pending').length;
  const shiftedCount = schedules.filter(s => s.wasShiftedByHoliday).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <Navbar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenHolidayModal={() => setIsHolidayModalOpen(true)}
        onOpenContactModal={() => setIsContactModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        {/* Top Summary Banner Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              當前開工日 (D-DAY)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={22} color="var(--accent-secondary)" />
              {activeProject.dDay || '尚未指定'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              提前 <strong style={{ color: '#fbbf24' }}>{activeProject.advanceNoticeDays} 天</strong> 自動推播通知
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              已啟用履約報告數
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={22} color="#818cf8" />
              {totalMilestones} 項 Slots
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              預設 10 大里程碑規則已載入
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              繳交進度狀態
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={22} color="#10b981" />
              {submittedCount} / {schedules.length} 已完成
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              剩餘 <strong style={{ color: '#fbbf24' }}>{pendingCount} 項</strong> 待履約報告
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              DGPA 休假順延調整
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={22} color="#c084fc" />
              {shiftedCount} 項死線已順延
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              自動避開週休與政府辦公日曆
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: activeTab === 'dashboard' ? 'var(--accent-gradient)' : 'transparent',
              border: 'none',
              color: '#ffffff',
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
            }}
          >
            <Layers size={17} /> 完整管控儀表板
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            style={{
              background: activeTab === 'timeline' ? 'var(--accent-gradient)' : 'transparent',
              border: 'none',
              color: activeTab === 'timeline' ? '#ffffff' : 'var(--text-secondary)',
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
            }}
          >
            <Clock size={17} /> 履約死線時間軸 ({schedules.length})
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            style={{
              background: activeTab === 'rules' ? 'var(--accent-gradient)' : 'transparent',
              border: 'none',
              color: activeTab === 'rules' ? '#ffffff' : 'var(--text-secondary)',
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
            }}
          >
            <FileText size={17} /> 里程碑規則與負責人
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {/* D-Day Control */}
            <DDayControl
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              milestoneCount={totalMilestones}
            />

            {/* Document Uploader & Parser */}
            <DocumentUploader
              projectDDay={activeProject.dDay}
              onExtractSuccess={handleDocumentExtractSuccess}
            />

            {/* Schedule Timeline Section */}
            <ScheduleTimeline
              project={activeProject}
              schedules={schedules}
              onToggleSubmitted={handleToggleSubmitted}
              onRefreshSchedules={() => loadProjectDetails(activeProject.id)}
            />

            {/* Milestone Rule Manager Section */}
            <RuleManager
              projectId={activeProject.id}
              rules={rules}
              contacts={contacts}
              onSaveRules={handleSaveRules}
              projectDDay={activeProject.dDay}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="animate-fade-in">
            <DDayControl
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              milestoneCount={totalMilestones}
            />
            <ScheduleTimeline
              project={activeProject}
              schedules={schedules}
              onToggleSubmitted={handleToggleSubmitted}
              onRefreshSchedules={() => loadProjectDetails(activeProject.id)}
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
            />
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
        專案報告繳交提醒系統 © 2026 | Report Submission Reminder System | ASP.NET Core & Vite React Integration
      </footer>

      {/* Global Modals */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
      />

      <HolidayManagementModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        onHolidayUpdated={handleHolidayOrContactUpdated}
      />

      <ContactImportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onContactsUpdated={handleHolidayOrContactUpdated}
      />

      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        extractResult={extractResult}
        onConfirmImport={handleConfirmImportDocumentMilestones}
      />
    </div>
  );
};
