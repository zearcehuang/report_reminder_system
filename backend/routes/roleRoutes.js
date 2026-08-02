const express = require('express');
const path = require('path');
const { readJsonSync, writeJsonSync } = require('../services/jsonStore');
const { requirePermission } = require('../middleware/authMiddleware');
const { validateBody, schemas } = require('../middleware/validation');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const ROLES_FILE = path.join(DATA_DIR, 'roles.json');

// Get all roles
router.get('/', (req, res) => {
  const roles = readJsonSync(ROLES_FILE, []);
  res.json(roles);
});

// Create role
router.post('/', requirePermission('system:admin'), validateBody(schemas.createRole), (req, res) => {
  const roles = readJsonSync(ROLES_FILE, []);
  const { name, description, permissions } = req.body;
  if (roles.some(r => r.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ success: false, error: '此角色名稱已存在' });
  }

  const newRole = {
    id: `role-${Date.now()}`,
    name: name.trim(),
    description: description || '',
    isSystem: false,
    permissions: Array.isArray(permissions) ? permissions : ['projects:read']
  };

  roles.push(newRole);
  writeJsonSync(ROLES_FILE, roles);
  res.json({ success: true, role: newRole });
});

// Update role
router.put('/:id', requirePermission('system:admin'), (req, res) => {
  const roles = readJsonSync(ROLES_FILE, []);
  const index = roles.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Role not found' });

  roles[index] = {
    ...roles[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  writeJsonSync(ROLES_FILE, roles);
  res.json({ success: true, role: roles[index] });
});

// Delete role
router.delete('/:id', requirePermission('system:admin'), (req, res) => {
  let roles = readJsonSync(ROLES_FILE, []);
  const target = roles.find(r => r.id === req.params.id);
  if (target && target.isSystem) {
    return res.status(400).json({ success: false, error: '無法刪除系統預設角色 (Admin/PM/Auditor)' });
  }
  roles = roles.filter(r => r.id !== req.params.id);
  writeJsonSync(ROLES_FILE, roles);
  res.json({ success: true });
});

module.exports = router;
