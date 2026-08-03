const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { writeJson, readJson, readJsonSync, writeJsonSync, invalidateCache } = require('../services/jsonStore');

const testFile = path.join(__dirname, 'test_store.json');

async function runTests() {
  console.log('--- Starting jsonStore.test.js ---');

  // Cleanup before starting
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }
  invalidateCache();

  // Test 1: Write and Read Deep Clone
  await writeJson(testFile, { count: 1, nested: { value: 'A' } });
  
  const data1 = await readJson(testFile);
  assert.strictEqual(data1.count, 1);
  
  // Mutate data1, should not affect cache
  data1.count = 2;
  data1.nested.value = 'B';
  
  const data2 = await readJson(testFile);
  assert.strictEqual(data2.count, 1, 'Cache was mutated! Deep clone failed.');
  assert.strictEqual(data2.nested.value, 'A', 'Cache nested object was mutated! Deep clone failed.');
  console.log('✅ Test 1 Passed: Deep clone cache isolation');

  // Test 2: Concurrent Writes with Promise Mutex
  console.log('Starting concurrent writes...');
  const promises = [];
  for (let i = 1; i <= 20; i++) {
    // The promise loop starts 20 concurrent write requests
    promises.push(writeJson(testFile, { iteration: i }));
  }
  
  await Promise.all(promises);
  
  const data3 = await readJson(testFile);
  assert.ok(data3.iteration > 0 && data3.iteration <= 20, 'Concurrent write failed to persist correct JSON structure');
  
  // Also verify file on disk
  const content = fs.readFileSync(testFile, 'utf8');
  const diskData = JSON.parse(content);
  assert.strictEqual(diskData.iteration, data3.iteration, 'Disk and cache are out of sync');
  console.log('✅ Test 2 Passed: Concurrent async writes resolved without file corruption');

  // Cleanup
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }
  console.log('--- All tests passed! ---');
}

runTests().catch(err => {
  console.error('❌ Test failed!', err);
  process.exit(1);
});
