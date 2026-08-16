/**
 * cryptoService.js
 * AES-256-GCM authenticated encryption service for sensitive credentials (e.g. Gemini API Key).
 */

const crypto = require('crypto');
const { logError } = require('./errorLogger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits standard for GCM

/**
 * Derive a 32-byte encryption key from environment secret or system key
 */
function getMasterKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'report-reminder-default-secure-master-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt plain text using AES-256-GCM
 * @param {string} text Plaintext to encrypt
 * @returns {string} Formatted string "iv:tag:ciphertext" (in hex)
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') return '';
  try {
    const key = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 });

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (err) {
    logError('CRYPTO_ENCRYPT', err);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt cipher bundle using AES-256-GCM
 * @param {string} bundle Formatted string "iv:tag:ciphertext" (in hex)
 * @returns {string} Decrypted plaintext
 */
function decrypt(bundle) {
  if (!bundle || typeof bundle !== 'string') return '';
  const parts = bundle.split(':');
  if (parts.length !== 3) {
    // If not encrypted format, return as is if valid or empty
    return '';
  }

  try {
    const [ivHex, tagHex, encryptedHex] = parts;
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    logError('CRYPTO_DECRYPT', err);
    return '';
  }
}

/**
 * Mask API Key for safe display in frontend / logs
 * @param {string} key API key to mask
 * @returns {string} Masked string e.g. "AIzaSy...****"
 */
function maskApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '****';
  const prefix = trimmed.substring(0, 6);
  const suffix = trimmed.substring(trimmed.length - 4);
  return `${prefix}...****...${suffix}`;
}

module.exports = {
  encrypt,
  decrypt,
  maskApiKey
};
