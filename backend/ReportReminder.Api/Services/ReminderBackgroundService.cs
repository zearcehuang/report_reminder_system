using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;

namespace ReportReminder.Api.Services;

public class ReminderBackgroundService : BackgroundService
{
    private readonly ILogger<ReminderBackgroundService> _logger;
    private readonly IJsonStoreService _jsonStoreService;
    private readonly ITeamsWebhookService _teamsWebhookService;

    public ReminderBackgroundService(
        ILogger<ReminderBackgroundService> logger,
        IJsonStoreService jsonStoreService,
        ITeamsWebhookService teamsWebhookService)
    {
        _logger = logger;
        _jsonStoreService = jsonStoreService;
        _teamsWebhookService = teamsWebhookService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ReminderBackgroundService starting up.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            var nextRun = new DateTime(now.Year, now.Month, now.Day, 9, 0, 0);
            
            if (now >= nextRun)
            {
                nextRun = nextRun.AddDays(1);
            }

            try
            {
                var delay = nextRun - now;
                _logger.LogInformation($"Next scan scheduled at {nextRun} (in {delay.TotalHours:F2} hours)");

                await Task.Delay(delay, stoppingToken);

                if (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        await RunScanAndNotifyAsync(stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error occurred during scheduled RunScanAndNotifyAsync. Service will continue next cycle.");
                    }
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Background service delay cancelled for graceful shutdown.");
                break;
            }
        }
        
        _logger.LogInformation("ReminderBackgroundService stopping.");
    }

    public async Task RunScanAndNotifyAsync(CancellationToken stoppingToken = default)
    {
        _logger.LogInformation("Running daily reminder scan...");

        var projects = await _jsonStoreService.GetProjectsAsync();
        var holidays = await _jsonStoreService.GetHolidaysAsync();

        foreach (var project in projects)
        {
            try
            {
            if (string.IsNullOrWhiteSpace(project.TeamsWebhookUrl)) continue;

            foreach (var rule in project.Rules)
            {
                if (!rule.Enabled || rule.IsCompleted) continue;

                var rawTarget = project.DDay.AddDays(rule.DayOffset);
                var adjustedTarget = GetPreviousWorkday(rawTarget, holidays);

                var noticeDaysList = project.AdvanceDays > 0 ? new[] { project.AdvanceDays } : new[] { 3 };

                bool shouldNotify = false;
                int advanceDaysForNotification = 0;

                var today = DateTime.Now.Date;

                foreach (var days in noticeDaysList)
                {
                    var triggerDate = GetPreviousWorkday(adjustedTarget.AddDays(-days), holidays);
                    if (triggerDate.Date == today)
                    {
                        shouldNotify = true;
                        advanceDaysForNotification = days;
                        break;
                    }
                }

                if (today == adjustedTarget.Date)
                {
                    shouldNotify = true;
                    advanceDaysForNotification = 0;
                }

                if (shouldNotify)
                {
                    var payload = new TeamsNotificationRequestDto
                    {
                        ProjectId = project.Id,
                        ProjectCode = project.ProjectCode,
                        ProjectName = project.ProjectName,
                        MilestoneTitle = rule.Title,
                        TargetDate = adjustedTarget,
                        AdvanceDays = advanceDaysForNotification,
                        WebhookUrl = project.TeamsWebhookUrl,
                        Owners = rule.Owners
                    };

                    _logger.LogInformation($"Triggering notification for {project.ProjectName} - {rule.Title}");
                    await _teamsWebhookService.SendNotificationAsync(payload);
                }
            }
            } // End of try block
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing notifications for project {project.ProjectCode} ({project.ProjectName}). Continuing with next project.");
            }
        }
    }

    private DateTime GetPreviousWorkday(DateTime date, List<Holiday> holidays)
    {
        var current = date.Date;
        while (IsDayOff(current, holidays))
        {
            current = current.AddDays(-1);
        }
        return current;
    }

    private bool IsDayOff(DateTime date, List<Holiday> holidays)
    {
        var match = holidays.FirstOrDefault(h => h.Date.Date == date.Date);
        if (match != null) return !match.IsWorkday;

        return date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday;
    }
}
