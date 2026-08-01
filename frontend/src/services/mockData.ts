/**
 * mockData.ts
 * Centralized mock / fallback data for offline mode.
 * Extracted from api.ts to improve maintainability and keep API service focused on network logic.
 */

import type {
  Project,
  MilestoneRule,
  Holiday,
  Contact,
} from '../types';

// Pre-loaded default projects
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'prj-001',
    code: 'PRJ-001',
    name: 'AI 客服平台建立案',
    dDay: '2026-08-01',
    advanceNoticeDays: 7,
    advanceNoticeDaysList: [1, 3, 7],
    ownerName: '張小明 (PM)',
    ownerEmail: 'alex.chang@company.com',
    projectOwners: [
      { id: 'po-1', role: 'PM (專案經理)', name: '張小明', email: 'alex.chang@company.com' },
      { id: 'po-2', role: '業務 (Sales)', name: '陳經理', email: 'sales.chen@company.com' },
      { id: 'po-3', role: 'SA (系統分析師)', name: '李大華', email: 'david.lee@company.com' },
    ],
    status: 'active',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prj-002',
    code: 'PRJ-002',
    name: '雲端架構移轉與資安強化案',
    dDay: '2026-09-15',
    advanceNoticeDays: 5,
    advanceNoticeDaysList: [1, 3, 5],
    ownerName: '李大華 (架構師)',
    ownerEmail: 'david.lee@company.com',
    projectOwners: [
      { id: 'po-4', role: '架構師', name: '李大華', email: 'david.lee@company.com' },
      { id: 'po-5', role: 'PM', name: '林志豪', email: 'chihhao.lin@company.com' },
    ],
    status: 'active',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prj-003',
    code: 'PRJ-003',
    name: '智慧醫療數據分析與視覺化系統',
    dDay: '2026-10-01',
    advanceNoticeDays: 10,
    advanceNoticeDaysList: [3, 7, 14],
    ownerName: '陳美玲 (QA)',
    ownerEmail: 'meiling.chen@company.com',
    projectOwners: [
      { id: 'po-6', role: 'QA (測試)', name: '陳美玲', email: 'meiling.chen@company.com' }
    ],
    status: 'draft',
    updatedAt: new Date().toISOString(),
  },
];

// Pre-loaded 10 milestone slots as required:
// 啟動會議報告, 專案執行計畫書, 月報(一), 月報(二), 期中報告, 月報(三), 月報(四), 期末報告 Draft, 期末報告 Final, 驗收文件
export const MOCK_DEFAULT_RULES: MilestoneRule[] = [
  { id: 'rule-1', projectId: 'prj-001', title: '啟動會議報告', dayOffset: 14, owners: ['pm.alex@company.com', 'lead.tech@company.com'], enabled: true },
  { id: 'rule-2', projectId: 'prj-001', title: '專案執行計畫書', dayOffset: 30, owners: ['pm.alex@company.com'], enabled: true },
  { id: 'rule-3', projectId: 'prj-001', title: '月報 (一)', dayOffset: 60, owners: ['reporter.sam@company.com'], enabled: true },
  { id: 'rule-4', projectId: 'prj-001', title: '月報 (二)', dayOffset: 90, owners: ['reporter.sam@company.com'], enabled: true },
  { id: 'rule-5', projectId: 'prj-001', title: '期中報告', dayOffset: 120, owners: ['pm.alex@company.com', 'qa.manager@company.com'], enabled: true },
  { id: 'rule-6', projectId: 'prj-001', title: '月報 (三)', dayOffset: 150, owners: ['reporter.sam@company.com'], enabled: true },
  { id: 'rule-7', projectId: 'prj-001', title: '月報 (四)', dayOffset: 180, owners: ['reporter.sam@company.com'], enabled: true },
  { id: 'rule-8', projectId: 'prj-001', title: '期末報告 Draft', dayOffset: 210, owners: ['pm.alex@company.com', 'director.chen@company.com'], enabled: true },
  { id: 'rule-9', projectId: 'prj-001', title: '期末報告 Final', dayOffset: 240, owners: ['pm.alex@company.com', 'director.chen@company.com'], enabled: true },
  { id: 'rule-10', projectId: 'prj-001', title: '驗收文件與結案報告', dayOffset: 270, owners: ['pm.alex@company.com', 'finance.admin@company.com'], enabled: true },
];

export const MOCK_HOLIDAYS: Holiday[] = [
  { id: 'h-1', date: '2026-01-01', name: '開國紀念日 (元旦)', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'w-1', date: '2026-02-07', name: '2026 補行上班 (春節連假彈性放假補班)', isHoliday: false, isWorkday: true, category: 'DGPA' },
  { id: 'h-2', date: '2026-02-16', name: '農曆除夕', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'h-3', date: '2026-02-17', name: '春節連假', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'h-4', date: '2026-02-18', name: '春節連假', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'h-5', date: '2026-02-19', name: '春節連假', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'h-6', date: '2026-02-28', name: '和平紀念日', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'h-7', date: '2026-04-04', name: '兒童節與清明節', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'h-8', date: '2026-06-19', name: '端午節', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'w-2', date: '2026-09-19', name: '2026 補行上班 (中秋節連假彈性放假補班)', isHoliday: false, isWorkday: true, category: 'DGPA' },
  { id: 'h-9', date: '2026-09-25', name: '中秋節', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'h-10', date: '2026-10-10', name: '國慶日', isHoliday: true, isWorkday: false, category: 'DGPA' },
  { id: 'w-3', date: '2027-02-20', name: '2027 補行上班 (春節連假補班)', isHoliday: false, isWorkday: true, category: 'DGPA' },
];

export const MOCK_CONTACTS: Contact[] = [
  { id: 'c-1', name: 'Alex Wang (專案經理)', email: 'pm.alex@company.com', department: '專案管理部', role: 'Project Manager' },
  { id: 'c-2', name: 'Sam Lin (高級分析師)', email: 'reporter.sam@company.com', department: '研發部', role: 'Senior Analyst' },
  { id: 'c-3', name: 'David Chen (技術總監)', email: 'director.chen@company.com', department: '技術部', role: 'Tech Lead' },
  { id: 'c-4', name: 'Jessica Lee (品質經理)', email: 'qa.manager@company.com', department: '品保部', role: 'QA Manager' },
  { id: 'c-5', name: 'Emily Huang (財務主管)', email: 'finance.admin@company.com', department: '財務部', role: 'Finance Supervisor' },
];
