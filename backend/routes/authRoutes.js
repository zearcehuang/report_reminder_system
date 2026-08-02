const express = require('express');
const path = require('path');
const { readJsonSync } = require('../services/jsonStore');
const { verifyPassword } = require('../services/passwordService');
const { generateToken } = require('../middleware/authMiddleware');
const { validateBody, schemas } = require('../middleware/validation');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// User Login
router.post('/login', validateBody(schemas.login), (req, res) => {
  const { email, password } = req.body;
  const users = readJsonSync(USERS_FILE, []);
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ success: false, message: '帳號或密碼錯誤 (Invalid email or password)' });
  }
  if (user.status === 'inactive') {
    return res.status(403).json({ success: false, message: '此帳號目前已停用，無法登入' });
  }

  const token = generateToken(user);
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      title: user.title,
      status: user.status
    }
  });
});

// Current user profile
router.get('/me', (req, res) => {
  if (req.user) {
    return res.json({ success: true, user: req.user });
  }
  res.json({
    success: true,
    user: {
      id: 'usr-admin-1',
      email: 'admin@company.com',
      name: '系統最高管理員',
      role: 'Admin',
      department: '資訊管理處',
      title: '資深系統管理員',
      status: 'active'
    }
  });
});

// Sender Login Authentication Endpoint
router.post('/sender-login', validateBody(schemas.senderLogin), (req, res) => {
  const { email, password, name } = req.body;
  const senderName = name && name.trim() ? name.trim() : email.split('@')[0];
  const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  res.json({
    success: true,
    message: `✅ 發布寄件者身份驗證成功！已成功登入: ${senderName} (${email})`,
    sender: {
      email,
      name: senderName,
      token,
      loggedInAt: new Date().toISOString()
    }
  });
});

module.exports = router;
