const fs = require('fs');
const path = require('path');
const { readJsonSync, writeJsonSync } = require('./jsonStore');
const { hashPassword } = require('./passwordService');
const { parseOutlookCsvText } = require('./csvParser');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const HOLIDAYS_FILE = path.join(DATA_DIR, 'holidays.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ROLES_FILE = path.join(DATA_DIR, 'roles.json');
const AEB_CSV_FILE = path.join(DATA_DIR, 'aeb.CSV');

const NOTIFICATION_LOGS_FILE = path.join(DATA_DIR, 'notification_logs.json');
const ERROR_LOG_FILE = path.join(DATA_DIR, 'error.log');

function initSeedData(forceReset = false) {
  if (forceReset) {
    if (fs.existsSync(PROJECTS_FILE)) fs.unlinkSync(PROJECTS_FILE);
    if (fs.existsSync(CONTACTS_FILE)) fs.unlinkSync(CONTACTS_FILE);
    if (fs.existsSync(USERS_FILE)) fs.unlinkSync(USERS_FILE);
    if (fs.existsSync(ROLES_FILE)) fs.unlinkSync(ROLES_FILE);
    if (fs.existsSync(HOLIDAYS_FILE)) fs.unlinkSync(HOLIDAYS_FILE);
    writeJsonSync(NOTIFICATION_LOGS_FILE, []);
    if (fs.existsSync(ERROR_LOG_FILE)) fs.writeFileSync(ERROR_LOG_FILE, '', 'utf8');
  }

  const projects = readJsonSync(PROJECTS_FILE, null);
  if (!projects || projects.length === 0) {
    const defaultProject = {
      id: 'PRJ-2026-ALPHA',
      projectCode: 'PRJ-2026-ALPHA',
      projectName: 'AI 智慧客服平台建置案',
      dDay: '2026-09-01',
      advanceDays: 3,
      ownerName: '張小明 (PM)',
      ownerEmail: 'alex.chang@company.com',
      projectOwners: [
        { id: 'po-1', role: 'PM (專案經理)', name: '張小明', email: 'alex.chang@company.com' },
        { id: 'po-2', role: '業務 (Sales)', name: '陳經理', email: 'sales.chen@company.com' },
        { id: 'po-3', role: 'SA (系統分析師)', name: '李大華', email: 'david.lee@company.com' },
        { id: 'po-4', role: 'QA (測試經理)', name: '陳美玲', email: 'meiling.chen@company.com' }
      ],
      teamsWebhookUrl: 'https://outlook.office.com/webhook/sample-key-12345',
      rules: [
        { id: '1', projectId: 'PRJ-2026-ALPHA', title: '啟動會議報告與記錄', dayOffset: 7, owners: ['[PM] 張小明 (alex.chang@company.com)', '[業務] 陳經理 (sales.chen@company.com)'], enabled: true, isCompleted: false },
        { id: '2', projectId: 'PRJ-2026-ALPHA', title: '專案執行計畫書 (PEP)', dayOffset: 14, owners: ['[PM] 張小明 (alex.chang@company.com)', '[SA] 李大華 (david.lee@company.com)'], enabled: true, isCompleted: false },
        { id: '3', projectId: 'PRJ-2026-ALPHA', title: '需求規格確認書 (SRS)', dayOffset: 30, owners: ['[SA] 李大華 (david.lee@company.com)', '陳美玲 (meiling.chen@company.com)'], enabled: true, isCompleted: false },
        { id: '4', projectId: 'PRJ-2026-ALPHA', title: '系統架構與詳細設計書', dayOffset: 60, owners: ['[SA] 李大華 (david.lee@company.com)'], enabled: true, isCompleted: false },
        { id: '5', projectId: 'PRJ-2026-ALPHA', title: '月度進度報告 (一)', dayOffset: 90, owners: ['[PM] 張小明 (alex.chang@company.com)'], enabled: true, isCompleted: false },
        { id: '6', projectId: 'PRJ-2026-ALPHA', title: '系統開發與測試報告', dayOffset: 120, owners: ['陳美玲 (meiling.chen@company.com)'], enabled: true, isCompleted: false },
        { id: '7', projectId: 'PRJ-2026-ALPHA', title: '教育訓練與使用者手冊', dayOffset: 150, owners: ['[PM] 張小明 (alex.chang@company.com)'], enabled: true, isCompleted: false },
        { id: '8', projectId: 'PRJ-2026-ALPHA', title: '期中成果報告 Draft', dayOffset: 180, owners: ['[PM] 張小明 (alex.chang@company.com)', '[SA] 李大華 (david.lee@company.com)'], enabled: true, isCompleted: false },
        { id: '9', projectId: 'PRJ-2026-ALPHA', title: '系統上線準備文件', dayOffset: 210, owners: ['[SA] 李大華 (david.lee@company.com)'], enabled: true, isCompleted: false },
        { id: '10', projectId: 'PRJ-2026-ALPHA', title: '結案驗收文件', dayOffset: 240, owners: ['[PM] 張小明 (alex.chang@company.com)', '陳美玲 (meiling.chen@company.com)'], enabled: true, isCompleted: false }
      ],
      explicitDeadlines: []
    };
    writeJsonSync(PROJECTS_FILE, [defaultProject]);
  }

  let contacts = readJsonSync(CONTACTS_FILE, null);
  if (!contacts || contacts.length === 0) {
    const defaultContacts = [
      { id: 'c1', name: '張小明', email: 'alex.chang@company.com', department: '專案管理部', title: '專案經理 (PM)' },
      { id: 'c2', name: '李大華', email: 'david.lee@company.com', department: '架構設計部', title: '資深系統架構師' },
      { id: 'c3', name: '陳美玲', email: 'meiling.chen@company.com', department: '品質保證部', title: 'QA 測試經理' },
      { id: 'c4', name: '林志豪', email: 'chihhao.lin@company.com', department: '軟體開發部', title: '全棧開發工程師' }
    ];

    let csvContacts = [];
    if (fs.existsSync(AEB_CSV_FILE)) {
      try {
        const csvContent = fs.readFileSync(AEB_CSV_FILE, 'utf8');
        csvContacts = parseOutlookCsvText(csvContent);
      } catch (err) {
        console.error('Failed to parse aeb.CSV:', err);
      }
    }

    const merged = [...defaultContacts];
    const seenEmails = new Set(defaultContacts.map(c => c.email.toLowerCase()));

    csvContacts.forEach(c => {
      if (c.email && !seenEmails.has(c.email.toLowerCase())) {
        seenEmails.add(c.email.toLowerCase());
        merged.push(c);
      }
    });

    contacts = merged;
    writeJsonSync(CONTACTS_FILE, contacts);
  }

  const holidays = readJsonSync(HOLIDAYS_FILE, null);
  if (!holidays || holidays.length === 0) {
    const defaultHolidays = [
      { date: '2026-01-01', description: '開國紀念日 (元旦)', isWorkday: false, source: 'DGPA' },
      { date: '2026-02-16', description: '除夕', isWorkday: false, source: 'DGPA' },
      { date: '2026-02-17', description: '春節', isWorkday: false, source: 'DGPA' },
      { date: '2026-02-28', description: '和平紀念日', isWorkday: false, source: 'DGPA' },
      { date: '2026-04-04', description: '兒童節', isWorkday: false, source: 'DGPA' },
      { date: '2026-04-05', description: '清明節', isWorkday: false, source: 'DGPA' },
      { date: '2026-06-19', description: '端午節', isWorkday: false, source: 'DGPA' },
      { date: '2026-09-25', description: '中秋節', isWorkday: false, source: 'DGPA' },
      { date: '2026-10-10', description: '國慶日', isWorkday: false, source: 'DGPA' },
      { date: '2027-01-01', description: '元旦', isWorkday: false, source: 'DGPA' },
      { date: '2027-02-06', description: '春節首日', isWorkday: false, source: 'DGPA' }
    ];
    defaultHolidays.sort((a, b) => a.date.localeCompare(b.date));
    writeJsonSync(HOLIDAYS_FILE, defaultHolidays);
  }

  const users = readJsonSync(USERS_FILE, null);
  if (!users || users.length === 0) {
    const defaultUsers = [
      {
        id: 'usr-admin-1',
        email: 'admin@company.com',
        password: hashPassword('admin123'),
        name: '系統最高管理員',
        role: 'Admin',
        department: '資訊管理處',
        title: '資深系統管理員',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-pm-1',
        email: 'alex.chang@company.com',
        password: hashPassword('pm123'),
        name: '張小明',
        role: 'PM',
        department: '專案管理一部',
        title: '專案經理 (PM)',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-auditor-1',
        email: 'auditor@company.com',
        password: hashPassword('auditor123'),
        name: '陳美玲',
        role: 'Auditor',
        department: '法務與合約稽核室',
        title: '合約查核員',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];
    writeJsonSync(USERS_FILE, defaultUsers);
  }

  const roles = readJsonSync(ROLES_FILE, null);
  if (!roles || roles.length === 0) {
    const defaultRoles = [
      {
        id: 'role-admin',
        name: 'Admin',
        description: '系統最高管理員，具備系統所有模組與權限設定全權存取權限',
        isSystem: true,
        permissions: [
          'projects:read', 'projects:write', 'projects:delete',
          'rules:write', 'schedules:submit', 'notifications:send',
          'holidays:manage', 'contacts:manage', 'system:admin'
        ]
      },
      {
        id: 'role-pm',
        name: 'PM',
        description: '專案經理，可建立與編輯專案、管理履約報告與發布會議通知',
        isSystem: true,
        permissions: [
          'projects:read', 'projects:write', 'rules:write',
          'schedules:submit', 'notifications:send', 'contacts:manage'
        ]
      },
      {
        id: 'role-auditor',
        name: 'Auditor',
        description: '合約與報告審核員，僅具備唯讀檢視與報告繳交狀態查核權限',
        isSystem: true,
        permissions: [
          'projects:read', 'schedules:submit'
        ]
      }
    ];
    writeJsonSync(ROLES_FILE, defaultRoles);
  }
}

if (require.main === module) {
  const forceReset = process.argv.includes('--reset') || process.argv.includes('-f');
  console.log(forceReset ? '🧹 Resetting and re-initializing project seed data...' : '🌱 Initializing project seed data...');
  initSeedData(forceReset);
  console.log('✅ Seed data initialized successfully.');
}

module.exports = { initSeedData };

module.exports = { initSeedData };
