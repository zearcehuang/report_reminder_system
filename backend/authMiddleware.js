/**
 * authMiddleware.js
 * 多角色權限控管 (RBAC) 與 JWT 身份驗證服務
 */

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'report_reminder_system_secret_key_2026';

// 預設使用者資料庫 (Mock Database)
const USERS = [
  {
    id: 'usr-admin-1',
    email: 'admin@company.com',
    password: 'admin123',
    name: '系統最高管理員',
    role: 'Admin',
    department: '資訊管理處'
  },
  {
    id: 'usr-pm-1',
    email: 'alex.chang@company.com',
    password: 'pm123',
    name: '張小明 (專案經理)',
    role: 'PM',
    department: '專案管理一部'
  },
  {
    id: 'usr-auditor-1',
    email: 'auditor@company.com',
    password: 'auditor123',
    name: '陳美玲 (合約查核員)',
    role: 'Auditor',
    department: '法務與合約稽核室'
  }
];

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
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) return null;

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
      req.user = decoded;
    }
  }
  next();
}

// Middleware: Require Specific Role(s)
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    // Default fallback to Admin for unauthenticated requests in demo mode if header missing
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

module.exports = {
  USERS,
  generateToken,
  verifyToken,
  authenticateUser,
  requireRole
};
