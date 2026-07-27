using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging.Abstractions;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;
using Xunit;

namespace ReportReminder.Tests;

public class ScheduleCalculationTests
{
    private readonly DgpaHolidayService _service;

    public ScheduleCalculationTests()
    {
        _service = new DgpaHolidayService(new HttpClient(), NullLogger<DgpaHolidayService>.Instance);
    }

    [Fact]
    public void IsWorkday_WeekendReturnsFalse_WeekdayReturnsTrue()
    {
        var holidays = new List<Holiday>();
        var monday = new DateTime(2026, 8, 3); // Monday
        var saturday = new DateTime(2026, 8, 8); // Saturday

        Assert.True(_service.IsWorkday(monday, holidays));
        Assert.False(_service.IsWorkday(saturday, holidays));
    }

    [Fact]
    public void IsWorkday_MakeupWorkday_ReturnsTrue()
    {
        var saturday = new DateTime(2026, 8, 8);
        var holidays = new List<Holiday>
        {
            new Holiday { Date = saturday, Description = "補班日", IsWorkday = true, Source = "DGPA" }
        };

        Assert.True(_service.IsWorkday(saturday, holidays));
    }

    [Fact]
    public void GetPreviousWorkday_TargetOnWeekend_ShiftsToFriday()
    {
        var saturday = new DateTime(2026, 8, 8);
        var friday = new DateTime(2026, 8, 7);
        var holidays = new List<Holiday>();

        var adjusted = _service.GetPreviousWorkday(saturday, holidays);

        Assert.Equal(friday, adjusted);
    }

    [Fact]
    public void GetPreviousWorkday_TargetOnHoliday_ShiftsToPreviousWorkday()
    {
        var fridayHoliday = new DateTime(2026, 8, 7);
        var thursday = new DateTime(2026, 8, 6);
        var holidays = new List<Holiday>
        {
            new Holiday { Date = fridayHoliday, Description = "測試假日", IsWorkday = false, Source = "Custom" }
        };

        var adjusted = _service.GetPreviousWorkday(fridayHoliday, holidays);

        Assert.Equal(thursday, adjusted);
    }

    [Fact]
    public void CalculateSchedule_CorrectlyAppliesDDayOffsetAndHolidayAdjustment()
    {
        // DDay = 2026-08-03 (Monday)
        // Rule 1: DayOffset = +5 => RawTargetDate = 2026-08-08 (Saturday)
        // AdjustedTargetDate => 2026-08-07 (Friday)
        var project = new Project
        {
            Id = "proj-1",
            ProjectCode = "PRJ-001",
            ProjectName = "AI Development",
            DDay = new DateTime(2026, 8, 3),
            AdvanceDays = 2,
            Rules = new List<ReminderRule>
            {
                new ReminderRule { Id = "r1", Title = "Midterm Report", DayOffset = 5, Owners = new List<string> { "alice@example.com" } }
            }
        };

        var holidays = new List<Holiday>();
        var schedules = _service.CalculateSchedule(project, holidays);

        Assert.Single(schedules);
        var schedule = schedules.First();
        Assert.Equal(new DateTime(2026, 8, 8), schedule.RawTargetDate);
        Assert.Equal(new DateTime(2026, 8, 7), schedule.AdjustedWorkdayDate);
        Assert.Equal(new DateTime(2026, 8, 5), schedule.AdvanceReminderDate); // 2026-08-07 minus 2 days
    }
}
