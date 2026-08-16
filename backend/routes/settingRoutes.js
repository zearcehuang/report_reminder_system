/**
 * settingRoutes.js
 * API routes for managing encrypted system settings and Gemini AI integration.
 */

const express = require('express');
const router = express.Router();
const settingService = require('../services/settingService');
const { requireRole, requirePermission } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/settings - Retrieve public settings (masked API keys)
router.get('/', asyncHandler(async (req, res) => {
  const settings = await settingService.getPublicSettings();
  res.json({
    success: true,
    settings
  });
}));

// POST /api/settings - Update system settings (requires Admin or PM)
router.post('/', requireRole(['Admin', 'PM']), asyncHandler(async (req, res) => {
  const { geminiApiKey, geminiModel, autoUseGemini, temperature } = req.body;

  const updated = await settingService.updateSettings({
    geminiApiKey,
    geminiModel,
    autoUseGemini,
    temperature
  });

  res.json({
    success: true,
    message: '系統設定已成功加密儲存',
    settings: updated
  });
}));

// GET /api/settings/gemini-models - Fetch available generation models from Google API
router.get('/gemini-models', asyncHandler(async (req, res) => {
  const candidateKey = req.query.apiKey || '';
  const result = await settingService.fetchAvailableGeminiModels(candidateKey);
  res.json(result);
}));

// POST /api/settings/test-gemini - Test connection to Gemini API
router.post('/test-gemini', asyncHandler(async (req, res) => {
  const { apiKey, model } = req.body || {};
  const result = await settingService.testGeminiConnection(apiKey, model);
  res.json(result);
}));

module.exports = router;
