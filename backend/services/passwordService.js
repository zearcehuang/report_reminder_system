const crypto = require('crypto');

const SALT_LENGTH = 16;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  // Backward compat: if stored password has no ':' separator, it's plaintext (legacy)
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }
  const [salt, hash] = storedHash.split(':');
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === testHash;
}

module.exports = {
  hashPassword,
  verifyPassword
};
