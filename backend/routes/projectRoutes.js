const express = require('express');
const projectService = require('../services/projectService');
const { requirePermission } = require('../middleware/authMiddleware');
const { validateBody, schemas } = require('../middleware/validation');
const { logError } = require('../services/errorLogger');

const router = express.Router();

// Get all projects
router.get('/', requirePermission('projects:read'), (req, res) => {
  try {
    const projects = projectService.getAllProjects();
    res.json(projects);
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/', requirePermission('projects:write'), validateBody(schemas.createProject), (req, res) => {
  try {
    const newProj = projectService.createProject(req.body);
    res.json(newProj);
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', requirePermission('projects:write'), (req, res) => {
  try {
    const updatedProj = projectService.updateProject(req.params.id, req.body);
    if (!updatedProj) return res.status(404).json({ error: 'Project not found' });
    res.json(updatedProj);
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

// Delete single project
router.delete('/:id', requirePermission('projects:delete'), (req, res) => {
  try {
    projectService.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

// Batch delete projects
router.post('/batch-delete', requirePermission('projects:delete'), (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
    const count = projectService.batchDeleteProjects(ids);
    res.json({ success: true, count });
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

// Delete single rule
router.delete('/:projectId/rules/:ruleId', requirePermission('rules:write'), (req, res) => {
  try {
    const success = projectService.deleteProjectRule(req.params.projectId, req.params.ruleId);
    if (!success) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

// Batch delete rules
router.post('/:projectId/rules/batch-delete', requirePermission('rules:write'), (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
    
    const count = projectService.batchDeleteProjectRules(req.params.projectId, ids);
    if (count === null) return res.status(404).json({ error: 'Project not found' });
    
    res.json({ success: true, count });
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

// Get project schedules
router.get('/:id/schedules', requirePermission('projects:read'), (req, res) => {
  try {
    const result = projectService.getProjectSchedules(req.params.id);
    if (!result) return res.status(404).json({ error: 'Project not found' });
    res.json(result);
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

// Get rules for project
router.get('/:id/rules', requirePermission('projects:read'), (req, res) => {
  try {
    const rules = projectService.getProjectRules(req.params.id);
    if (!rules) return res.status(404).json({ error: 'Project not found' });
    res.json(rules);
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

// Save rules for project
router.post('/:id/rules', requirePermission('rules:write'), (req, res) => {
  try {
    const rules = projectService.saveProjectRules(req.params.id, req.body);
    if (!rules) return res.status(404).json({ error: 'Project not found' });
    res.json(rules);
  } catch (error) {
    logError('PROJECT_ROUTE', error, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
