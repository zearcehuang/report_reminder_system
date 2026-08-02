const assert = require('assert');
const { parseOutlookCsvText } = require('../services/csvParser');

function runTests() {
  console.log('🧪 Testing csvParser...');

  const csvContent = `"First Name","Last Name","E-mail Address","Company","Job Title"
"小明","張","alex.chang@company.com","專案部","PM"
"大華","李","david.lee@company.com","架構部","SA"
`;

  const contacts = parseOutlookCsvText(csvContent);
  assert.strictEqual(contacts.length, 2, 'Should parse 2 contacts');
  assert.strictEqual(contacts[0].name, '張小明', 'Chinese name format should combine Last First');
  assert.strictEqual(contacts[0].email, 'alex.chang@company.com', 'Email parsing failed');
  assert.strictEqual(contacts[1].name, '李大華', 'Second contact name failed');

  console.log('✅ All csvParser tests passed!\n');
}

try {
  runTests();
} catch (err) {
  console.error('❌ csvParser test failed:', err);
  process.exit(1);
}
