const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { readJsonSync, writeJsonSync } = require('../services/jsonStore');
const { parseOutlookCsvText } = require('../services/csvParser');
const { requirePermission, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    let originalName = file.originalname;
    try {
      originalName = Buffer.from(originalName, 'latin1').toString('utf8');
    } catch (e) {}
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5\-\.]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.csv', '.txt'].includes(ext)) {
      return cb(new Error('僅支援 .csv 或 .txt 通訊錄檔案'), false);
    }
    cb(null, true);
  }
});

// Get all contacts
router.get('/', requireAuth, (req, res) => {
  const contacts = readJsonSync(CONTACTS_FILE, []);
  res.json(contacts);
});

// Search contacts
router.get('/search', requireAuth, (req, res) => {
  const contacts = readJsonSync(CONTACTS_FILE, []);
  const q = (req.query.q || '').toLowerCase();
  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.email.toLowerCase().includes(q) || 
    (c.department && c.department.toLowerCase().includes(q))
  );
  res.json(filtered);
});

// Upload contacts batch
router.post('/upload', requirePermission('contacts:manage'), (req, res) => {
  const contacts = readJsonSync(CONTACTS_FILE, []);
  const newContacts = req.body || [];
  newContacts.forEach(c => {
    if (!contacts.some(item => item.email === c.email)) {
      contacts.push(c);
    }
  });
  writeJsonSync(CONTACTS_FILE, contacts);
  res.json(contacts);
});

// Import Outlook CSV
router.post('/import', requirePermission('contacts:manage'), upload.single('file'), (req, res) => {
  const contacts = readJsonSync(CONTACTS_FILE, []);
  let fileText = '';
  
  if (req.file && req.file.path && fs.existsSync(req.file.path)) {
    fileText = fs.readFileSync(req.file.path, 'utf8');
  } else if (req.body && req.body.content) {
    fileText = req.body.content;
  } else {
    const samplePath = path.join(DATA_DIR, 'aeb.CSV');
    if (fs.existsSync(samplePath)) {
      fileText = fs.readFileSync(samplePath, 'utf8');
    }
  }

  const parsed = parseOutlookCsvText(fileText);
  let addedCount = 0;

  parsed.forEach(c => {
    const existingIndex = contacts.findIndex(item => item.email.toLowerCase() === c.email.toLowerCase());
    if (existingIndex === -1) {
      contacts.push(c);
      addedCount++;
    } else {
      contacts[existingIndex] = { ...contacts[existingIndex], ...c };
    }
  });

  writeJsonSync(CONTACTS_FILE, contacts);
  res.json({ success: true, addedCount, totalCount: contacts.length, contacts });
});

module.exports = router;
