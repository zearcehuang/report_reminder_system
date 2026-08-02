const express = require('express');
const path = require('path');
const { readJsonSync, writeJsonSync } = require('../services/jsonStore');
const { requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const HOLIDAYS_FILE = path.join(DATA_DIR, 'holidays.json');

// Get holidays list
router.get('/', (req, res) => {
  const holidays = readJsonSync(HOLIDAYS_FILE, []);
  holidays.sort((a, b) => a.date.localeCompare(b.date));
  res.json(holidays);
});

// Sync DGPA holidays
router.post('/sync-dgpa', requirePermission('holidays:manage'), (req, res) => {
  const holidays = readJsonSync(HOLIDAYS_FILE, []);
  const year = req.body.year || 2026;
  const dgpaData = [
    { date: `${year}-01-01`, description: `${year} 中華民國開國紀念日`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-02-07`, description: `${year} 補行上班 (春節連假彈性放假補班)`, isWorkday: true, source: 'DGPA' },
    { date: `${year}-02-16`, description: `${year} 除夕`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-02-17`, description: `${year} 春節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-02-28`, description: `${year} 和平紀念日`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-04-04`, description: `${year} 兒童節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-04-05`, description: `${year} 清明節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-06-19`, description: `${year} 端午節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-09-19`, description: `${year} 補行上班 (中秋節連假彈性放假補班)`, isWorkday: true, source: 'DGPA' },
    { date: `${year}-09-25`, description: `${year} 中秋節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-10-10`, description: `${year} 國慶日`, isWorkday: false, source: 'DGPA' }
  ];

  dgpaData.forEach(item => {
    const existingIdx = holidays.findIndex(h => h.date === item.date);
    if (existingIdx >= 0) {
      holidays[existingIdx] = item;
    } else {
      holidays.push(item);
    }
  });

  holidays.sort((a, b) => a.date.localeCompare(b.date));
  writeJsonSync(HOLIDAYS_FILE, holidays);
  res.json({ success: true, count: dgpaData.length, holidays });
});

module.exports = router;
