export interface Project {
  id: string;
  code: string;
  name: string;
  dDay: string; // YYYY-MM-DD
  advanceNoticeDays: number;
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

export interface TeamsCardPayload {
  scheduleId: string;
  title: string;
  projectName: string;
  projectCode: string;
  dueDate: string;
  owners: string[];
  status: string;
  webhookUrl?: string;
  customMessage?: string;
}
