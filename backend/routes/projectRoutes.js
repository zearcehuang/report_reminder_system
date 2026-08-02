const express = require('express');
const path = require('path');
const { readJsonSync, writeJsonSync } = require('../services/jsonStore');
const { getPreviousWorkday } = require('../services/calendarService');
const { requirePermission } = require('../middleware/authMiddleware');
const { validateBody, schemas } = require('../middleware/validation');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const HOLIDAYS_FILE = path.join(DATA_DIR, 'holidays.json');

// Get all projects
router.get('/', (req, res) => {
  const projects = readJsonSync(PROJECTS_FILE, []);
  res.json(projects);
});

// Create project
router.post('/', requirePermission('projects:write'), validateBody(schemas.createProject), (req, res) => {
  const projects = readJsonSync(PROJECTS_FILE, []);
  const newProj = {
    id: req.body.id || `PRJ-${Date.now()}`,
    projectCode: req.body.projectCode || 'PRJ-NEW',
    projectName: req.body.projectName || '未命名專案',
    dDay: req.body.dDay || new Date().toISOString().split('T')[0],
    advanceDays: req.body.advanceDays || req.body.advanceNoticeDays || 3,
    ownerName: req.body.ownerName || '張小明 (PM)',
    ownerEmail: req.body.ownerEmail || 'alex.chang@company.com',
    projectOwners: req.body.projectOwners || [],
    teamsWebhookUrl: req.body.teamsWebhookUrl || '',
    rules: req.body.rules || [],
    explicitDeadlines: []
  };
  projects.push(newProj);
  writeJsonSync(PROJECTS_FILE, projects);
  res.json(newProj);
});

// Update project
router.put('/:id', requirePermission('projects:write'), (req, res) => {
  const projects = readJsonSync(PROJECTS_FILE, []);
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  projects[index] = { ...projects[index], ...req.body };
  writeJsonSync(PROJECTS_FILE, projects);
  res.json(projects[index]);
});

// Delete single project
router.delete('/:id', requirePermission('projects:delete'), (req, res) => {
  let projects = readJsonSync(PROJECTS_FILE, []);
  projects = projects.filter(p => p.id !== req.params.id);
  writeJsonSync(PROJECTS_FILE, projects);
  res.json({ success: true });
});

// Batch delete projects
router.post('/batch-delete', requirePermission('projects:delete'), (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
  let projects = readJsonSync(PROJECTS_FILE, []);
  projects = projects.filter(p => !ids.includes(p.id));
  writeJsonSync(PROJECTS_FILE, projects);
  res.json({ success: true, count: ids.length });
});

// Delete single rule
router.delete('/:projectId/rules/:ruleId', requirePermission('rules:write'), (req, res) => {
  const { projectId, ruleId } = req.params;
  const projects = readJsonSync(PROJECTS_FILE, []);
  const index = projects.findIndex(p => p.id === projectId);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  if (projects[index].rules) {
    projects[index].rules = projects[index].rules.filter(r => r.id !== ruleId);
  }
  if (projects[index].explicitDeadlines) {
    projects[index].explicitDeadlines = projects[index].explicitDeadlines.filter(e => e.id !== ruleId);
  }
  writeJsonSync(PROJECTS_FILE, projects);
  res.json({ success: true });
});

// Batch delete rules
router.post('/:projectId/rules/batch-delete', requirePermission('rules:write'), (req, res) => {
  const { projectId } = req.params;
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
  const projects = readJsonSync(PROJECTS_FILE, []);
  const index = projects.findIndex(p => p.id === projectId);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  if (projects[index].rules) {
    projects[index].rules = projects[index].rules.filter(r => !ids.includes(r.id));
  }
  if (projects[index].explicitDeadlines) {
    projects[index].explicitDeadlines = projects[index].explicitDeadlines.filter(e => !ids.includes(e.id));
  }
  writeJsonSync(PROJECTS_FILE, projects);
  res.json({ success: true, count: ids.length });
});

// Get project schedules
router.get('/:id/schedules', (req, res) => {
  const projects = readJsonSync(PROJECTS_FILE, []);
  const holidays = readJsonSync(HOLIDAYS_FILE, []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });

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
  res.json({ project: proj, items });
});

// Get rules for project
router.get('/:id/rules', (req, res) => {
  const projects = readJsonSync(PROJECTS_FILE, []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });
  const rules = (proj.rules || []).map(r => ({
    id: r.id,
    projectId: proj.id,
    title: r.title,
    dayOffset: r.dayOffset,
    owners: r.owners || [],
    enabled: r.enabled !== undefined ? r.enabled : true,
    isCompleted: !!r.isCompleted
  }));
  res.json(rules);
});

// Save rules for project
router.post('/:id/rules', requirePermission('rules:write'), (req, res) => {
  const projects = readJsonSync(PROJECTS_FILE, []);
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  projects[index].rules = req.body;
  writeJsonSync(PROJECTS_FILE, projects);
  res.json(req.body);
});

module.exports = router;
