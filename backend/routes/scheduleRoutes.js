const express = require('express');
const path = require('path');
const { readJsonSync, writeJsonSync } = require('../services/jsonStore');
const { requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// Toggle Submitted status
router.post('/:id/mark-submitted', requirePermission('schedules:submit'), (req, res) => {
  const projects = readJsonSync(PROJECTS_FILE, []);
  let found = false;
  projects.forEach(proj => {
    (proj.rules || []).forEach(r => {
      if (r.id === req.params.id) {
        r.isCompleted = req.body.isCompleted !== undefined ? req.body.isCompleted : true;
        found = true;
      }
    });
    (proj.explicitDeadlines || []).forEach(e => {
      if (e.id === req.params.id) {
        e.isCompleted = req.body.isCompleted !== undefined ? req.body.isCompleted : true;
        found = true;
      }
    });
  });
  if (found) writeJsonSync(PROJECTS_FILE, projects);
  res.json({ success: found });
});

module.exports = router;
