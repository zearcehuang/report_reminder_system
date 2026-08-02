const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');

function createSchedulerRouter(schedulerService) {
  const router = express.Router();

  router.get('/status', (req, res) => {
    res.json(schedulerService.getStatus());
  });

  router.post('/run-now', asyncHandler(async (req, res) => {
    const result = await schedulerService.runScanAndNotify();
    res.json({ success: true, message: '已成功手動啟動即時掃描與通知檢測', ...result });
  }));

  return router;
}

module.exports = createSchedulerRouter;
