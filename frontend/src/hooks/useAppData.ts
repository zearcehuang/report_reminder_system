import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, MilestoneRule, ScheduleItem, Contact, UserSession } from '../types';
import { api } from '../services/api';

export const useAppData = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [rules, setRules] = useState<MilestoneRule[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession>(api.getAuthSession());
  const [isLoading, setIsLoading] = useState(true);

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

  const handleHolidayOrContactUpdated = async () => {
    if (activeProject) {
      const s = await api.getSchedules(activeProject.id);
      setSchedules(s);
    }
    const c = await api.getContacts();
    setContacts(c);
  };

  const stats = useMemo(() => ({
    totalMilestones: rules.filter(r => r.enabled).length,
    submittedCount: schedules.filter(s => s.status === 'Submitted').length,
    pendingCount: schedules.filter(s => s.status === 'Pending').length,
    shiftedCount: schedules.filter(s => s.wasShiftedByHoliday).length,
  }), [rules, schedules]);

  return {
    projects,
    activeProject,
    rules,
    schedules,
    contacts,
    currentUser,
    setCurrentUser,
    isLoading,
    stats,
    loadProjectDetails,
    handleSelectProject,
    handleCreateProject,
    handleDeleteProject,
    handleBatchDeleteProjects,
    handleUpdateProject,
    handleSaveRules,
    handleDeleteSchedule,
    handleBatchDeleteSchedules,
    handleDeleteRule,
    handleBatchDeleteRules,
    handleToggleSubmitted,
    handleHolidayOrContactUpdated
  };
};
