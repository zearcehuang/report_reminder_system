/**
 * gemini_and_encryption.test.js
 * Verification suite for AES-256-GCM encryption, Settings management, and Gemini AI Document Recognition.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const cryptoService = require('../services/cryptoService');
const settingService = require('../services/settingService');
const AiContractParser = require('../AiContractParser');
const { parseDocumentItems } = require('../services/docxExtractor');

async function runTestSuite() {
  console.log('🧪 Starting Gemini AI & AES-256-GCM Encryption Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${e.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${e.message}`);
      failed++;
    }
  }

  // 1. Crypto Service Tests
  console.log('📦 [1. Crypto Service: AES-256-GCM]');
  test('Encrypts and decrypts sensitive plain text correctly', () => {
    const rawApiKey = 'AIzaSyDemoSampleKey1234567890ABCDEF';
    const encryptedBundle = cryptoService.encrypt(rawApiKey);

    assert(typeof encryptedBundle === 'string', 'Encrypted bundle should be string');
    assert(encryptedBundle.includes(':'), 'Bundle should contain delimiters');
    const parts = encryptedBundle.split(':');
    assert.strictEqual(parts.length, 3, 'Bundle should have iv:tag:ciphertext (3 parts)');
    assert.notStrictEqual(parts[2], rawApiKey, 'Ciphertext must not be plaintext');

    const decrypted = cryptoService.decrypt(encryptedBundle);
    assert.strictEqual(decrypted, rawApiKey, 'Decrypted value should match original');
  });

  test('Masks API key securely without revealing secret characters', () => {
    const rawKey = 'AIzaSyD9876543210ABCDEF_XYZ99';
    const masked = cryptoService.maskApiKey(rawKey);
    assert(masked.startsWith('AIzaSy'), 'Should show prefix for user identification');
    assert(masked.includes('****'), 'Should mask internal secret');
    assert(masked.endsWith('Z99'), 'Should show suffix for user verification');
    assert(!masked.includes('9876543210'), 'Internal secret must never be present');
  });

  test('Gracefully handles tampered or invalid cipher bundles', () => {
    const tampered = '00112233:44556677:8899aabb';
    const result = cryptoService.decrypt(tampered);
    assert.strictEqual(result, '', 'Decryption of corrupted payload should return empty string');
  });

  // 2. Settings Service Tests
  console.log('\n⚙️ [2. System Settings & Gemini Config]');
  await asyncTest('Saves encrypted Gemini key and reads masked public settings', async () => {
    const testKey = 'AIzaSyTest_Auto_Generated_Key_2026';
    await settingService.updateSettings({
      geminiApiKey: testKey,
      geminiModel: 'gemini-2.0-flash',
      autoUseGemini: true,
      temperature: 0.2
    });

    const publicSettings = await settingService.getPublicSettings();
    assert.strictEqual(publicSettings.hasGeminiApiKey, true);
    assert(publicSettings.geminiApiKeyMasked.includes('****'));
    assert(!publicSettings.geminiApiKeyMasked.includes('Test_Auto_Generated'));
    assert.strictEqual(publicSettings.geminiModel, 'gemini-2.0-flash');
    assert.strictEqual(publicSettings.autoUseGemini, true);

    const internalKey = settingService.getDecryptedGeminiKey();
    assert.strictEqual(internalKey, testKey, 'Backend should be able to decrypt the key for LLM calls');
  });

  await asyncTest('Connection test responds appropriately with invalid dummy key', async () => {
    const result = await settingService.testGeminiConnection('AIzaSy_Invalid_Dummy_Key_For_Test', 'gemini-2.0-flash');
    assert.strictEqual(result.success, false, 'Invalid key should fail cleanly');
    assert(result.error && typeof result.error === 'string', 'Should return descriptive error');
  });

  await asyncTest('fetchAvailableGeminiModels returns latest generation models list', async () => {
    const modelsResult = await settingService.fetchAvailableGeminiModels();
    assert.strictEqual(modelsResult.success, true);
    assert(Array.isArray(modelsResult.models), 'Should return models array');
    assert(modelsResult.models.length >= 3, 'Should contain at least 3 models');
    const hasFlash2 = modelsResult.models.some(m => m.id.includes('2.0-flash') || m.id.includes('flash'));
    assert(hasFlash2, 'Should include Gemini 2.0 / Flash models');
  });

  // 3. Document Parser & 5-Dimension Extraction Tests
  console.log('\n📄 [3. AI Contract Parser & Heuristic Fallback]');
  test('Heuristic 5-dimension engine extracts key contract milestones offline', () => {
    const sampleContractText = `
      專案工作條款：
      第一條：廠商應於簽約後 D+30 日內提送「專案詳細執行計畫書 (PEP)」。
      第二條：廠商應於 D+60 日內提送「系統架構與詳細設計規格書」。
      第三條：廠商應於 D+120 日內完成「系統開發與單元/整合測試報告」。
      第四條：廠商若逾期交付，每日按合約總價千分之一計罰違約金。
    `;

    const items = AiContractParser.parse(sampleContractText, '台北市政府委託合約.docx');
    assert(items.length >= 3, `Expected at least 3 milestones, got ${items.length}`);

    const pepItem = items.find(i => i.title.includes('專案詳細執行計畫書'));
    assert(pepItem, 'Should find PEP milestone');
    assert.strictEqual(pepItem.dayOffset, 30, 'Should parse D+30 offset');
    assert(Array.isArray(pepItem.deliverables), 'Deliverables should be an array');
    assert(pepItem.penaltyTerms.includes('千分之一'), 'Should contain penalty terms');
    assert(pepItem.clauseReference.length > 0, 'Should have clause reference');
    assert.strictEqual(pepItem.source, 'rule_heuristic', 'Source tag should indicate rule_heuristic');
  });

  await asyncTest('parseDocumentItems extracts 5-dimension milestones with dates and fallback', async () => {
    const sampleDocPath = path.join(__dirname, '..', '..', 'data', '臺北市政府民政局115年度維護案-企劃書 0317v1.1.docx');
    const dummyPath = path.join(__dirname, 'temp_test_doc.txt');
    fs.writeFileSync(dummyPath, `
      合約條文履約期程：
      1. 簽約後 D+30 天內提送 專案詳細執行計畫書 (PEP)
      2. 簽約後 D+90 天內提送 系統期中維護進度報告
      3. 簽約後 D+240 天內提送 全案驗收與結案交接報告
    `, 'utf8');

    try {
      const items = await parseDocumentItems(dummyPath, 'temp_test_doc.txt', '2026-09-01');
      assert(items.length > 0, 'Should parse extracted items');
      items.forEach(item => {
        assert(item.title, 'Item must have title');
        assert(item.date, 'Item must have calculated target date');
        assert(item.deliverables && item.deliverables.length > 0, 'Item must have deliverables');
        assert(item.penaltyTerms, 'Item must have penalty terms');
        assert(item.clauseReference, 'Item must have clause reference');
        assert(item.source, 'Item must have recognition engine source tag');
      });
    } finally {
      if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    }
  });

  console.log(`\n================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});
