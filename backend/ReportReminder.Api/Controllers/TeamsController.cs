using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;

namespace ReportReminder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamsController : ControllerBase
{
    private readonly ITeamsWebhookService _teamsService;
    private readonly IJsonStoreService _storeService;

    public TeamsController(ITeamsWebhookService teamsService, IJsonStoreService storeService)
    {
        _teamsService = teamsService;
        _storeService = storeService;
    }

    [HttpPost("test")]
    public async Task<ActionResult<TeamsNotificationResultDto>> TestNotification([FromBody] TeamsNotificationRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.WebhookUrl))
        {
            return BadRequest(new { message = "WebhookUrl is required." });
        }

        var result = await _teamsService.SendNotificationAsync(request);
        return Ok(result);
    }

    [HttpPost("send-reminder")]
    public async Task<ActionResult<TeamsNotificationResultDto>> SendReminder([FromQuery] string projectId, [FromQuery] string milestoneTitle)
    {
        var project = await _storeService.GetProjectByIdAsync(projectId);
        if (project == null) return NotFound(new { message = $"Project {projectId} not found." });

        if (string.IsNullOrWhiteSpace(project.TeamsWebhookUrl))
        {
            return BadRequest(new { message = $"Project {project.ProjectCode} has no Teams Webhook URL configured." });
        }

        var rule = project.Rules.Find(r => r.Title.Equals(milestoneTitle, StringComparison.OrdinalIgnoreCase));
        DateTime targetDate = rule != null ? project.DDay.AddDays(rule.DayOffset) : project.DDay;
        var owners = rule != null ? rule.Owners : new System.Collections.Generic.List<string>();

        var request = new TeamsNotificationRequestDto
        {
            ProjectId = project.Id,
            ProjectCode = project.ProjectCode,
            ProjectName = project.ProjectName,
            MilestoneTitle = milestoneTitle,
            TargetDate = targetDate,
            AdvanceDays = project.AdvanceDays,
            Owners = owners,
            WebhookUrl = project.TeamsWebhookUrl
        };

        var result = await _teamsService.SendNotificationAsync(request);
        return Ok(result);
    }
}
