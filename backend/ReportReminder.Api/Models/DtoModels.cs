using System;
using System.Collections.Generic;

namespace ReportReminder.Api.Models;

public class ScheduleItemDto
{
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectCode { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string RuleOrDeadlineId { get; set; } = string.Empty;
    public string MilestoneTitle { get; set; } = string.Empty;
    public DateTime BaseDDay { get; set; }
    public int DayOffset { get; set; }
    public DateTime RawTargetDate { get; set; }
    public DateTime AdjustedWorkdayDate { get; set; }
    public DateTime AdvanceReminderDate { get; set; }
    public List<string> Owners { get; set; } = new();
    public bool IsCompleted { get; set; }
    public bool IsExplicitDeadline { get; set; }
    public string Status { get; set; } = "Pending"; // "Completed", "Pending", "DueSoon", "Overdue"
}

public class DocumentPreviewDto
{
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public List<ParsedItem> ExtractedItems { get; set; } = new();
}

public class TeamsNotificationRequestDto
{
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectCode { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string MilestoneTitle { get; set; } = string.Empty;
    public DateTime TargetDate { get; set; }
    public int AdvanceDays { get; set; }
    public List<string> Owners { get; set; } = new();
    public string WebhookUrl { get; set; } = string.Empty;
}

public class TeamsNotificationResultDto
{
    public bool Success { get; set; }
    public int RetryCount { get; set; }
    public string StatusMessage { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
