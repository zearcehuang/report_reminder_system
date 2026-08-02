import React from 'react';
import { Project, MilestoneRule, Contact, UserSession, DocumentExtractResult, ExtractedMilestone } from '../types';
import { ProjectManagerModal } from './ProjectManagerModal';
import { HolidayManagementModal } from './HolidayManagementModal';
import { ContactImportModal } from './ContactImportModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { ErrorLogModal } from './ErrorLogModal';
import { AddReportModal } from './AddReportModal';
import { EditReportModal } from './EditReportModal';
import { SchedulerLogModal } from './SchedulerLogModal';
import { UserAuthModal } from './UserAuthModal';
import { UserPermissionModal } from './UserPermissionModal';
import { useAppModals } from '../hooks/useModals';

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
    <>
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
    </>
  );
};
