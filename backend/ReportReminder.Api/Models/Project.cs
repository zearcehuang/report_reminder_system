using System;
using System.Collections.Generic;

namespace ReportReminder.Api.Models;

public class Project
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectCode { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public DateTime DDay { get; set; }
    public int AdvanceDays { get; set; } = 3;
    public string TeamsWebhookUrl { get; set; } = string.Empty;
    public List<ReminderRule> Rules { get; set; } = new();
    public List<ExplicitDeadline> ExplicitDeadlines { get; set; } = new();
    public List<UploadedFileInfo> UploadedFiles { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ExplicitDeadline
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public DateTime DeadlineDate { get; set; }
    public List<string> Owners { get; set; } = new();
    public bool IsCompleted { get; set; }
}

public class UploadedFileInfo
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public List<ParsedItem> ExtractedItems { get; set; } = new();
}

public class ParsedItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public DateTime? ExtractedDate { get; set; }
    public string RawText { get; set; } = string.Empty;
    public double Confidence { get; set; } = 1.0;
    public int DayOffset { get; set; } = 0;
    public List<string> Deliverables { get; set; } = new();
    public string PenaltyTerms { get; set; } = string.Empty;
    public string ClauseReference { get; set; } = string.Empty;
}
