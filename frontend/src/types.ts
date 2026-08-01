/** Multi-role project team member */
export interface ProjectOwner {
  id?: string;
  role: string; // e.g. 'PM', '業務', 'SA', 'PG', 'QA', '架構師', '窗口'
  name: string;
  email: string;
}

/** Core project entity */
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
  deliverables?: string[];
  penaltyTerms?: string;
  clauseReference?: string;
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
  deliverables?: string[];
  penaltyTerms?: string;
  clauseReference?: string;
}

/** DGPA holiday / make-up workday entry */
export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  /** true = national/public holiday (day off); false = make-up workday (補班日, working) */
  isHoliday: boolean;
  category: 'DGPA' | 'Custom';
  description?: string;
  /** true = this date IS a valid working day (even if on a weekend, e.g. 補班日). Inverse of isHoliday in most cases. */
  isWorkday?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  ruleId: string;
  reportTitle: string;
  deadlineDate: string;
  owners: string[];
  triggerType: 'AdvanceNotice' | 'DueToday' | 'Overdue';
  status: 'Success' | 'PartialFailed' | 'Failed';
  channel: 'Teams+Outlook' | 'Outlook' | 'Teams';
  message: string;
}

export interface SchedulerStatus {
  isRunning: boolean;
  schedulePattern: string;
  lastScanTime?: string;
  lastScanCount?: number;
  nextScheduledTime?: string;
  totalLogsCount: number;
}

export interface ExtractedMilestone {
  id: string;
  originalText: string;
  title: string;
  matchedDate: string;
  dayOffset: number;
  owners: string[];
  selected: boolean;
  deliverables?: string[];
  penaltyTerms?: string;
  clauseReference?: string;
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

export type PermissionCode =
  | 'projects:read'
  | 'projects:write'
  | 'projects:delete'
  | 'rules:write'
  | 'schedules:submit'
  | 'notifications:send'
  | 'holidays:manage'
  | 'contacts:manage'
  | 'system:admin';

export interface RoleItem {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionCode[];
  updatedAt?: string;
}

/** Built-in roles: Admin, PM, Auditor. Custom roles use arbitrary strings. */
export type UserRole = 'Admin' | 'PM' | 'Auditor' | (string & {});

export interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  title?: string;
  status: 'active' | 'inactive';
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  title?: string;
  status?: 'active' | 'inactive';
  token?: string;
}
