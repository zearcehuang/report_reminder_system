const path = require('path');
const { readJsonSync, writeJsonSync } = require('./jsonStore');
const { hashPassword } = require('./passwordService');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const HOLIDAYS_FILE = path.join(DATA_DIR, 'holidays.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ROLES_FILE = path.join(DATA_DIR, 'roles.json');

function initSeedData() {
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
        { id: 'po-3', role: 'SA (系統分析師)', name: '李大華', email: 'david.lee@company.com' }
      ],
      teamsWebhookUrl: 'https://outlook.office.com/webhook/sample-key-12345',
      rules: [
        { id: '1', title: '啟動會議報告與記錄', dayOffset: 7, owners: ['[PM] 張小明 (alex.chang@company.com)', '[業務] 陳經理 (sales.chen@company.com)'], isCompleted: false },
        { id: '2', title: '專案執行計畫書 (PEP)', dayOffset: 14, owners: ['[PM] 張小明 (alex.chang@company.com)', '[SA] 李大華 (david.lee@company.com)'], isCompleted: false },
        { id: '3', title: '需求規格確認書 (SRS)', dayOffset: 30, owners: ['[SA] 李大華 (david.lee@company.com)', '陳美玲 (meiling.chen@company.com)'], isCompleted: false },
        { id: '4', title: '系統架構與詳細設計書', dayOffset: 60, owners: ['[SA] 李大華 (david.lee@company.com)'], isCompleted: false },
        { id: '5', title: '月度進度報告 (一)', dayOffset: 90, owners: ['[PM] 張小明 (alex.chang@company.com)'], isCompleted: false },
        { id: '6', title: '系統開發與測試報告', dayOffset: 120, owners: ['陳美玲 (meiling.chen@company.com)'], isCompleted: false },
        { id: '7', title: '教育訓練與使用者手冊', dayOffset: 150, owners: ['[PM] 張小明 (alex.chang@company.com)'], isCompleted: false },
        { id: '8', title: '期中成果報告 Draft', dayOffset: 180, owners: ['[PM] 張小明 (alex.chang@company.com)', '[SA] 李大華 (david.lee@company.com)'], isCompleted: false },
        { id: '9', title: '系統上線準備文件', dayOffset: 210, owners: ['[SA] 李大華 (david.lee@company.com)'], isCompleted: false },
        { id: '10', title: '結案驗收文件', dayOffset: 240, owners: ['[PM] 張小明 (alex.chang@company.com)', '陳美玲 (meiling.chen@company.com)'], isCompleted: false }
      ],
      explicitDeadlines: []
    };
    writeJsonSync(PROJECTS_FILE, [defaultProject]);
  }

  const contacts = readJsonSync(CONTACTS_FILE, null);
  if (!contacts || contacts.length === 0) {
    const defaultContacts = [
      { id: 'c1', name: '張小明', email: 'alex.chang@company.com', department: '專案管理部', title: '專案經理 (PM)' },
      { id: 'c2', name: '李大華', email: 'david.lee@company.com', department: '架構設計部', title: '資深系統架構師' },
      { id: 'c3', name: '陳美玲', email: 'meiling.chen@company.com', department: '品質保證部', title: 'QA 測試經理' },
      { id: 'c4', name: '林志豪', email: 'chihhao.lin@company.com', department: '軟體開發部', title: '全棧開發工程師' }
    ];
    writeJsonSync(CONTACTS_FILE, defaultContacts);
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

module.exports = { initSeedData };
