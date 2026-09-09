import React, { useState } from 'react';
import { Project } from '../types';
import { FolderPlus, X, Briefcase } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { ProjectBatchBar } from './ProjectManagerModal/ProjectBatchBar';
import { ProjectListItem } from './ProjectManagerModal/ProjectListItem';
import { CreateProjectForm } from './ProjectManagerModal/CreateProjectForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProject: Project;
  onSelectProject: (project: Project) => void;
  onCreateProject: (project: Partial<Project>) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onBatchDeleteProjects: (projectIds: string[]) => Promise<void>;
}

export const ProjectManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onBatchDeleteProjects,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const toggleSelectProject = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === projects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(projects.map((p) => p.id));
    }
  };

  const handleDeleteSingle = async (proj: Project) => {
    toast.confirm(
      '刪除專案',
      `確定要刪除專案「[${proj.code}] ${proj.name}」嗎？刪除後無法復原。`,
      async () => {
        setIsDeleting(true);
        try {
          await onDeleteProject(proj.id);
          setSelectedIds((prev) => prev.filter((id) => id !== proj.id));
          toast.success(`成功刪除專案：${proj.name}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '刪除專案失敗';
          toast.error(msg);
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    toast.confirm(
      '批次刪除專案',
      `確定要刪除選取的 ${selectedIds.length} 個專案嗎？此動作無法復原。`,
      async () => {
        setIsDeleting(true);
        try {
          await onBatchDeleteProjects(selectedIds);
          setSelectedIds([]);
          toast.success(`成功刪除 ${selectedIds.length} 個專案`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '批次刪除專案失敗';
          toast.error(msg);
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  const handleCreateNew = async (projectData: Partial<Project>) => {
    await onCreateProject(projectData);
    setIsAdding(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-modal width-full" style={{ maxWidth: '680px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--accent-gradient)',
              padding: '0.6rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}>
              <Briefcase size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>專案管理中心</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>切換、新增或批次刪除專案</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Project List */}
        {!isAdding ? (
          <div>
            <ProjectBatchBar
              totalProjects={projects.length}
              selectedCount={selectedIds.length}
              isAllSelected={projects.length > 0 && selectedIds.length === projects.length}
              onToggleSelectAll={toggleSelectAll}
              onBatchDelete={handleBatchDelete}
              isDeleting={isDeleting}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {projects.map((proj) => (
                <ProjectListItem
                  key={proj.id}
                  proj={proj}
                  isActive={proj.id === activeProject.id}
                  isSelected={selectedIds.includes(proj.id)}
                  isDeleting={isDeleting}
                  onSelect={() => {
                    onSelectProject(proj);
                    onClose();
                  }}
                  onToggleSelect={() => toggleSelectProject(proj.id)}
                  onDelete={() => handleDeleteSingle(proj)}
                />
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-primary" onClick={() => setIsAdding(true)}>
                <FolderPlus size={18} /> 新建專案
              </button>
            </div>
          </div>
        ) : (
          <CreateProjectForm
            onCancel={() => setIsAdding(false)}
            onCreateProject={handleCreateNew}
          />
        )}
      </div>
    </div>
  );
};
