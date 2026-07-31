using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using ReportReminder.Api.Models;

namespace ReportReminder.Api.Services;

public interface IDgpaHolidayService
{
    Task<List<Holiday>> SyncDgpaHolidaysAsync(int year);
    bool IsWorkday(DateTime date, IEnumerable<Holiday> holidays);
    DateTime GetPreviousWorkday(DateTime date, IEnumerable<Holiday> holidays);
    List<ScheduleItemDto> CalculateSchedule(Project project, IEnumerable<Holiday> holidays);
    List<Holiday> ParseCustomHolidays(string content, string format);
}

public class DgpaHolidayService : IDgpaHolidayService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DgpaHolidayService> _logger;

    public DgpaHolidayService(HttpClient httpClient, ILogger<DgpaHolidayService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<List<Holiday>> SyncDgpaHolidaysAsync(int year)
    {
        var holidays = new List<Holiday>();
        try
        {
            // DGPA Open Data API endpoint for calendar
            string url = $"https://data.ntpc.gov.tw/api/datasets/308DCD00-681C-4687-B184-264F9DBDB7E9/json?size=1000";
            var response = await _httpClient.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                string json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    if (element.TryGetProperty("date", out var dateProp) &&
                        DateTime.TryParseExact(dateProp.GetString(), "yyyy/M/d", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDate))
                    {
                        if (parsedDate.Year == year)
                        {
                            bool isHoliday = element.TryGetProperty("isHoliday", out var isHolProp) &&
                                             (isHolProp.GetString() == "是" || isHolProp.GetString() == "true" || isHolProp.GetString() == "1");
                            string description = element.TryGetProperty("description", out var descProp) ? descProp.GetString() ?? "" : "";
                            
                            holidays.Add(new Holiday
                            {
                                Date = parsedDate.Date,
                                Description = description,
                                IsWorkday = !isHoliday, // false if holiday, true if make-up workday
                                Source = "DGPA"
                            });
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch remote DGPA open data. Applying default year rules for year {Year}.", year);
        }

        // If no DGPA records were fetched (e.g. offline environment), generate default weekend & standard Taiwan holiday rules
        if (!holidays.Any())
        {
            holidays = GenerateDefaultHolidays(year);
        }

        return holidays.OrderBy(h => h.Date).ToList();
    }

    public bool IsWorkday(DateTime date, IEnumerable<Holiday> holidays)
    {
        DateTime target = date.Date;
        var holidayRecord = holidays.FirstOrDefault(h => h.Date.Date == target);
        if (holidayRecord != null)
        {
            return holidayRecord.IsWorkday;
        }

        // Standard weekend rule
        return target.DayOfWeek != DayOfWeek.Saturday && target.DayOfWeek != DayOfWeek.Sunday;
    }

    public DateTime GetPreviousWorkday(DateTime date, IEnumerable<Holiday> holidays)
    {
        DateTime current = date.Date;
        while (!IsWorkday(current, holidays))
        {
            current = current.AddDays(-1);
        }
        return current;
    }

    public List<ScheduleItemDto> CalculateSchedule(Project project, IEnumerable<Holiday> holidays)
    {
        var result = new List<ScheduleItemDto>();
        DateTime today = DateTime.Today;

        // 1. Calculate for Reminder Rules (D-Day + Offset)
        foreach (var rule in project.Rules)
        {
            DateTime rawTarget = rule.ExplicitDate ?? project.DDay.Date.AddDays(rule.DayOffset);
            DateTime adjustedTarget = GetPreviousWorkday(rawTarget, holidays);
            
            // Advance reminder date: Step back AdvanceDays from adjustedTarget
            DateTime advanceDate = adjustedTarget.AddDays(-project.AdvanceDays);
            advanceDate = GetPreviousWorkday(advanceDate, holidays);

            string status = "Pending";
            if (rule.IsCompleted)
            {
                status = "Completed";
            }
            else if (today > adjustedTarget)
            {
                status = "Overdue";
            }
            else if (today >= advanceDate)
            {
                status = "DueSoon";
            }

            result.Add(new ScheduleItemDto
            {
                ProjectId = project.Id,
                ProjectCode = project.ProjectCode,
                ProjectName = project.ProjectName,
                RuleOrDeadlineId = rule.Id,
                MilestoneTitle = rule.Title,
                BaseDDay = project.DDay.Date,
                DayOffset = rule.DayOffset,
                RawTargetDate = rawTarget,
                AdjustedWorkdayDate = adjustedTarget,
                AdvanceReminderDate = advanceDate,
                Owners = rule.Owners ?? new List<string>(),
                IsCompleted = rule.IsCompleted,
                IsExplicitDeadline = false,
                Status = status
            });
        }

        // 2. Calculate for Explicit Deadlines
        foreach (var exp in project.ExplicitDeadlines)
        {
            DateTime rawTarget = exp.DeadlineDate.Date;
            DateTime adjustedTarget = GetPreviousWorkday(rawTarget, holidays);
            DateTime advanceDate = GetPreviousWorkday(adjustedTarget.AddDays(-project.AdvanceDays), holidays);

            string status = "Pending";
            if (exp.IsCompleted)
            {
                status = "Completed";
            }
            else if (today > adjustedTarget)
            {
                status = "Overdue";
            }
            else if (today >= advanceDate)
            {
                status = "DueSoon";
            }

            result.Add(new ScheduleItemDto
            {
                ProjectId = project.Id,
                ProjectCode = project.ProjectCode,
                ProjectName = project.ProjectName,
                RuleOrDeadlineId = exp.Id,
                MilestoneTitle = exp.Title,
                BaseDDay = project.DDay.Date,
                DayOffset = 0,
                RawTargetDate = rawTarget,
                AdjustedWorkdayDate = adjustedTarget,
                AdvanceReminderDate = advanceDate,
                Owners = exp.Owners ?? new List<string>(),
                IsCompleted = exp.IsCompleted,
                IsExplicitDeadline = true,
                Status = status
            });
        }

        return result.OrderBy(s => s.AdjustedWorkdayDate).ToList();
    }

    public List<Holiday> ParseCustomHolidays(string content, string format)
    {
        var holidays = new List<Holiday>();
        format = format.ToLowerInvariant().Trim();

        if (format == "json" || content.TrimStart().StartsWith("["))
        {
            using var doc = JsonDocument.Parse(content);
            foreach (var elem in doc.RootElement.EnumerateArray())
            {
                if (elem.TryGetProperty("date", out var dProp) && DateTime.TryParse(dProp.GetString(), out DateTime d))
                {
                    bool isWorkday = elem.TryGetProperty("isWorkday", out var wProp) && wProp.GetBoolean();
                    string desc = elem.TryGetProperty("description", out var descProp) ? descProp.GetString() ?? "" : "";
                    holidays.Add(new Holiday { Date = d.Date, Description = desc, IsWorkday = isWorkday, Source = "Custom" });
                }
            }
        }
        else // CSV format
        {
            using var reader = new StringReader(content);
            string? line;
            bool firstLine = true;
            while ((line = reader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                var parts = line.Split(',');
                if (firstLine && parts[0].Contains("Date", StringComparison.OrdinalIgnoreCase))
                {
                    firstLine = false;
                    continue;
                }
                firstLine = false;

                if (parts.Length >= 1 && DateTime.TryParse(parts[0].Trim(), out DateTime dt))
                {
                    string desc = parts.Length >= 2 ? parts[1].Trim() : "Custom Holiday";
                    bool isWorkday = parts.Length >= 3 && bool.TryParse(parts[2].Trim(), out bool w) ? w : false;
                    holidays.Add(new Holiday { Date = dt.Date, Description = desc, IsWorkday = isWorkday, Source = "Custom" });
                }
            }
        }

        return holidays;
    }

    private List<Holiday> GenerateDefaultHolidays(int year)
    {
        // Standard static Taiwanese national holidays for requested year fallback
        var list = new List<Holiday>
        {
            new Holiday { Date = new DateTime(year, 1, 1), Description = "元旦", IsWorkday = false, Source = "DGPA" },
            new Holiday { Date = new DateTime(year, 2, 28), Description = "和平紀念日", IsWorkday = false, Source = "DGPA" },
            new Holiday { Date = new DateTime(year, 4, 4), Description = "兒童節", IsWorkday = false, Source = "DGPA" },
            new Holiday { Date = new DateTime(year, 4, 5), Description = "清明節", IsWorkday = false, Source = "DGPA" },
            new Holiday { Date = new DateTime(year, 5, 1), Description = "勞動節", IsWorkday = false, Source = "DGPA" },
            new Holiday { Date = new DateTime(year, 10, 10), Description = "國慶日", IsWorkday = false, Source = "DGPA" }
        };
        return list;
    }
}
