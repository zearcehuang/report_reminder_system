export interface ProjectOwner {
  id?: string;
  role: string; // e.g. 'PM', '業務', 'SA', 'PG', 'QA', '架構師', '窗口'
  name: string;
  email: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  dDay: string; // YYYY-MM-DD
  advanceNoticeDays: number;
  advanceNoticeDaysList?: number[]; // Multi-select warning days e.g. [1, 3, 7]
  ownerName?: string; // 專案負責人姓名 (Legacy single owner)
  ownerEmail?: string; // 專案負責人 Email (Legacy single email)
  projectOwners?: ProjectOwner[]; // 多角色專案負責人團隊
  teamsWebhookUrl?: string; // MS Teams Webhook URL
  status: 'active' | 'archived' | 'draft';
  updatedAt: string;
}

export interface MilestoneRule {
  id: string;
  projectId: string;
  title: string;
  dayOffset: number; // N for D+N
  owners: string[]; // Email or Name list
  enabled: boolean;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  projectId: string;
  ruleId?: string;
  title: string;
  dDayOffset: number;
  dueDate: string; // Original target YYYY-MM-DD
  calculatedDate: string; // Adjusted YYYY-MM-DD after DGPA holidays
  wasShiftedByHoliday: boolean;
  holidayName?: string;
  owners: string[];
  status: 'Pending' | 'Sent' | 'Failed' | 'Submitted';
  lastNotificationSentAt?: string;
  submittedAt?: string;
  advanceNoticeDays: number;
  advanceNoticeDaysList?: number[]; // Multi-select warning days e.g. [1, 3, 7]
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  isHoliday: boolean;
  category: 'DGPA' | 'Custom';
  description?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
}

export interface ExtractedMilestone {
  id: string;
  originalText: string;
  title: string;
  matchedDate: string;
  dayOffset: number;
  owners: string[];
  selected: boolean;
}

export interface DocumentExtractResult {
  fileName: string;
  fileSize: string;
  parsedCount: number;
  extractedMilestones: ExtractedMilestone[];
}

export interface SenderAccount {
  email: string;
  name: string;
  token: string;
  loggedInAt: string;
}

export interface OutlookMeetingPayload {
  scheduleId: string;
  title: string;
  projectName: string;
  projectCode: string;
  dueDate: string;
  owners: string[];
  status: string;
  customMessage?: string;
  advanceNoticeDaysList?: number[];
  selectedNoticeDay?: number;
  senderEmail?: string;
  senderName?: string;
  senderAuthToken?: string;
}

export type TeamsCardPayload = OutlookMeetingPayload;
