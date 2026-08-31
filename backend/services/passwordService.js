const crypto = require('crypto');

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPassword(password) {
  if (!password || typeof password !== 'string') return '';
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  // Backward compat: if stored password has no ':' separator, it's plaintext (legacy)
  if (!storedHash.includes(':')) {
    const isMatch = password === storedHash;
    return isMatch;
  }

  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;

  const [salt, hash] = parts;
  try {
    const testHash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
    const storedBuf = Buffer.from(hash, 'hex');
    const testBuf = Buffer.from(testHash, 'hex');

    if (storedBuf.length !== testBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedBuf, testBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Strips sensitive fields (password, hash) from user object for safe API responses
 */
function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * Strips sensitive fields from a list of user objects
 */
function sanitizeUsers(users) {
  if (!Array.isArray(users)) return [];
  return users.map(u => sanitizeUser(u));
}

module.exports = {
  hashPassword,
  verifyPassword,
  sanitizeUser,
  sanitizeUsers
};
