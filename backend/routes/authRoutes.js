const express = require('express');
const path = require('path');
const { readJsonSync, writeJsonSync } = require('../services/jsonStore');
const { verifyPassword, hashPassword, sanitizeUser } = require('../services/passwordService');
const { generateToken, requireAuth } = require('../middleware/authMiddleware');
const { validateBody, schemas } = require('../middleware/validation');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// User Login
router.post('/login', validateBody(schemas.login), (req, res) => {
  const { email, password } = req.body;
  const users = readJsonSync(USERS_FILE, []);
  const userIndex = users.findIndex(u => u.email.toLowerCase() === (email || '').toLowerCase());
  
  if (userIndex === -1) {
    return res.status(401).json({ success: false, message: '帳號或密碼錯誤 (Invalid email or password)' });
  }

  const user = users[userIndex];
  if (!verifyPassword(password, user.password)) {
    return res.status(401).json({ success: false, message: '帳號或密碼錯誤 (Invalid email or password)' });
  }
  if (user.status === 'inactive') {
    return res.status(403).json({ success: false, message: '此帳號目前已停用，無法登入' });
  }

  // Auto-upgrade legacy plaintext password if applicable
  if (user.password && !user.password.includes(':')) {
    users[userIndex].password = hashPassword(password);
    writeJsonSync(USERS_FILE, users);
  }

  const token = generateToken(user);
  res.json({
    success: true,
    token,
    user: sanitizeUser(user)
  });
});

// Current user profile
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user)
  });
});

// Sender Login Authentication Endpoint
router.post('/sender-login', validateBody(schemas.senderLogin), (req, res) => {
  const { email, password, name } = req.body;
  const users = readJsonSync(USERS_FILE, []);
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    if (!verifyPassword(password, existingUser.password)) {
      return res.status(401).json({ success: false, error: '寄件者密碼錯誤，請輸入正確的帳號密碼' });
    }
    if (existingUser.status === 'inactive') {
      return res.status(403).json({ success: false, error: '此寄件者帳號已被停用' });
    }
  }

  const senderName = name && name.trim() ? name.trim() : (existingUser ? existingUser.name : email.split('@')[0]);
  const senderUser = existingUser || {
    id: `sender-${Date.now()}`,
    email,
    name: senderName,
    role: 'PM'
  };
  const token = generateToken(senderUser);

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
