const express = require('express');
const path = require('path');
const { readJsonSync, writeJsonSync } = require('../services/jsonStore');
const { hashPassword, sanitizeUser, sanitizeUsers } = require('../services/passwordService');
const { requirePermission } = require('../middleware/authMiddleware');
const { validateBody, schemas } = require('../middleware/validation');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Get all users (Restricted to Admin, returns sanitized DTOs without password)
router.get('/', requirePermission('system:admin'), (req, res) => {
  const users = readJsonSync(USERS_FILE, []);
  res.json(sanitizeUsers(users));
});

// Create user
router.post('/', requirePermission('system:admin'), validateBody(schemas.createUser), (req, res) => {
  const users = readJsonSync(USERS_FILE, []);
  const { email, name, password, role, department, title, status } = req.body;
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, error: '此 Email 帳號已存在' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    email: email.trim(),
    name: name.trim(),
    password: hashPassword(password || '123456'),
    role: role || 'PM',
    department: department || '專案團隊',
    title: title || '團隊成員',
    status: status || 'active',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJsonSync(USERS_FILE, users);
  res.json({ success: true, user: sanitizeUser(newUser) });
});

// Update user (Whitelisted fields via validation middleware to prevent mass-assignment)
router.put('/:id', requirePermission('system:admin'), validateBody(schemas.updateUser), (req, res) => {
  const users = readJsonSync(USERS_FILE, []);
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'User not found' });

  // Whitelisted updates only
  const allowedUpdates = {};
  if (req.body.name !== undefined) allowedUpdates.name = req.body.name;
  if (req.body.department !== undefined) allowedUpdates.department = req.body.department;
  if (req.body.title !== undefined) allowedUpdates.title = req.body.title;
  if (req.body.status !== undefined) allowedUpdates.status = req.body.status;
  if (req.body.role !== undefined) allowedUpdates.role = req.body.role;

  users[index] = {
    ...users[index],
    ...allowedUpdates,
    updatedAt: new Date().toISOString()
  };
  writeJsonSync(USERS_FILE, users);
  res.json({ success: true, user: sanitizeUser(users[index]) });
});

// Delete user
router.delete('/:id', requirePermission('system:admin'), (req, res) => {
  let users = readJsonSync(USERS_FILE, []);
  users = users.filter(u => u.id !== req.params.id);
  writeJsonSync(USERS_FILE, users);
  res.json({ success: true });
});

// Batch delete users
router.post('/batch-delete', requirePermission('system:admin'), (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
  let users = readJsonSync(USERS_FILE, []);
  users = users.filter(u => !ids.includes(u.id));
  writeJsonSync(USERS_FILE, users);
  res.json({ success: true, count: ids.length });
});

// Import contacts as users
router.post('/import-contacts', requirePermission('system:admin'), (req, res) => {
  const users = readJsonSync(USERS_FILE, []);
  const contacts = readJsonSync(CONTACTS_FILE, []);
  let addedCount = 0;

  contacts.forEach((c, idx) => {
    if (!users.some(u => u.email.toLowerCase() === c.email.toLowerCase())) {
      users.push({
        id: `usr-${Date.now()}-${idx}`,
        email: c.email,
        name: c.name,
        password: hashPassword('123456'),
        role: 'PM',
        department: c.department || '專案團隊',
        title: c.title || '團隊成員',
        status: 'active',
        createdAt: new Date().toISOString()
      });
      addedCount++;
    }
  });

  if (addedCount > 0) writeJsonSync(USERS_FILE, users);
  res.json({ success: true, addedCount, users: sanitizeUsers(users) });
});

module.exports = router;
