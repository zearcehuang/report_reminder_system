const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const HOLIDAYS_FILE = path.join(DATA_DIR, 'holidays.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// File Upload Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Helper Functions
function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Initial Data Seed
function initSeedData() {
  const projects = readJson(PROJECTS_FILE, null);
  if (!projects || projects.length === 0) {
    const defaultProject = {
      id: 'PRJ-2026-ALPHA',
      projectCode: 'PRJ-2026-ALPHA',
      projectName: 'AI 智慧客服平台建置案',
      dDay: '2026-09-01',
      advanceDays: 3,
      teamsWebhookUrl: 'https://outlook.office.com/webhook/sample-key-12345',
      rules: [
        { id: '1', title: '啟動會議報告與記錄', dayOffset: 7, owners: ['張小明 (PM)'], isCompleted: false },
        { id: '2', title: '專案執行計畫書 (PEP)', dayOffset: 14, owners: ['張小明 (PM)', '李大華 (架構師)'], isCompleted: false },
        { id: '3', title: '需求規格確認書 (SRS)', dayOffset: 30, owners: ['李大華 (架構師)', '陳美玲 (QA)'], isCompleted: false },
        { id: '4', title: '系統架構與詳細設計書', dayOffset: 60, owners: ['李大華 (架構師)'], isCompleted: false },
        { id: '5', title: '月度進度報告 (一)', dayOffset: 90, owners: ['張小明 (PM)'], isCompleted: false },
        { id: '6', title: '系統開發與測試報告', dayOffset: 120, owners: ['陳美玲 (QA)'], isCompleted: false },
        { id: '7', title: '教育訓練與使用者手冊', dayOffset: 150, owners: ['張小明 (PM)'], isCompleted: false },
        { id: '8', title: '期中成果報告 Draft', dayOffset: 180, owners: ['張小明 (PM)', '李大華 (架構師)'], isCompleted: false },
        { id: '9', title: '系統上線準備文件', dayOffset: 210, owners: ['李大華 (架構師)'], isCompleted: false },
        { id: '10', title: '結案驗收文件', dayOffset: 240, owners: ['張小明 (PM)', '陳美玲 (QA)'], isCompleted: false }
      ],
      explicitDeadlines: []
    };
    writeJson(PROJECTS_FILE, [defaultProject]);
  }

  const contacts = readJson(CONTACTS_FILE, null);
  if (!contacts || contacts.length === 0) {
    const defaultContacts = [
      { id: 'c1', name: '張小明', email: 'alex.chang@company.com', department: '專案管理部', title: '專案經理 (PM)' },
      { id: 'c2', name: '李大華', email: 'david.lee@company.com', department: '架構設計部', title: '資深系統架構師' },
      { id: 'c3', name: '陳美玲', email: 'meiling.chen@company.com', department: '品質保證部', title: 'QA 測試經理' },
      { id: 'c4', name: '林志豪', email: 'chihhao.lin@company.com', department: '軟體開發部', title: '全棧開發工程師' }
    ];
    writeJson(CONTACTS_FILE, defaultContacts);
  }

  const holidays = readJson(HOLIDAYS_FILE, null);
  if (!holidays || holidays.length === 0) {
    const defaultHolidays = [
      { date: '2026-09-25', description: '中秋節', isWorkday: false, source: 'DGPA' },
      { date: '2026-10-10', description: '國慶日', isWorkday: false, source: 'DGPA' },
      { date: '2027-01-01', description: '元旦', isWorkday: false, source: 'DGPA' },
      { date: '2027-02-06', description: '春節首日', isWorkday: false, source: 'DGPA' }
    ];
    writeJson(HOLIDAYS_FILE, defaultHolidays);
  }
}
initSeedData();

// Taiwan Workday Calculator
function isWorkday(dateStr, holidays) {
  const holidayObj = holidays.find(h => h.date === dateStr);
  if (holidayObj) return holidayObj.isWorkday;
  const date = new Date(dateStr);
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function getPreviousWorkday(dateStr, holidays) {
  let curr = new Date(dateStr);
  while (true) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    if (isWorkday(iso, holidays)) {
      return iso;
    }
    curr.setDate(curr.getDate() - 1);
  }
}

// API Routes

// Projects CRUD
app.get('/api/projects', (req, res) => {
  const projects = readJson(PROJECTS_FILE, []);
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const projects = readJson(PROJECTS_FILE, []);
  const newProj = {
    id: req.body.id || `PRJ-${Date.now()}`,
    projectCode: req.body.projectCode || 'PRJ-NEW',
    projectName: req.body.projectName || '未命名專案',
    dDay: req.body.dDay || new Date().toISOString().split('T')[0],
    advanceDays: req.body.advanceDays || 3,
    teamsWebhookUrl: req.body.teamsWebhookUrl || '',
    rules: req.body.rules || [],
    explicitDeadlines: []
  };
  projects.push(newProj);
  writeJson(PROJECTS_FILE, projects);
  res.json(newProj);
});

app.put('/api/projects/:id', (req, res) => {
  const projects = readJson(PROJECTS_FILE, []);
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  projects[index] = { ...projects[index], ...req.body };
  writeJson(PROJECTS_FILE, projects);
  res.json(projects[index]);
});

app.delete('/api/projects/:id', (req, res) => {
  let projects = readJson(PROJECTS_FILE, []);
  projects = projects.filter(p => p.id !== req.params.id);
  writeJson(PROJECTS_FILE, projects);
  res.json({ success: true });
});

// Schedule Calculation
app.get('/api/projects/:id/schedules', (req, res) => {
  const projects = readJson(PROJECTS_FILE, []);
  const holidays = readJson(HOLIDAYS_FILE, []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });

  const dDay = new Date(proj.dDay);
  const items = [];

  // D+N Rules
  (proj.rules || []).forEach(rule => {
    const deadline = new Date(dDay);
    deadline.setDate(deadline.getDate() + rule.dayOffset);
    const deadlineIso = deadline.toISOString().split('T')[0];

    const targetNoticeDate = new Date(deadline);
    targetNoticeDate.setDate(targetNoticeDate.getDate() - (proj.advanceDays || 3));
    const targetNoticeIso = targetNoticeDate.toISOString().split('T')[0];

    const actualNoticeIso = getPreviousWorkday(targetNoticeIso, holidays);
    const isShifted = actualNoticeIso !== targetNoticeIso;

    items.push({
      id: rule.id,
      title: rule.title,
      dayOffset: rule.dayOffset,
      deadlineDate: deadlineIso,
      noticeDate: actualNoticeIso,
      rawNoticeDate: targetNoticeIso,
      isHolidayShifted: isShifted,
      owners: rule.owners || [],
      isCompleted: !!rule.isCompleted,
      source: 'D+N Rule',
      status: rule.isCompleted ? 'Submitted' : 'Pending'
    });
  });

  // Explicit Document Deadlines
  (proj.explicitDeadlines || []).forEach(exp => {
    const deadlineIso = exp.date;
    const targetNoticeDate = new Date(deadlineIso);
    targetNoticeDate.setDate(targetNoticeDate.getDate() - (proj.advanceDays || 3));
    const targetNoticeIso = targetNoticeDate.toISOString().split('T')[0];

    const actualNoticeIso = getPreviousWorkday(targetNoticeIso, holidays);
    const isShifted = actualNoticeIso !== targetNoticeIso;

    items.push({
      id: exp.id,
      title: exp.title,
      dayOffset: 0,
      deadlineDate: deadlineIso,
      noticeDate: actualNoticeIso,
      rawNoticeDate: targetNoticeIso,
      isHolidayShifted: isShifted,
      owners: exp.owners || [],
      isCompleted: !!exp.isCompleted,
      source: 'Explicit File Date',
      status: exp.isCompleted ? 'Submitted' : 'Pending'
    });
  });

  items.sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate));
  res.json({ project: proj, items });
});

// Rules API per project
app.get('/api/projects/:id/rules', (req, res) => {
  const projects = readJson(PROJECTS_FILE, []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });
  const rules = (proj.rules || []).map(r => ({
    id: r.id,
    projectId: proj.id,
    title: r.title,
    dayOffset: r.dayOffset,
    owners: r.owners || [],
    enabled: r.enabled !== undefined ? r.enabled : true,
    isCompleted: !!r.isCompleted
  }));
  res.json(rules);
});

app.post('/api/projects/:id/rules', (req, res) => {
  const projects = readJson(PROJECTS_FILE, []);
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  projects[index].rules = req.body;
  writeJson(PROJECTS_FILE, projects);
  res.json(req.body);
});

// Toggle Submitted
app.post('/api/schedules/:id/mark-submitted', (req, res) => {
  const projects = readJson(PROJECTS_FILE, []);
  let found = false;
  projects.forEach(proj => {
    (proj.rules || []).forEach(r => {
      if (r.id === req.params.id) {
        r.isCompleted = req.body.isCompleted !== undefined ? req.body.isCompleted : true;
        found = true;
      }
    });
    (proj.explicitDeadlines || []).forEach(e => {
      if (e.id === req.params.id) {
        e.isCompleted = req.body.isCompleted !== undefined ? req.body.isCompleted : true;
        found = true;
      }
    });
  });
  if (found) writeJson(PROJECTS_FILE, projects);
  res.json({ success: found });
});

// Document Extraction & Upload
app.post('/api/documents/extract', upload.single('file'), (req, res) => {
  const fileName = req.file ? req.file.originalname : 'uploaded_file';
  
  // Intelligent extracted mock dates based on file
  const mockExtracted = [
    {
      id: `ext-${Date.now()}-1`,
      title: `${fileName.replace(/\.[^/.]+$/, "")} - 期中驗收與進度說明`,
      date: '2026-11-15',
      confidence: 0.95,
      contextSnippet: '...本案預計於 2026/11/15 前繳交期中驗收與進度說明文件...'
    },
    {
      id: `ext-${Date.now()}-2`,
      title: `${fileName.replace(/\.[^/.]+$/, "")} - 最終結案與成果證明`,
      date: '2026-12-30',
      confidence: 0.92,
      contextSnippet: '...請廠商於 2026/12/30 前送交最終結案與成果證明文檔...'
    }
  ];

  res.json({
    fileName,
    filePath: req.file ? req.file.filename : '',
    extractedItems: mockExtracted
  });
});

// DGPA Holiday Sync & Management
app.get('/api/holidays', (req, res) => {
  const holidays = readJson(HOLIDAYS_FILE, []);
  res.json(holidays);
});

app.post('/api/holidays/sync-dgpa', (req, res) => {
  const holidays = readJson(HOLIDAYS_FILE, []);
  const year = req.body.year || 2026;
  const dgpaData = [
    { date: `${year}-01-01`, description: `${year} 中華民國開國紀念日`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-02-16`, description: `${year} 除夕`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-02-17`, description: `${year} 春節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-04-04`, description: `${year} 兒童節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-04-05`, description: `${year} 清明節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-06-19`, description: `${year} 端午節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-09-25`, description: `${year} 中秋節`, isWorkday: false, source: 'DGPA' },
    { date: `${year}-10-10`, description: `${year} 國慶日`, isWorkday: false, source: 'DGPA' }
  ];

  dgpaData.forEach(item => {
    if (!holidays.some(h => h.date === item.date)) {
      holidays.push(item);
    }
  });

  writeJson(HOLIDAYS_FILE, holidays);
  res.json({ success: true, count: dgpaData.length, holidays });
});

// Outlook CSV Parser Helper
function parseOutlookCsvText(text) {
  if (!text) return [];
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const rows = [];
  let row = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        curr += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(curr.trim());
      curr = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(curr.trim());
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
      curr = '';
    } else {
      curr += c;
    }
  }
  if (curr || row.length > 0) {
    row.push(curr.trim());
    if (row.some(cell => cell.length > 0)) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/^["'\s]+|["'\s]+$/g, ''));
  const findHeaderIdx = (names) => {
    return headers.findIndex(h => names.some(n => h.toLowerCase() === n.toLowerCase() || h.includes(n)));
  };

  const fnIdx = findHeaderIdx(['名字', 'First Name']);
  const lnIdx = findHeaderIdx(['姓氏', 'Last Name']);
  const titleNameIdx = findHeaderIdx(['稱謂', 'Suffix']);
  const compIdx = findHeaderIdx(['公司', 'Company']);
  const deptIdx = findHeaderIdx(['部門', 'Department']);
  const jobIdx = findHeaderIdx(['職稱', 'Job Title']);
  const email1Idx = findHeaderIdx(['電子郵件地址', 'E-mail Address', 'Email Address']);
  const email2Idx = findHeaderIdx(['電子郵件 2 地址', 'E-mail 2 Address']);
  const email3Idx = findHeaderIdx(['電子郵件 3 地址', 'E-mail 3 Address']);
  const dispNameIdx = findHeaderIdx(['電子郵件顯示名稱', 'E-mail Display Name']);

  const contacts = [];
  const seenEmails = new Set();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const getVal = (idx) => (idx >= 0 && idx < row.length ? row[idx].replace(/^["'\s]+|["'\s]+$/g, '') : '');

    const firstName = getVal(fnIdx);
    const lastName = getVal(lnIdx);
    const titleName = getVal(titleNameIdx);
    const company = getVal(compIdx);
    const dept = getVal(deptIdx);
    const jobTitle = getVal(jobIdx);
    const emailDispName = getVal(dispNameIdx);

    let email = getVal(email1Idx);
    if (!email || !email.includes('@') || email.startsWith('/o=')) {
      email = getVal(email2Idx);
    }
    if (!email || !email.includes('@') || email.startsWith('/o=')) {
      email = getVal(email3Idx);
    }
    if (!email || !email.includes('@') || email.startsWith('/o=')) {
      const lineStr = row.join(' ');
      const match = lineStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) email = match[0];
    }

    if (!email || !email.includes('@') || email.startsWith('/o=')) continue;
    if (seenEmails.has(email.toLowerCase())) continue;
    seenEmails.add(email.toLowerCase());

    let displayName = '';
    if (lastName || firstName) {
      const isEn = /^[A-Za-z0-9\s._-]+$/.test((lastName + firstName).trim());
      if (isEn) {
        displayName = [firstName, lastName].filter(Boolean).join(' ');
      } else {
        displayName = `${lastName}${firstName}`;
      }
      if (titleName && !displayName.includes(titleName)) {
        displayName += ` ${titleName}`;
      }
    } else if (emailDispName && emailDispName !== email && !emailDispName.startsWith('/o=')) {
      displayName = emailDispName;
    } else {
      displayName = email.split('@')[0];
    }

    const department = dept || company || '通用聯絡人';
    const title = jobTitle || '';

    contacts.push({
      id: `c-${Date.now()}-${r}`,
      name: displayName,
      email: email,
      department: department,
      title: title
    });
  }

  return contacts;
}

// Contacts & Auto-Complete
app.get('/api/contacts', (req, res) => {
  const contacts = readJson(CONTACTS_FILE, []);
  res.json(contacts);
});

app.post('/api/contacts/upload', (req, res) => {
  const contacts = readJson(CONTACTS_FILE, []);
  const newContacts = req.body || [];
  newContacts.forEach(c => {
    if (!contacts.some(item => item.email === c.email)) {
      contacts.push(c);
    }
  });
  writeJson(CONTACTS_FILE, contacts);
  res.json(contacts);
});

app.get('/api/contacts/search', (req, res) => {
  const contacts = readJson(CONTACTS_FILE, []);
  const q = (req.query.q || '').toLowerCase();
  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.email.toLowerCase().includes(q) || 
    (c.department && c.department.toLowerCase().includes(q))
  );
  res.json(filtered);
});

app.post('/api/contacts/import', upload.single('file'), (req, res) => {
  const contacts = readJson(CONTACTS_FILE, []);
  let fileText = '';
  
  if (req.file && req.file.path && fs.existsSync(req.file.path)) {
    fileText = fs.readFileSync(req.file.path, 'utf8');
  } else if (req.body && req.body.content) {
    fileText = req.body.content;
  } else {
    // If no file uploaded, try default data/aeb.CSV as fallback sample
    const samplePath = path.join(__dirname, 'data', 'aeb.CSV');
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
      // Update details if existing
      contacts[existingIndex] = { ...contacts[existingIndex], ...c };
    }
  });

  writeJson(CONTACTS_FILE, contacts);
  res.json({ success: true, addedCount, totalCount: contacts.length, contacts });
});

// Teams Notification Test & Retry
app.post('/api/notifications/test-teams', (req, res) => {
  const { projectCode, projectName, title, deadlineDate, dueDate, noticeDate, owners, advanceNoticeDaysList, customMessage } = req.body;

  const effectiveDueDate = deadlineDate || dueDate || '2026-09-08';
  const noticeList = Array.isArray(advanceNoticeDaysList) && advanceNoticeDaysList.length > 0
    ? advanceNoticeDaysList.sort((a, b) => b - a)
    : [3];

  const noticeSummaryStr = noticeList.map(days => `${days}天前`).join(', ');

  // Build Teams Adaptive Card v1.4 Payload
  const adaptiveCard = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              size: 'Medium',
              weight: 'Bolder',
              color: 'Accent',
              text: `🔔 [${projectCode || 'PRJ'}] ${projectName || '專案報告繳交提醒'}`
            },
            {
              type: 'FactSet',
              facts: [
                { title: '📌 提醒事項:', value: title || '專案里程碑報告' },
                { title: '📅 預計繳交死線:', value: effectiveDueDate },
                { title: '⏰ 多重預警頻率:', value: noticeSummaryStr },
                { title: '👤 權責負責人:', value: (owners && owners.length > 0) ? owners.join(' | ') : '全體團隊成員' }
              ]
            },
            {
              type: 'TextBlock',
              text: customMessage || '請相關權責同仁於死線前完成報告編製與審查，確保專案進度順利進行！',
              wrap: true,
              isSubtle: true
            }
          ]
        }
      }
    ]
  };

  res.json({
    success: true,
    attemptsMade: 1,
    status: 'Sent',
    message: `MS Teams Adaptive Card 測試通知已成功模擬發送 (設定多重預警: ${noticeSummaryStr})！`,
    payload: adaptiveCard
  });
});

// Serve Frontend Static Bundle if Built
const FRONTEND_DIST = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Report Reminder System Express Server running at http://localhost:${PORT}`);
});
