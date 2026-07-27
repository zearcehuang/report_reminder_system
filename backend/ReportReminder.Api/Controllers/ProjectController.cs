using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;

namespace ReportReminder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectController : ControllerBase
{
    private readonly IJsonStoreService _storeService;

    public ProjectController(IJsonStoreService storeService)
    {
        _storeService = storeService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Project>>> GetAll()
    {
        var projects = await _storeService.GetProjectsAsync();
        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetById(string id)
    {
        var project = await _storeService.GetProjectByIdAsync(id);
        if (project == null) return NotFound(new { message = $"Project with ID {id} not found." });
        return Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<Project>> Create([FromBody] Project project)
    {
        if (string.IsNullOrWhiteSpace(project.ProjectCode) || string.IsNullOrWhiteSpace(project.ProjectName))
        {
            return BadRequest(new { message = "ProjectCode and ProjectName are required." });
        }

        if (string.IsNullOrWhiteSpace(project.Id))
        {
            project.Id = Guid.NewGuid().ToString();
        }
        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = DateTime.UtcNow;

        await _storeService.SaveProjectAsync(project);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Project>> Update(string id, [FromBody] Project updated)
    {
        var existing = await _storeService.GetProjectByIdAsync(id);
        if (existing == null) return NotFound(new { message = $"Project with ID {id} not found." });

        updated.Id = id;
        updated.CreatedAt = existing.CreatedAt;
        updated.UploadedFiles = existing.UploadedFiles; // Preserve existing files unless modified
        updated.UpdatedAt = DateTime.UtcNow;

        await _storeService.SaveProjectAsync(updated);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _storeService.GetProjectByIdAsync(id);
        if (existing == null) return NotFound(new { message = $"Project with ID {id} not found." });

        await _storeService.DeleteProjectAsync(id);
        return NoContent();
    }
}
