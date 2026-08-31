const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

function createSchedulerRouter(schedulerService) {
  const router = express.Router();

  router.get('/status', requireAuth, (req, res) => {
    res.json(schedulerService.getStatus());
  });

  const handleRunNow = asyncHandler(async (req, res) => {
    const result = await schedulerService.runScanAndNotify();
    res.json({ success: true, message: '已成功手動啟動即時掃描與通知檢測', notifyCount: result.notifyCount, result });
  });

  router.post('/run-now', requirePermission('system:admin'), handleRunNow);
  router.post('/trigger', requirePermission('system:admin'), handleRunNow);

  return router;
}

module.exports = createSchedulerRouter;
