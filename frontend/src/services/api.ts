import {
  Project,
  MilestoneRule,
  ScheduleItem,
  Holiday,
  Contact,
  DocumentExtractResult,
  ExtractedMilestone,
  OutlookMeetingPayload,
  SenderAccount,
  NotificationLog,
  SchedulerStatus,
  UserSession,
  UserItem,
  RoleItem,
} from '../types';
import { errorLogger } from './logger';
import { toastManager } from '../context/ToastContext';

const requestCache = new Map<string, { data: any; expiry: number }>();
const inFlightRequests = new Map<string, Promise<{ ok: boolean; data: any }>>();
const CACHE_TTL_MS = 5000;

async function fetchApi<T>(
  url: string,
  options: RequestInit = {},
  fallback?: T
): Promise<{ ok: boolean; data: T }> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const cacheKey = isGet ? url : null;

  if (isGet && cacheKey) {
    // 1. TTL Cache Check
    const cached = requestCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return { ok: true, data: cached.data as T };
    }

    // 2. In-flight Request Deduplication
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey) as Promise<{ ok: boolean; data: T }>;
    }
  } else {
    // Invalidate cache on mutations (POST/PUT/DELETE)
    requestCache.clear();
  }

  const fetchPromise = (async () => {
    try {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
      };

      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      }

      const res = await fetch(url, { ...options, headers });
      if (res.ok) {
        const data = await res.json();
        if (isGet && cacheKey) {
          requestCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
        }
        return { ok: true, data };
      }
      
      // Parse structured exception response if available
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errData = await res.json();
        if (errData) {
          errorMsg = errData.error || errData.message || errData.detail || errorMsg;
        }
      } catch { }

      errorLogger.log('API', 'ERROR', `Fetch failed for ${url}: ${errorMsg}`);
      
      return { ok: false, data: fallback as T };
    } catch (err: any) {
      const errorMsg = err?.message || 'Network request failed';
      errorLogger.log('API', 'ERROR', `Fetch failed for ${url}: ${errorMsg}`);
      return { ok: false, data: fallback as T };
    } finally {
      if (isGet && cacheKey) {
        inFlightRequests.delete(cacheKey);
      }
    }
  })();

  if (isGet && cacheKey) {
    inFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

export const api = {
  // Project APIs
  async getProjects(): Promise<Project[]> {
    const { ok, data } = await fetchApi<any[]>('/api/projects', {}, []);
    if (ok && Array.isArray(data)) {
      return data.map((p: any) => ({
        id: p.id,
        code: p.code || p.projectCode || p.id,
        name: p.name || p.projectName || '未命名專案',
        dDay: p.dDay || '2026-09-01',
        advanceNoticeDays: p.advanceNoticeDays ?? p.advanceDays ?? 3,
        advanceNoticeDaysList: p.advanceNoticeDaysList || [p.advanceNoticeDays ?? p.advanceDays ?? 3],
        ownerName: p.ownerName || '張小明 (PM)',
        ownerEmail: p.ownerEmail || 'alex.chang@company.com',
        projectOwners: p.projectOwners || [],
        status: p.status || 'active',
        updatedAt: p.updatedAt || new Date().toISOString(),
      }));
    }
    return [];
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    const payload = {
      ...project,
      projectCode: project.code || `PRJ-${Date.now()}`,
      projectName: project.name || '新專案',
      advanceDays: project.advanceNoticeDays || 3
    };
    const { ok, data } = await fetchApi<any>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (ok && data) {
      return {
        id: data.id,
        code: data.code || data.projectCode || data.id,
        name: data.name || data.projectName || '未命名專案',
        dDay: data.dDay || '2026-09-01',
        advanceNoticeDays: data.advanceNoticeDays ?? data.advanceDays ?? 3,
        advanceNoticeDaysList: data.advanceNoticeDaysList || [data.advanceNoticeDays ?? 3],
        ownerName: data.ownerName || '張小明 (PM)',
        ownerEmail: data.ownerEmail || 'alex.chang@company.com',
        projectOwners: data.projectOwners || [],
        status: data.status || 'active',
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    }
    throw new Error('建立專案失敗');
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const payload = {
      ...updates,
      projectCode: updates.code,
      projectName: updates.name,
      advanceDays: updates.advanceNoticeDays
    };
    const { ok, data } = await fetchApi<any>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (ok && data) {
      return {
        id: data.id,
        code: data.code || data.projectCode || data.id,
        name: data.name || data.projectName || '未命名專案',
        dDay: data.dDay || '2026-09-01',
        advanceNoticeDays: data.advanceNoticeDays ?? data.advanceDays ?? 3,
        advanceNoticeDaysList: data.advanceNoticeDaysList || [data.advanceNoticeDays ?? 3],
        ownerName: data.ownerName || '張小明 (PM)',
        ownerEmail: data.ownerEmail || 'alex.chang@company.com',
        projectOwners: data.projectOwners || [],
        status: data.status || 'active',
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    }
    throw new Error('更新專案失敗');
  },

  async deleteProject(id: string): Promise<boolean> {
    const { ok } = await fetchApi(`/api/projects/${id}`, { method: 'DELETE' });
    return ok;
  },

  async batchDeleteProjects(ids: string[]): Promise<boolean> {
    const { ok } = await fetchApi('/api/projects/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    return ok;
  },

  async deleteRule(projectId: string, ruleId: string): Promise<boolean> {
    const { ok } = await fetchApi(`/api/projects/${projectId}/rules/${ruleId}`, { method: 'DELETE' });
    return ok;
  },

  async batchDeleteRules(projectId: string, ruleIds: string[]): Promise<boolean> {
    const { ok } = await fetchApi(`/api/projects/${projectId}/rules/batch-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids: ruleIds }),
    });
    return ok;
  },

  // Rule APIs
  async getRules(projectId: string): Promise<MilestoneRule[]> {
    const { ok, data } = await fetchApi<any[]>(`/api/projects/${projectId}/rules`, {}, []);
    if (ok && Array.isArray(data)) {
      return data.map((r: any) => ({
        id: r.id,
        projectId: r.projectId || projectId,
        title: r.title,
        dayOffset: r.dayOffset ?? 0,
        owners: r.owners || [],
        enabled: r.enabled !== undefined ? r.enabled : true,
        notes: r.notes || '',
      }));
    }
    return [];
  },

  async saveRules(projectId: string, rules: MilestoneRule[]): Promise<MilestoneRule[]> {
    const { ok, data } = await fetchApi<MilestoneRule[]>(`/api/projects/${projectId}/rules`, {
      method: 'POST',
      body: JSON.stringify(rules),
    }, rules);
    return ok ? data : rules;
  },

  // Schedule APIs
  async getSchedules(projectId: string): Promise<ScheduleItem[]> {
    const { ok, data } = await fetchApi<any>(`/api/projects/${projectId}/schedules`, {}, { items: [] });
    const items = Array.isArray(data) ? data : (data.items || []);
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
  },

  async markAsSubmitted(scheduleId: string, isCompleted: boolean = true): Promise<ScheduleItem> {
    const { data } = await fetchApi<ScheduleItem>(`/api/schedules/${scheduleId}/mark-submitted`, {
      method: 'POST',
      body: JSON.stringify({ isCompleted }),
    });
    return data;
  },

  // Sender Login Authentication
  async loginSender(email: string, password: string, name?: string): Promise<{ success: boolean; sender?: SenderAccount; message?: string; error?: string }> {
    const { ok, data } = await fetchApi<any>('/api/auth/sender-login', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (ok && data.success) {
      return data;
    }
    return { success: false, error: data.error || '發布寄件者身份驗證失敗' };
  },

  // Outlook Meeting Dispatch
  async sendOutlookMeetingNotification(payload: OutlookMeetingPayload): Promise<{
    success: boolean;
    message: string;
    icsContent?: string;
    fileName?: string;
    outlookCalendarLink?: string;
    error?: string;
  }> {
    const { ok, data } = await fetchApi<any>('/api/notifications/send-outlook-meeting', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!ok || !data.success) {
      return {
        success: false,
        message: data.error || '發布失敗，請確認寄件者帳號已登入',
        error: data.error,
      };
    }
    return data;
  },

  sendRealTeamsAndOutlookNotification(payload: OutlookMeetingPayload) {
    return this.sendOutlookMeetingNotification(payload);
  },

  // Holiday APIs
  async getHolidays(): Promise<Holiday[]> {
    const { ok, data } = await fetchApi<any[]>('/api/holidays', {}, []);
    if (ok && Array.isArray(data)) {
      return data.map((item: any, idx: number) => {
        const isWorkday = item.isWorkday === true || item.isHoliday === false;
        return {
          id: item.id || `h-api-${idx}`,
          date: item.date,
          name: item.name || item.description || (isWorkday ? '補行上班日' : '國定假日'),
          isHoliday: !isWorkday,
          isWorkday: isWorkday,
          category: item.category || item.source || 'DGPA'
        };
      }).sort((a, b) => a.date.localeCompare(b.date));
    }
    return [];
  },

  async syncDGPAHolidays(): Promise<{ success: boolean; count: number; message: string }> {
    const { data } = await fetchApi<{ success: boolean; count: number; message: string }>('/api/holidays/sync-dgpa', { method: 'POST' }, {
      success: false,
      count: 0,
      message: '同步失敗'
    });
    return data;
  },

  async addCustomHoliday(holiday: Omit<Holiday, 'id'>): Promise<Holiday> {
    const newH: Holiday = { ...holiday, id: `h-${Date.now()}` };
    const { data } = await fetchApi<Holiday>('/api/holidays', {
      method: 'POST',
      body: JSON.stringify(newH),
    }, newH);
    return data;
  },

  // Contact APIs
  async getContacts(): Promise<Contact[]> {
    const { data } = await fetchApi<Contact[]>('/api/contacts', {}, []);
    return data;
  },

  async uploadContacts(contacts: Omit<Contact, 'id'>[]): Promise<Contact[]> {
    const created = contacts.map((c, i) => ({ ...c, id: `c-${Date.now()}-${i}` }));
    const { data } = await fetchApi<Contact[]>('/api/contacts/upload', {
      method: 'POST',
      body: JSON.stringify(created),
    }, created);
    return data;
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
        return await res.json();
      }
    } catch {}
    return { success: false, addedCount: 0, totalCount: 0, contacts: [] };
  },

  // Document Extract API
  async extractDocumentMilestones(file: File, projectDDay: string): Promise<DocumentExtractResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dDay', projectDDay);
      const res = await fetch('/api/documents/extract', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const raw = await res.json();
        const rawList = raw.extractedMilestones || raw.extractedItems || [];
        const normalized: ExtractedMilestone[] = rawList.map((item: any, idx: number) => {
          const matchedDate = item.matchedDate || item.date || '2026-09-01';
          let dayOffset = item.dayOffset;
          if (dayOffset === undefined && projectDDay && matchedDate) {
            const d1 = new Date(matchedDate);
            const d2 = new Date(projectDDay);
            const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
            dayOffset = isNaN(diff) ? (idx + 1) * 30 : Math.max(0, diff);
          }
          return {
            id: item.id || `ext-${Date.now()}-${idx + 1}`,
            title: item.title || '履約里程碑報告',
            originalText: item.originalText || item.contextSnippet || item.title || '',
            matchedDate: matchedDate,
            dayOffset: dayOffset ?? (idx + 1) * 30,
            owners: Array.isArray(item.owners) && item.owners.length > 0 ? item.owners : ['張小明 (PM)'],
            selected: item.selected !== undefined ? !!item.selected : true,
          };
        });

        return {
          fileName: raw.fileName || file.name,
          fileSize: raw.fileSize || `${(file.size / 1024).toFixed(1)} KB`,
          parsedCount: normalized.length,
          extractedMilestones: normalized,
        };
      }
    } catch (err: any) {
      errorLogger.log('API', 'ERROR', `解析文件 ${file.name} 失敗: ${err?.message || err}`, err?.stack);
    }
    return { fileName: file.name, fileSize: '0 KB', parsedCount: 0, extractedMilestones: [] };
  },

  // Automated Scheduler & Logs APIs
  async getSchedulerStatus(): Promise<SchedulerStatus> {
    const { data } = await fetchApi<SchedulerStatus>('/api/scheduler/status', {}, {
      isRunning: false,
      schedulePattern: '每日 09:00 AM 自動稽核掃描',
      totalLogsCount: 0
    });
    return data;
  },

  async triggerSchedulerRunNow(): Promise<{ success: boolean; message: string; scanTime?: string; notifyCount?: number }> {
    const { data } = await fetchApi<{ success: boolean; message: string; scanTime?: string; notifyCount?: number }>('/api/scheduler/run-now', { method: 'POST' }, {
      success: false,
      message: '手動掃描發送失敗'
    });
    return data;
  },

  async getNotificationLogs(): Promise<NotificationLog[]> {
    const { data } = await fetchApi<NotificationLog[]>('/api/notifications/logs', {}, []);
    return data;
  },

  async clearNotificationLogs(): Promise<{ success: boolean; message: string }> {
    const { data } = await fetchApi<{ success: boolean; message: string }>('/api/notifications/logs/clear', { method: 'POST' }, { success: true, message: '日誌已清空' });
    return data;
  },

  // Auth & RBAC APIs
  async loginUser(email: string, password: string): Promise<{ success: boolean; token?: string; user?: UserSession; message?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || '登入連線失敗' };
    }
  },

  getAuthSession(): UserSession {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {
      id: 'usr-admin-1',
      email: 'admin@company.com',
      name: '系統最高管理員',
      role: 'Admin',
      department: '資訊管理處'
    };
  },

  // User Management APIs
  async getUsers(): Promise<UserItem[]> {
    const { data } = await fetchApi<UserItem[]>('/api/users', {}, []);
    return data;
  },

  async createUser(userData: Partial<UserItem>): Promise<{ success: boolean; user?: UserItem; error?: string }> {
    const { data } = await fetchApi<{ success: boolean; user?: UserItem; error?: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, { success: false, error: '新增使用者失敗' });
    return data;
  },

  async updateUser(id: string, updates: Partial<UserItem>): Promise<{ success: boolean; user?: UserItem; error?: string }> {
    const { data } = await fetchApi<{ success: boolean; user?: UserItem; error?: string }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, { success: false, error: '更新使用者失敗' });
    return data;
  },

  async deleteUser(id: string): Promise<boolean> {
    const { ok } = await fetchApi(`/api/users/${id}`, { method: 'DELETE' });
    return ok;
  },

  async batchDeleteUsers(ids: string[]): Promise<boolean> {
    const { ok } = await fetchApi('/api/users/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    return ok;
  },

  async importUsersFromContacts(): Promise<{ success: boolean; addedCount: number; users: UserItem[] }> {
    const { data } = await fetchApi<{ success: boolean; addedCount: number; users: UserItem[] }>('/api/users/import-contacts', { method: 'POST' }, { success: false, addedCount: 0, users: [] });
    return data;
  },

  // Role Management APIs
  async getRoles(): Promise<RoleItem[]> {
    const { data } = await fetchApi<RoleItem[]>('/api/roles', {}, []);
    return data;
  },

  async createRole(roleData: Partial<RoleItem>): Promise<{ success: boolean; role?: RoleItem; error?: string }> {
    const { data } = await fetchApi<{ success: boolean; role?: RoleItem; error?: string }>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    }, { success: false, error: '新增角色失敗' });
    return data;
  },

  async updateRole(id: string, updates: Partial<RoleItem>): Promise<{ success: boolean; role?: RoleItem; error?: string }> {
    const { data } = await fetchApi<{ success: boolean; role?: RoleItem; error?: string }>(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, { success: false, error: '更新角色失敗' });
    return data;
  },

  async deleteRole(id: string): Promise<{ success: boolean; error?: string }> {
    const { data } = await fetchApi<{ success: boolean; error?: string }>(`/api/roles/${id}`, { method: 'DELETE' }, { success: false, error: '刪除角色失敗' });
    return data;
  },

  logoutUser() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};
