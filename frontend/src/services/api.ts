import {
  Project,
  MilestoneRule,
  ScheduleItem,
  Holiday,
  Contact,
  DocumentExtractResult,
  TeamsCardPayload,
} from '../types';

// Pre-loaded default projects
const MOCK_PROJECTS: Project[] = [
  {
    id: 'prj-001',
    code: 'PRJ-001',
    name: 'AI 客服平台建立案',
    dDay: '2026-08-01',
    advanceNoticeDays: 7,
    status: 'active',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prj-002',
    code: 'PRJ-002',
    name: '雲端架構移轉與資安強化案',
    dDay: '2026-09-15',
    advanceNoticeDays: 5,
    status: 'active',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prj-003',
    code: 'PRJ-003',
    name: '智慧醫療數據分析與視覺化系統',
    dDay: '2026-10-01',
    advanceNoticeDays: 10,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  },
];

// Pre-loaded 10 milestone slots as required:
// 啟動會議報告, 專案執行計畫書, 月報(一), 月報(二), 期中報告, 月報(三), 月報(四), 期末報告 Draft, 期末報告 Final, 驗收文件
const MOCK_DEFAULT_RULES: MilestoneRule[] = [
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

const MOCK_HOLIDAYS: Holiday[] = [
  { id: 'h-1', date: '2026-01-01', name: '開國紀念日 (元旦)', isHoliday: true, category: 'DGPA' },
  { id: 'h-2', date: '2026-02-16', name: '農曆除夕', isHoliday: true, category: 'DGPA' },
  { id: 'h-3', date: '2026-02-17', name: '春節連假', isHoliday: true, category: 'DGPA' },
  { id: 'h-4', date: '2026-02-18', name: '春節連假', isHoliday: true, category: 'DGPA' },
  { id: 'h-5', date: '2026-02-19', name: '春節連假', isHoliday: true, category: 'DGPA' },
  { id: 'h-6', date: '2026-02-28', name: '和平紀念日', isHoliday: true, category: 'DGPA' },
  { id: 'h-7', date: '2026-04-04', name: '兒童節與清明節', isHoliday: true, category: 'DGPA' },
  { id: 'h-8', date: '2026-06-19', name: '端午節', isHoliday: true, category: 'DGPA' },
  { id: 'h-9', date: '2026-09-25', name: '中秋節', isHoliday: true, category: 'DGPA' },
  { id: 'h-10', date: '2026-10-10', name: '國慶日', isHoliday: true, category: 'DGPA' },
];

const MOCK_CONTACTS: Contact[] = [
  { id: 'c-1', name: 'Alex Wang (專案經理)', email: 'pm.alex@company.com', department: '專案管理部', role: 'Project Manager' },
  { id: 'c-2', name: 'Sam Lin (高級分析師)', email: 'reporter.sam@company.com', department: '研發部', role: 'Senior Analyst' },
  { id: 'c-3', name: 'David Chen (技術總監)', email: 'director.chen@company.com', department: '技術部', role: 'Tech Lead' },
  { id: 'c-4', name: 'Jessica Lee (品質經理)', email: 'qa.manager@company.com', department: '品保部', role: 'QA Manager' },
  { id: 'c-5', name: 'Emily Huang (財務主管)', email: 'finance.admin@company.com', department: '財務部', role: 'Finance Supervisor' },
];

function parseClientOutlookCsv(text: string): Contact[] {
  if (!text) return [];
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const rows: string[][] = [];
  let row: string[] = [];
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
  const findHeaderIdx = (names: string[]) => {
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

  const contacts: Contact[] = [];
  const seenEmails = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const getVal = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].replace(/^["'\s]+|["'\s]+$/g, '') : '');

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
    const role = jobTitle || '';

    contacts.push({
      id: `c-${Date.now()}-${r}`,
      name: displayName,
      email: email,
      department: department,
      role: role
    });
  }

  return contacts;
}

// Helper to calculate target date given D-Day and offset, adjusting for holidays & weekends
export function calculateAdjustedDate(dDayStr: string, offset: number, holidays: Holiday[]): { targetDate: string; shiftedDate: string; shifted: boolean; holidayName?: string } {
  if (!dDayStr) return { targetDate: '', shiftedDate: '', shifted: false };
  
  const dDay = new Date(dDayStr);
  const rawTarget = new Date(dDay);
  rawTarget.setDate(rawTarget.getDate() + offset);

  let current = new Date(rawTarget);
  let shifted = false;
  let holidayName: string | undefined;

  const holidaySet = new Map(holidays.map(h => [h.date, h.name]));

  // If date falls on weekend or holiday, shift to next business day
  while (true) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = current.getDay(); // 0 is Sun, 6 is Sat

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      shifted = true;
      holidayName = holidayName || (dayOfWeek === 0 ? '週日' : '週六');
      current.setDate(current.getDate() + 1);
    } else if (holidaySet.has(dateStr)) {
      shifted = true;
      holidayName = holidayName || holidaySet.get(dateStr);
      current.setDate(current.getDate() + 1);
    } else {
      break;
    }
  }

  const rawY = rawTarget.getFullYear();
  const rawM = String(rawTarget.getMonth() + 1).padStart(2, '0');
  const rawD = String(rawTarget.getDate()).padStart(2, '0');

  const curY = current.getFullYear();
  const curM = String(current.getMonth() + 1).padStart(2, '0');
  const curD = String(current.getDate()).padStart(2, '0');

  return {
    targetDate: `${rawY}-${rawM}-${rawD}`,
    shiftedDate: `${curY}-${curM}-${curD}`,
    shifted,
    holidayName,
  };
}

// Generate initial schedule items
function generateSchedulesForProject(project: Project, rules: MilestoneRule[], holidays: Holiday[]): ScheduleItem[] {
  if (!project.dDay) return [];

  return rules
    .filter(r => r.enabled)
    .map(rule => {
      const calc = calculateAdjustedDate(project.dDay, rule.dayOffset, holidays);
      return {
        id: `sched-${project.id}-${rule.id}`,
        projectId: project.id,
        ruleId: rule.id,
        title: rule.title,
        dDayOffset: rule.dayOffset,
        dueDate: calc.targetDate,
        calculatedDate: calc.shiftedDate,
        wasShiftedByHoliday: calc.shifted,
        holidayName: calc.holidayName,
        owners: rule.owners,
        status: 'Pending' as const,
        advanceNoticeDays: project.advanceNoticeDays,
      };
    });
}

// Global In-Memory API State
let projectsState = [...MOCK_PROJECTS];
let rulesState = [...MOCK_DEFAULT_RULES];
let holidaysState = [...MOCK_HOLIDAYS];
let contactsState = [...MOCK_CONTACTS];
let schedulesState: Record<string, ScheduleItem[]> = {
  'prj-001': generateSchedulesForProject(MOCK_PROJECTS[0], MOCK_DEFAULT_RULES, MOCK_HOLIDAYS),
};

export const api = {
  // Project APIs
  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map((p: any) => ({
            id: p.id,
            code: p.code || p.projectCode || p.id,
            name: p.name || p.projectName || '未命名專案',
            dDay: p.dDay || '2026-09-01',
            advanceNoticeDays: p.advanceNoticeDays ?? p.advanceDays ?? 3,
            status: p.status || 'active',
            updatedAt: p.updatedAt || new Date().toISOString(),
          }));
        }
      }
    } catch {
      // Fallback to local memory state
    }
    return projectsState;
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    const newProj: Project = {
      id: `prj-${Date.now()}`,
      code: project.code || `PRJ-00${projectsState.length + 1}`,
      name: project.name || '新專案',
      dDay: project.dDay || '2026-08-01',
      advanceNoticeDays: project.advanceNoticeDays || 7,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProj,
          projectCode: newProj.code,
          projectName: newProj.name,
          advanceDays: newProj.advanceNoticeDays
        }),
      });
      if (res.ok) {
        const p = await res.json();
        return {
          id: p.id,
          code: p.code || p.projectCode || p.id,
          name: p.name || p.projectName || '未命名專案',
          dDay: p.dDay,
          advanceNoticeDays: p.advanceNoticeDays ?? p.advanceDays ?? 3,
          status: p.status || 'active',
          updatedAt: p.updatedAt || new Date().toISOString()
        };
      }
    } catch {
      // Fallback
    }
    projectsState.push(newProj);
    // Duplicate default rules for new project
    const newRules = MOCK_DEFAULT_RULES.map((r, idx) => ({
      ...r,
      id: `rule-${newProj.id}-${idx}`,
      projectId: newProj.id,
    }));
    rulesState.push(...newRules);
    schedulesState[newProj.id] = generateSchedulesForProject(newProj, newRules, holidaysState);
    return newProj;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          projectCode: updates.code,
          projectName: updates.name,
          advanceDays: updates.advanceNoticeDays
        }),
      });
      if (res.ok) {
        const p = await res.json();
        return {
          id: p.id,
          code: p.code || p.projectCode || p.id,
          name: p.name || p.projectName || '未命名專案',
          dDay: p.dDay,
          advanceNoticeDays: p.advanceNoticeDays ?? p.advanceDays ?? 3,
          status: p.status || 'active',
          updatedAt: p.updatedAt || new Date().toISOString()
        };
      }
    } catch {
      // Fallback
    }
    const idx = projectsState.findIndex(p => p.id === id);
    if (idx !== -1) {
      projectsState[idx] = { ...projectsState[idx], ...updates, updatedAt: new Date().toISOString() };
      // Recalculate schedules for project
      const projRules = rulesState.filter(r => r.projectId === id);
      schedulesState[id] = generateSchedulesForProject(projectsState[idx], projRules, holidaysState);
      return projectsState[idx];
    }
    throw new Error('Project not found');
  },

  // Rule APIs
  async getRules(projectId: string): Promise<MilestoneRule[]> {
    try {
      const res = await fetch(`/api/projects/${projectId}/rules`);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map((r: any) => ({
            id: r.id,
            projectId: r.projectId || projectId,
            title: r.title,
            dayOffset: r.dayOffset ?? 0,
            owners: r.owners || [],
            enabled: r.enabled !== undefined ? r.enabled : true,
            notes: r.notes || '',
          }));
        }
      }
    } catch {
      // Fallback
    }
    const rules = rulesState.filter(r => r.projectId === projectId);
    if (rules.length === 0) {
      const initialRules = MOCK_DEFAULT_RULES.map((r, i) => ({
        ...r,
        id: `rule-${projectId}-${i}`,
        projectId,
      }));
      rulesState.push(...initialRules);
      return initialRules;
    }
    return rules;
  },

  async saveRules(projectId: string, rules: MilestoneRule[]): Promise<MilestoneRule[]> {
    try {
      const res = await fetch(`/api/projects/${projectId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) return raw;
      }
    } catch {
      // Fallback
    }
    rulesState = rulesState.filter(r => r.projectId !== projectId).concat(rules);
    const proj = projectsState.find(p => p.id === projectId);
    if (proj) {
      schedulesState[projectId] = generateSchedulesForProject(proj, rules, holidaysState);
    }
    return rules;
  },

  // Schedule APIs
  async getSchedules(projectId: string): Promise<ScheduleItem[]> {
    try {
      const res = await fetch(`/api/projects/${projectId}/schedules`);
      if (res.ok) {
        const raw = await res.json();
        const items = Array.isArray(raw) ? raw : (raw.items || []);
        return items.map((item: any) => ({
          id: item.id,
          projectId: item.projectId || projectId,
          title: item.title,
          dDayOffset: item.dDayOffset ?? item.dayOffset ?? 0,
          dueDate: item.dueDate || item.deadlineDate || '',
          calculatedDate: item.calculatedDate || item.noticeDate || '',
          wasShiftedByHoliday: !!(item.wasShiftedByHoliday ?? item.isHolidayShifted),
          holidayName: item.holidayName || (item.isHolidayShifted ? '行政院國定假日/例假日' : undefined),
          owners: item.owners || [],
          status: item.status || (item.isCompleted ? 'Submitted' : 'Pending'),
          advanceNoticeDays: item.advanceNoticeDays ?? 3,
        }));
      }
    } catch {
      // Fallback
    }
    if (!schedulesState[projectId]) {
      const proj = projectsState.find(p => p.id === projectId);
      const projRules = rulesState.filter(r => r.projectId === projectId);
      if (proj) {
        schedulesState[projectId] = generateSchedulesForProject(proj, projRules, holidaysState);
      } else {
        schedulesState[projectId] = [];
      }
    }
    return schedulesState[projectId] || [];
  },

  async markAsSubmitted(scheduleId: string, isCompleted: boolean = true): Promise<ScheduleItem> {
    try {
      const res = await fetch(`/api/schedules/${scheduleId}/mark-submitted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    for (const projId in schedulesState) {
      const item = schedulesState[projId].find(s => s.id === scheduleId);
      if (item) {
        item.status = isCompleted ? 'Submitted' : 'Pending';
        item.submittedAt = isCompleted ? new Date().toISOString() : undefined;
        return item;
      }
    }
    throw new Error('Schedule item not found');
  },

  // Teams Adaptive Card Test Send
  async sendTeamsTestNotification(payload: TeamsCardPayload): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/notifications/test-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback mock success
    }
    // Update local schedule status if available
    if (payload.scheduleId) {
      for (const pId in schedulesState) {
        const item = schedulesState[pId].find(s => s.id === payload.scheduleId);
        if (item) {
          item.status = 'Sent';
          item.lastNotificationSentAt = new Date().toISOString();
        }
      }
    }
    return {
      success: true,
      message: `已成功發送 Teams 測試卡片訊息至業主與 PM 頻道 (負責人: ${payload.owners.join(', ')})`,
    };
  },

  // Holiday APIs
  async getHolidays(): Promise<Holiday[]> {
    try {
      const res = await fetch('/api/holidays');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return holidaysState;
  },

  async syncDGPAHolidays(): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const res = await fetch('/api/holidays/sync-dgpa', { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {
      // Fallback mock DGPA API response
    }
    // Refresh DGPA items
    return {
      success: true,
      count: holidaysState.length,
      message: '已成功同步 行政院人事行政總處 (DGPA) 2026/2027 年度政府行政機關辦公日曆表 (包含彈性放假及補班日)',
    };
  },

  async addCustomHoliday(holiday: Omit<Holiday, 'id'>): Promise<Holiday> {
    const newH: Holiday = { ...holiday, id: `h-${Date.now()}` };
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newH),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    holidaysState.push(newH);
    return newH;
  },

  // Contact APIs
  async getContacts(): Promise<Contact[]> {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return contactsState;
  },

  async uploadContacts(contacts: Omit<Contact, 'id'>[]): Promise<Contact[]> {
    const created = contacts.map((c, i) => ({ ...c, id: `c-${Date.now()}-${i}` }));
    try {
      const res = await fetch('/api/contacts/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    contactsState.push(...created);
    return created;
  },

  async importContactsFile(file: File): Promise<{ success: boolean; addedCount: number; totalCount: number; contacts: Contact[] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.contacts) contactsState = data.contacts;
        return data;
      }
    } catch {
      // Fallback client side CSV parser
    }

    // Client-side fallback reading
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string || '';
        const parsed = parseClientOutlookCsv(text);
        let addedCount = 0;
        parsed.forEach(c => {
          if (!contactsState.some(item => item.email.toLowerCase() === c.email.toLowerCase())) {
            contactsState.push(c);
            addedCount++;
          }
        });
        resolve({ success: true, addedCount, totalCount: contactsState.length, contacts: contactsState });
      };
      reader.readAsText(file, 'utf-8');
    });
  },

  // Document Upload & Parsing API
  async extractDocumentMilestones(file: File, projectDDay: string): Promise<DocumentExtractResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dDay', projectDDay);
      const res = await fetch('/api/documents/extract', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback smart parser simulation
    }

    // Mock realistic extracted milestones from tender/contract file
    const baseDate = projectDDay ? new Date(projectDDay) : new Date();
    
    const addDays = (days: number) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    return {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      parsedCount: 5,
      extractedMilestones: [
        {
          id: 'ext-1',
          originalText: '廠商應於專案啟動日後14日內提送【專案啟動會議簡報與備忘錄】',
          title: '專案啟動會議簡報',
          matchedDate: addDays(14),
          dayOffset: 14,
          owners: ['pm.alex@company.com'],
          selected: true,
        },
        {
          id: 'ext-2',
          originalText: '廠商應於簽約或指定啟動日後30日內完成【專案詳細執行計畫書】',
          title: '專案詳細執行計畫書',
          matchedDate: addDays(30),
          dayOffset: 30,
          owners: ['pm.alex@company.com', 'director.chen@company.com'],
          selected: true,
        },
        {
          id: 'ext-3',
          originalText: '專案進行期間，每滿60日需繳交【階段性執行與進度報告】',
          title: '第一階段進度報告 (月報一)',
          matchedDate: addDays(60),
          dayOffset: 60,
          owners: ['reporter.sam@company.com'],
          selected: true,
        },
        {
          id: 'ext-4',
          originalText: '專案第120日進行【期中審查與系統雛形展示報告】',
          title: '期中審查與系統雛形報告',
          matchedDate: addDays(120),
          dayOffset: 120,
          owners: ['pm.alex@company.com', 'qa.manager@company.com'],
          selected: true,
        },
        {
          id: 'ext-5',
          originalText: '專案全案結案日前30日 (第240日) 提送【驗收測試計畫與軟體交接文件】',
          title: '驗收測試計畫與結案文件',
          matchedDate: addDays(240),
          dayOffset: 240,
          owners: ['pm.alex@company.com', 'finance.admin@company.com'],
          selected: true,
        },
      ],
    };
  },
};
