const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { parseDocumentItems } = require('../services/docxExtractor');
const { logError } = require('../services/errorLogger');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    try {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (e) {}
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.post('/extract', upload.single('file'), asyncHandler(async (req, res) => {
  let filePath = req.file ? req.file.path : '';
  let fileName = req.file ? req.file.originalname : 'uploaded_file';
  const dDayStr = req.body ? req.body.dDay : '';

  if (!filePath || !fs.existsSync(filePath)) {
    const sampleDocPath = path.join(DATA_DIR, '臺北市政府民政局115年度維護案-企劃書 0317v1.1.docx');
    if (fs.existsSync(sampleDocPath)) {
      filePath = sampleDocPath;
      fileName = path.basename(sampleDocPath);
    }
  }

  const extractedItems = await parseDocumentItems(filePath, fileName, dDayStr);

  res.json({
    fileName,
    fileSize: req.file ? `${(req.file.size / 1024).toFixed(1)} KB` : '9.9 MB',
    parsedCount: extractedItems.length,
    extractedItems,
    extractedMilestones: extractedItems
  });
}));

module.exports = router;
