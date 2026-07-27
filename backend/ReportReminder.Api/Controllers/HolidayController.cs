using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;

namespace ReportReminder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HolidayController : ControllerBase
{
    private readonly IDgpaHolidayService _holidayService;
    private readonly IJsonStoreService _storeService;

    public HolidayController(IDgpaHolidayService holidayService, IJsonStoreService storeService)
    {
        _holidayService = holidayService;
        _storeService = storeService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Holiday>>> GetAll()
    {
        var holidays = await _storeService.GetHolidaysAsync();
        return Ok(holidays);
    }

    [HttpPost("sync")]
    public async Task<ActionResult<List<Holiday>>> SyncDgpa([FromQuery] int? year)
    {
        int targetYear = year ?? DateTime.Now.Year;
        var fetched = await _holidayService.SyncDgpaHolidaysAsync(targetYear);
        await _storeService.SaveHolidaysAsync(fetched);
        
        var allHolidays = await _storeService.GetHolidaysAsync();
        return Ok(allHolidays);
    }

    [HttpPost("import")]
    public async Task<ActionResult<List<Holiday>>> ImportCustom(IFormFile? file, [FromQuery] string? format = "csv")
    {
        string content = string.Empty;

        if (file != null && file.Length > 0)
        {
            using var reader = new StreamReader(file.OpenReadStream());
            content = await reader.ReadToEndAsync();
            string ext = Path.GetExtension(file.FileName).TrimStart('.').ToLower();
            if (!string.IsNullOrEmpty(ext)) format = ext;
        }
        else
        {
            using var reader = new StreamReader(Request.Body);
            content = await reader.ReadToEndAsync();
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            return BadRequest(new { message = "Empty content provided for holiday import." });
        }

        var imported = _holidayService.ParseCustomHolidays(content, format ?? "csv");
        await _storeService.SaveHolidaysAsync(imported);

        var updatedList = await _storeService.GetHolidaysAsync();
        return Ok(updatedList);
    }
}
