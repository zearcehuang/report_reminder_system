/**
 * authMiddleware.js
 * 多角色權限控管 (RBAC) 與 JWT 身份驗證服務 (動態 Users 與 Roles 支持)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'report_reminder_system_secret_key_2026';
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ROLES_FILE = path.join(DATA_DIR, 'roles.json');

// Warn if using default JWT secret in production
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  [SECURITY] JWT_SECRET is using default fallback key. Set JWT_SECRET environment variable for production.');
}

// TTL-based memory cache to avoid reading files on every request
const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const cache = {
  users: { data: null, timestamp: 0 },
  roles: { data: null, timestamp: 0 }
};

// Helper to read JSON
function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return defaultValue;
  }
}

// Get dynamic Users array (with TTL cache)
function getUsers() {
  const now = Date.now();
  if (cache.users.data && (now - cache.users.timestamp) < CACHE_TTL_MS) {
    return cache.users.data;
  }
  const users = readJson(USERS_FILE, null);
  if (users && users.length > 0) {
    cache.users.data = users;
    cache.users.timestamp = now;
    return users;
  }
  // Default fallback
  const defaultUsers = [
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
  cache.users.data = defaultUsers;
  cache.users.timestamp = now;
  return defaultUsers;
}

// Get dynamic Roles array (with TTL cache)
function getRoles() {
  const now = Date.now();
  if (cache.roles.data && (now - cache.roles.timestamp) < CACHE_TTL_MS) {
    return cache.roles.data;
  }
  const roles = readJson(ROLES_FILE, null);
  if (roles && roles.length > 0) {
    cache.roles.data = roles;
    cache.roles.timestamp = now;
    return roles;
  }
  const defaultRoles = [
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
  cache.roles.data = defaultRoles;
  cache.roles.timestamp = now;
  return defaultRoles;
}

// Helper: base64url encode
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Generate JWT Token
function generateToken(user) {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    title: user.title,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7 // 7 days
  });

  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT Token
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  
  // Validate base64url format before processing
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  if (!base64urlRegex.test(encodedHeader) || !base64urlRegex.test(encodedPayload) || !base64urlRegex.test(signature)) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Use timing-safe comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
  } catch {
    if (signature !== expectedSignature) return null;
  }

  try {
    const payloadStr = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const payload = JSON.parse(payloadStr);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Middleware: Authenticate User Token
function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      // Check if user is active in dynamic database
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

// Middleware: Require Specific Role(s)
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    // Default fallback to Admin for unauthenticated demo requests if header missing
    const userRole = req.user ? req.user.role : 'Admin';

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: '權限不足 (Access Denied)',
        message: `當前角色 [${userRole}] 無存取權限，需要 [${allowedRoles.join(', ')}] 權限`
      });
    }
    next();
  };
}

// Middleware: Require Specific Permission Node
function requirePermission(permissionCode) {
  return (req, res, next) => {
    const userRole = req.user ? req.user.role : 'Admin';
    const roles = getRoles();
    const roleObj = roles.find(r => r.name.toLowerCase() === userRole.toLowerCase());

    // Admin role or system:admin permission bypass
    const permissions = roleObj ? (roleObj.permissions || []) : [];
    if (userRole === 'Admin' || permissions.includes('system:admin') || permissions.includes(permissionCode)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: '權限不足 (Permission Denied)',
      message: `當前角色 [${userRole}] 缺少所需模組權限點 [${permissionCode}]`
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
  requireRole,
  requirePermission,
  // Expose cache invalidation for use when users/roles are modified
  invalidateCache(type) {
    if (type === 'users') { cache.users.data = null; cache.users.timestamp = 0; }
    if (type === 'roles') { cache.roles.data = null; cache.roles.timestamp = 0; }
    if (!type) { cache.users.data = null; cache.users.timestamp = 0; cache.roles.data = null; cache.roles.timestamp = 0; }
  }
};
