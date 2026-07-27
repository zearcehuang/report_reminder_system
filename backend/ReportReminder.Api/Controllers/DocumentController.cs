using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;

namespace ReportReminder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentParserService _parserService;
    private readonly IJsonStoreService _storeService;

    public DocumentController(IDocumentParserService parserService, IJsonStoreService storeService)
    {
        _parserService = parserService;
        _storeService = storeService;
    }

    [HttpPost("upload/{projectId}")]
    public async Task<ActionResult<UploadedFileInfo>> Upload(string projectId, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded." });
        }

        var project = await _storeService.GetProjectByIdAsync(projectId);
        if (project == null)
        {
            return NotFound(new { message = $"Project {projectId} not found." });
        }

        var fileInfo = await _parserService.SaveAndParseFileAsync(projectId, file);

        project.UploadedFiles.Add(fileInfo);
        await _storeService.SaveProjectAsync(project);

        return Ok(fileInfo);
    }

    [HttpGet("download/{projectId}/{fileId}")]
    public async Task<IActionResult> Download(string projectId, string fileId)
    {
        var project = await _storeService.GetProjectByIdAsync(projectId);
        if (project == null) return NotFound(new { message = $"Project {projectId} not found." });

        var fileInfo = project.UploadedFiles.FirstOrDefault(f => f.Id == fileId);
        if (fileInfo == null || !System.IO.File.Exists(fileInfo.FilePath))
        {
            return NotFound(new { message = $"File {fileId} not found." });
        }

        byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(fileInfo.FilePath);
        return File(fileBytes, "application/octet-stream", fileInfo.FileName);
    }

    [HttpDelete("{projectId}/{fileId}")]
    public async Task<IActionResult> DeleteFile(string projectId, string fileId)
    {
        var project = await _storeService.GetProjectByIdAsync(projectId);
        if (project == null) return NotFound(new { message = $"Project {projectId} not found." });

        var fileInfo = project.UploadedFiles.FirstOrDefault(f => f.Id == fileId);
        if (fileInfo != null)
        {
            if (System.IO.File.Exists(fileInfo.FilePath))
            {
                try { System.IO.File.Delete(fileInfo.FilePath); } catch { }
            }
            project.UploadedFiles.Remove(fileInfo);
            await _storeService.SaveProjectAsync(project);
        }

        return NoContent();
    }
}
