const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { readJsonSync } = require('../services/jsonStore');
const { logError } = require('../services/errorLogger');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ROLES_FILE = path.join(DATA_DIR, 'roles.json');

// Initialize JWT Secret dynamically if not provided in environment variables
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be set in environment variables in production mode!');
  }
  // Generate a random 256-bit (32 byte) key and encode as hex for development
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn(`⚠️ [SECURITY] JWT_SECRET is not set in environment variables.`);
  console.warn(`⚠️ [SECURITY] Using dynamically generated secure random key for development session.`);
  console.warn(`⚠️ [SECURITY] NOTE: Active sessions will be invalidated upon server restart! Set JWT_SECRET in .env to prevent this.`);
}

function getUsers() {
  const users = readJsonSync(USERS_FILE, null);
  if (users && users.length > 0) return users;

  return [
    {
      id: 'usr-admin-1',
      email: 'admin@company.com',
      password: 'admin123',
      name: '系統最高管理員',
      role: 'Admin',
      department: '資訊管理處',
      title: '資深系統管理員',
      status: 'active'
    },
    {
      id: 'usr-pm-1',
      email: 'alex.chang@company.com',
      password: 'pm123',
      name: '張小明',
      role: 'PM',
      department: '專案管理一部',
      title: '專案經理 (PM)',
      status: 'active'
    },
    {
      id: 'usr-auditor-1',
      email: 'auditor@company.com',
      password: 'auditor123',
      name: '陳美玲',
      role: 'Auditor',
      department: '法務與合約稽核室',
      title: '合約查核員',
      status: 'active'
    }
  ];
}

function getRoles() {
  const roles = readJsonSync(ROLES_FILE, null);
  if (roles && roles.length > 0) return roles;

  return [
    {
      id: 'role-admin',
      name: 'Admin',
      description: '系統最高管理員',
      isSystem: true,
      permissions: ['projects:read', 'projects:write', 'projects:delete', 'rules:write', 'schedules:submit', 'notifications:send', 'holidays:manage', 'contacts:manage', 'system:admin']
    },
    {
      id: 'role-pm',
      name: 'PM',
      description: '專案經理',
      isSystem: true,
      permissions: ['projects:read', 'projects:write', 'rules:write', 'schedules:submit', 'notifications:send', 'contacts:manage']
    },
    {
      id: 'role-auditor',
      name: 'Auditor',
      description: '合約與報告審核員',
      isSystem: true,
      permissions: ['projects:read', 'schedules:submit']
    }
  ];
}

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    title: user.title
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      const currentUsers = getUsers();
      const dbUser = currentUsers.find(u => u.id === decoded.id || u.email.toLowerCase() === decoded.email.toLowerCase());
      if (dbUser && dbUser.status === 'inactive') {
        return res.status(403).json({ success: false, error: '帳號已被停用 (Account Disabled)' });
      }
      req.user = dbUser ? { ...decoded, role: dbUser.role } : decoded;
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: '未授權存取 (Authentication Required)',
      message: '請先登入以取得存取權限'
    });
  }
  next();
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未授權存取 (Authentication Required)',
        message: '請先登入以取得存取權限'
      });
    }

    const userRole = req.user.role;

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      const errMsg = `當前角色 [${userRole}] 無存取權限，需要 [${allowedRoles.join(', ')}] 權限`;
      logError('AUTH_ROLE_DENIED', errMsg, { user: req.user, url: req.originalUrl, method: req.method });
      return res.status(403).json({
        success: false,
        error: '權限不足 (Access Denied)',
        message: errMsg
      });
    }
    next();
  };
}

function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未授權存取 (Authentication Required)',
        message: '請先登入以取得存取權限'
      });
    }

    const userRole = req.user.role;
    const roles = getRoles();
    const roleObj = roles.find(r => r.name.toLowerCase() === userRole.toLowerCase());

    const permissions = roleObj ? (roleObj.permissions || []) : [];
    if (userRole === 'Admin' || permissions.includes('system:admin') || permissions.includes(permissionCode)) {
      return next();
    }

    const errMsg = `當前角色 [${userRole}] 缺少所需模組權限點 [${permissionCode}]`;
    logError('AUTH_PERMISSION_DENIED', errMsg, { user: req.user, permissionCode, url: req.originalUrl, method: req.method });
    return res.status(403).json({
      success: false,
      error: '權限不足 (Permission Denied)',
      message: errMsg
    });
  };
}

module.exports = {
  get USERS() { return getUsers(); },
  getUsers,
  getRoles,
  generateToken,
  verifyToken,
  authenticateUser,
  requireAuth,
  requireRole,
  requirePermission,
  invalidateCache() {}
};
