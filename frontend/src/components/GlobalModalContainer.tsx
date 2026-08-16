import React, { Suspense, lazy } from 'react';
import { Project, MilestoneRule, Contact, UserSession, DocumentExtractResult, ExtractedMilestone } from '../types';
import { useAppModals } from '../hooks/useModals';
import { Sparkles } from 'lucide-react';

const ProjectManagerModal = lazy(() => import('./ProjectManagerModal').then(m => ({ default: m.ProjectManagerModal })));
const HolidayManagementModal = lazy(() => import('./HolidayManagementModal').then(m => ({ default: m.HolidayManagementModal })));
const ContactImportModal = lazy(() => import('./ContactImportModal').then(m => ({ default: m.ContactImportModal })));
const DocumentPreviewModal = lazy(() => import('./DocumentPreviewModal').then(m => ({ default: m.DocumentPreviewModal })));
const ErrorLogModal = lazy(() => import('./ErrorLogModal').then(m => ({ default: m.ErrorLogModal })));
const AddReportModal = lazy(() => import('./AddReportModal').then(m => ({ default: m.AddReportModal })));
const EditReportModal = lazy(() => import('./EditReportModal').then(m => ({ default: m.EditReportModal })));
const SchedulerLogModal = lazy(() => import('./SchedulerLogModal').then(m => ({ default: m.SchedulerLogModal })));
const UserAuthModal = lazy(() => import('./UserAuthModal').then(m => ({ default: m.UserAuthModal })));
const UserPermissionModal = lazy(() => import('./UserPermissionModal').then(m => ({ default: m.UserPermissionModal })));
const SystemSettingsModal = lazy(() => import('./SystemSettingsModal').then(m => ({ default: m.SystemSettingsModal })));

const ModalFallback = () => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(2px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
  }}>
    <Sparkles className="animate-spin" size={32} color="var(--accent-primary)" />
  </div>
);

interface GlobalModalContainerProps {
  modals: ReturnType<typeof useAppModals>;
  projects: Project[];
  activeProject: Project | null;
  contacts: Contact[];
  currentUser: UserSession;
  extractResult: DocumentExtractResult | null;
  editingRule: MilestoneRule | null;
  setEditingRule: (rule: MilestoneRule | null) => void;
  setCurrentUser: (user: UserSession) => void;
  handleSelectProject: (project: Project) => Promise<void>;
  handleCreateProject: (projData: Partial<Project>) => Promise<void>;
  handleDeleteProject: (projectId: string) => Promise<void>;
  handleBatchDeleteProjects: (projectIds: string[]) => Promise<void>;
  handleHolidayOrContactUpdated: () => Promise<void>;
  handleConfirmImportDocumentMilestones: (selected: ExtractedMilestone[]) => Promise<void>;
  handleAddReport: (newRule: MilestoneRule) => Promise<void>;
  handleSaveEditedRule: (updatedRule: MilestoneRule) => Promise<void>;
}

export const GlobalModalContainer: React.FC<GlobalModalContainerProps> = ({
  modals,
  projects,
  activeProject,
  contacts,
  currentUser,
  extractResult,
  editingRule,
  setEditingRule,
  setCurrentUser,
  handleSelectProject,
  handleCreateProject,
  handleDeleteProject,
  handleBatchDeleteProjects,
  handleHolidayOrContactUpdated,
  handleConfirmImportDocumentMilestones,
  handleAddReport,
  handleSaveEditedRule,
}) => {
  return (
    <Suspense fallback={<ModalFallback />}>
      {modals.projectManager.isOpen && (
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
      )}

      {modals.holiday.isOpen && (
        <HolidayManagementModal
          isOpen={modals.holiday.isOpen}
          onClose={modals.holiday.close}
          onHolidayUpdated={handleHolidayOrContactUpdated}
        />
      )}

      {modals.contact.isOpen && (
        <ContactImportModal
          isOpen={modals.contact.isOpen}
          onClose={modals.contact.close}
          onContactsUpdated={handleHolidayOrContactUpdated}
        />
      )}

      {modals.documentPreview.isOpen && (
        <DocumentPreviewModal
          isOpen={modals.documentPreview.isOpen}
          onClose={modals.documentPreview.close}
          extractResult={extractResult}
          onConfirmImport={handleConfirmImportDocumentMilestones}
        />
      )}

      {modals.errorLog.isOpen && (
        <ErrorLogModal
          isOpen={modals.errorLog.isOpen}
          onClose={modals.errorLog.close}
        />
      )}

      {modals.addReport.isOpen && (
        <AddReportModal
          isOpen={modals.addReport.isOpen}
          onClose={modals.addReport.close}
          activeProject={activeProject}
          contacts={contacts}
          onAddReport={handleAddReport}
        />
      )}

      {modals.editReport.isOpen && (
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
      )}

      {modals.schedulerLog.isOpen && (
        <SchedulerLogModal
          isOpen={modals.schedulerLog.isOpen}
          onClose={modals.schedulerLog.close}
        />
      )}

      {modals.userAuth.isOpen && (
        <UserAuthModal
          isOpen={modals.userAuth.isOpen}
          onClose={modals.userAuth.close}
          currentUser={currentUser}
          onUserLoginSuccess={(u) => setCurrentUser(u)}
        />
      )}

      {modals.userPermission.isOpen && (
        <UserPermissionModal
          isOpen={modals.userPermission.isOpen}
          onClose={modals.userPermission.close}
          currentUser={currentUser}
        />
      )}

      {modals.systemSettings.isOpen && (
        <SystemSettingsModal
          isOpen={modals.systemSettings.isOpen}
          onClose={modals.systemSettings.close}
        />
      )}
    </Suspense>
  );
};
