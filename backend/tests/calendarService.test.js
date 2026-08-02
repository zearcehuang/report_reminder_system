const assert = require('assert');
const { formatDateISO, isWorkday, getPreviousWorkday } = require('../services/calendarService');

function runTests() {
  console.log('🧪 Testing calendarService...');

  // Test 1: formatDateISO
  const date = new Date(2026, 7, 2); // August 2, 2026
  assert.strictEqual(formatDateISO(date), '2026-08-02', 'formatDateISO failed for date object');
  assert.strictEqual(formatDateISO('2026-09-15'), '2026-09-15', 'formatDateISO failed for string date');

  // Test 2: isWorkday
  const holidays = [
    { date: '2026-01-01', isWorkday: false },
    { date: '2026-02-07', isWorkday: true } // 補班日 (Saturday but workday)
  ];

  // 2026-08-03 is Monday
  assert.strictEqual(isWorkday('2026-08-03', holidays), true, 'Monday should be workday');
  // 2026-08-02 is Sunday
  assert.strictEqual(isWorkday('2026-08-02', holidays), false, 'Sunday should not be workday');
  // Holiday check
  assert.strictEqual(isWorkday('2026-01-01', holidays), false, 'Holiday should not be workday');
  // Make-up workday check
  assert.strictEqual(isWorkday('2026-02-07', holidays), true, 'Make-up Saturday should be workday');

  // Test 3: getPreviousWorkday
  // Sunday 2026-08-02 -> Previous workday should be Friday 2026-07-31
  const prevWorkday = getPreviousWorkday('2026-08-02', holidays);
  assert.strictEqual(prevWorkday, '2026-07-31', 'getPreviousWorkday failed for weekend');

  console.log('✅ All calendarService tests passed!\n');
}

try {
  runTests();
} catch (err) {
  console.error('❌ calendarService test failed:', err);
  process.exit(1);
}
