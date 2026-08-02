const assert = require('assert');
const { hashPassword, verifyPassword } = require('../services/passwordService');

function runTests() {
  console.log('🧪 Testing passwordService...');

  const plain = 'secretPass123!';
  const hash = hashPassword(plain);

  // Hash format: salt:hash
  assert(hash.includes(':'), 'Hash must contain colon separator');
  assert(verifyPassword(plain, hash), 'Correct password verification failed');
  assert(!verifyPassword('wrongPassword', hash), 'Wrong password incorrectly verified');

  // Backward compatibility check for plain text legacy passwords
  assert(verifyPassword('admin123', 'admin123'), 'Legacy plaintext password check failed');
  assert(!verifyPassword('wrong', 'admin123'), 'Legacy plaintext wrong password check failed');

  console.log('✅ All passwordService tests passed!\n');
}

try {
  runTests();
} catch (err) {
  console.error('❌ passwordService test failed:', err);
  process.exit(1);
}
