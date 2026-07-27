using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;

namespace ReportReminder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScheduleController : ControllerBase
{
    private readonly IJsonStoreService _storeService;
    private readonly IDgpaHolidayService _holidayService;

    public ScheduleController(IJsonStoreService storeService, IDgpaHolidayService holidayService)
    {
        _storeService = storeService;
        _holidayService = holidayService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ScheduleItemDto>>> GetAllSchedules()
    {
        var projects = await _storeService.GetProjectsAsync();
        var holidays = await _storeService.GetHolidaysAsync();

        var allSchedules = new List<ScheduleItemDto>();
        foreach (var project in projects)
        {
            var projectSchedules = _holidayService.CalculateSchedule(project, holidays);
            allSchedules.AddRange(projectSchedules);
        }

        return Ok(allSchedules.OrderBy(s => s.AdjustedWorkdayDate).ToList());
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<List<ScheduleItemDto>>> GetProjectSchedule(string projectId)
    {
        var project = await _storeService.GetProjectByIdAsync(projectId);
        if (project == null) return NotFound(new { message = $"Project {projectId} not found." });

        var holidays = await _storeService.GetHolidaysAsync();
        var schedules = _holidayService.CalculateSchedule(project, holidays);
        return Ok(schedules);
    }

    [HttpPut("rule/{projectId}/{ruleId}/complete")]
    public async Task<IActionResult> ToggleComplete(string projectId, string ruleId, [FromQuery] bool completed = true)
    {
        var project = await _storeService.GetProjectByIdAsync(projectId);
        if (project == null) return NotFound(new { message = $"Project {projectId} not found." });

        bool updated = false;

        var rule = project.Rules.FirstOrDefault(r => r.Id == ruleId);
        if (rule != null)
        {
            rule.IsCompleted = completed;
            updated = true;
        }
        else
        {
            var exp = project.ExplicitDeadlines.FirstOrDefault(e => e.Id == ruleId);
            if (exp != null)
            {
                exp.IsCompleted = completed;
                updated = true;
            }
        }

        if (!updated)
        {
            return NotFound(new { message = $"Rule/Deadline {ruleId} not found in project {projectId}." });
        }

        await _storeService.SaveProjectAsync(project);
        return Ok(new { message = "Completion status updated successfully.", isCompleted = completed });
    }
}
