using System;
using System.Collections.Generic;

namespace ReportReminder.Api.Models;

public class ReminderRule
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public int DayOffset { get; set; } // e.g. -5, 0, 7, 14
    public List<string> Owners { get; set; } = new();
    public bool IsCompleted { get; set; }
    public DateTime? ExplicitDate { get; set; }
}
