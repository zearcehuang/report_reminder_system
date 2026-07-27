using System;

namespace ReportReminder.Api.Models;

public class Holiday
{
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsWorkday { get; set; } // false = holiday/weekend, true = make-up workday (補班日)
    public string Source { get; set; } = "DGPA"; // "DGPA" or "Custom"
}
