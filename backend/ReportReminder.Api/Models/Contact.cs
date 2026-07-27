using System;

namespace ReportReminder.Api.Models;

public class Contact
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Source { get; set; } = "Manual"; // "Manual", "OutlookCSV", "vCard"
}
