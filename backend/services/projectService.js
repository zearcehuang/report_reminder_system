const path = require('path');
const { readJsonSync, writeJsonSync } = require('./jsonStore');
const { getPreviousWorkday } = require('./calendarService');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const HOLIDAYS_FILE = path.join(DATA_DIR, 'holidays.json');

class ProjectService {
  /**
   * Get all projects
   * @returns {Array} List of all projects
   */
  getAllProjects() {
    return readJsonSync(PROJECTS_FILE, []);
  }

  /**
   * Get project by ID
   * @param {string} id 
   * @returns {Object|null} Project object or null if not found
   */
  getProjectById(id) {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * Create a new project
   * @param {Object} projectData 
   * @returns {Object} Newly created project
   */
  createProject(projectData) {
    const projects = this.getAllProjects();
    const newProj = {
      id: projectData.id || `PRJ-${Date.now()}`,
      projectCode: projectData.projectCode || 'PRJ-NEW',
      projectName: projectData.projectName || '未命名專案',
      dDay: projectData.dDay || new Date().toISOString().split('T')[0],
      advanceDays: projectData.advanceDays || projectData.advanceNoticeDays || 3,
      ownerName: projectData.ownerName || '張小明 (PM)',
      ownerEmail: projectData.ownerEmail || 'alex.chang@company.com',
      projectOwners: projectData.projectOwners || [],
      teamsWebhookUrl: projectData.teamsWebhookUrl || '',
      rules: projectData.rules || [],
      explicitDeadlines: projectData.explicitDeadlines || []
    };
    projects.push(newProj);
    writeJsonSync(PROJECTS_FILE, projects);
    return newProj;
  }

  /**
   * Update an existing project
   * @param {string} id 
   * @param {Object} projectData 
   * @returns {Object|null} Updated project or null if not found
   */
  updateProject(id, projectData) {
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    projects[index] = { ...projects[index], ...projectData };
    writeJsonSync(PROJECTS_FILE, projects);
    return projects[index];
  }

  /**
   * Delete a single project
   * @param {string} id 
   * @returns {boolean} True if deleted, false if not found
   */
  deleteProject(id) {
    let projects = this.getAllProjects();
    const initialLength = projects.length;
    projects = projects.filter(p => p.id !== id);
    
    if (projects.length === initialLength) return false;
    
    writeJsonSync(PROJECTS_FILE, projects);
    return true;
  }

  /**
   * Batch delete projects
   * @param {Array<string>} ids 
   * @returns {number} Number of deleted projects
   */
  batchDeleteProjects(ids) {
    if (!Array.isArray(ids)) throw new Error('ids must be an array');
    
    let projects = this.getAllProjects();
    const initialLength = projects.length;
    projects = projects.filter(p => !ids.includes(p.id));
    
    writeJsonSync(PROJECTS_FILE, projects);
    return initialLength - projects.length; // return count
  }

  /**
   * Delete a single rule from a project
   * @param {string} projectId 
   * @param {string} ruleId 
   * @returns {boolean} True if project found and updated
   */
  deleteProjectRule(projectId, ruleId) {
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index === -1) return false;

    if (projects[index].rules) {
      projects[index].rules = projects[index].rules.filter(r => r.id !== ruleId);
    }
    if (projects[index].explicitDeadlines) {
      projects[index].explicitDeadlines = projects[index].explicitDeadlines.filter(e => e.id !== ruleId);
    }
    
    writeJsonSync(PROJECTS_FILE, projects);
    return true;
  }

  /**
   * Batch delete rules from a project
   * @param {string} projectId 
   * @param {Array<string>} ruleIds 
   * @returns {number|null} Number of deleted rules, or null if project not found
   */
  batchDeleteProjectRules(projectId, ruleIds) {
    if (!Array.isArray(ruleIds)) throw new Error('ids must be an array');
    
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index === -1) return null;

    if (projects[index].rules) {
      projects[index].rules = projects[index].rules.filter(r => !ruleIds.includes(r.id));
    }
    if (projects[index].explicitDeadlines) {
      projects[index].explicitDeadlines = projects[index].explicitDeadlines.filter(e => !ruleIds.includes(e.id));
    }
    
    writeJsonSync(PROJECTS_FILE, projects);
    return ruleIds.length; // Approx count as per original logic
  }

  /**
   * Get project schedules and calculate holiday shifted notice dates
   * @param {string} projectId 
   * @returns {Object|null} { project, items } or null if project not found
   */
  getProjectSchedules(projectId) {
    const proj = this.getProjectById(projectId);
    if (!proj) return null;

    const holidays = readJsonSync(HOLIDAYS_FILE, []);
    const dDay = new Date(proj.dDay);
    const items = [];

    (proj.rules || []).forEach(rule => {
      const deadline = new Date(dDay);
      deadline.setDate(deadline.getDate() + rule.dayOffset);
      const deadlineIso = deadline.toISOString().split('T')[0];

      const targetNoticeDate = new Date(deadline);
      targetNoticeDate.setDate(targetNoticeDate.getDate() - (proj.advanceDays || 3));
      const targetNoticeIso = targetNoticeDate.toISOString().split('T')[0];

      const actualNoticeIso = getPreviousWorkday(targetNoticeIso, holidays);
      const isShifted = actualNoticeIso !== targetNoticeIso;

      items.push({
        id: rule.id,
        title: rule.title,
        dayOffset: rule.dayOffset,
        deadlineDate: deadlineIso,
        noticeDate: actualNoticeIso,
        rawNoticeDate: targetNoticeIso,
        isHolidayShifted: isShifted,
        owners: rule.owners || [],
        isCompleted: !!rule.isCompleted,
        source: 'D+N Rule',
        status: rule.isCompleted ? 'Submitted' : 'Pending'
      });
    });

    (proj.explicitDeadlines || []).forEach(exp => {
      const deadlineIso = exp.date;
      const targetNoticeDate = new Date(deadlineIso);
      targetNoticeDate.setDate(targetNoticeDate.getDate() - (proj.advanceDays || 3));
      const targetNoticeIso = targetNoticeDate.toISOString().split('T')[0];

      const actualNoticeIso = getPreviousWorkday(targetNoticeIso, holidays);
      const isShifted = actualNoticeIso !== targetNoticeIso;

      items.push({
        id: exp.id,
        title: exp.title,
        dayOffset: 0,
        deadlineDate: deadlineIso,
        noticeDate: actualNoticeIso,
        rawNoticeDate: targetNoticeIso,
        isHolidayShifted: isShifted,
        owners: exp.owners || [],
        isCompleted: !!exp.isCompleted,
        source: 'Explicit File Date',
        status: exp.isCompleted ? 'Submitted' : 'Pending'
      });
    });

    items.sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate));
    return { project: proj, items };
  }

  /**
   * Get formatting rules for a project
   * @param {string} projectId 
   * @returns {Array|null} Array of rules or null if project not found
   */
  getProjectRules(projectId) {
    const proj = this.getProjectById(projectId);
    if (!proj) return null;
    
    return (proj.rules || []).map(r => ({
      id: r.id,
      projectId: proj.id,
      title: r.title,
      dayOffset: r.dayOffset,
      owners: r.owners || [],
      enabled: r.enabled !== undefined ? r.enabled : true,
      isCompleted: !!r.isCompleted
    }));
  }

  /**
   * Save (overwrite) rules for a project
   * @param {string} projectId 
   * @param {Array} rules 
   * @returns {Array|null} Updated rules or null if project not found
   */
  saveProjectRules(projectId, rules) {
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index === -1) return null;
    
    projects[index].rules = rules;
    writeJsonSync(PROJECTS_FILE, projects);
    return rules;
  }
}

module.exports = new ProjectService();
