using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ReportReminder.Api.Core;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;

namespace ReportReminder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly IJsonStoreService _storeService;
    private readonly IContactParserService _parserService;

    public ContactController(IJsonStoreService storeService, IContactParserService parserService)
    {
        _storeService = storeService;
        _parserService = parserService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ContactDto>>> GetContacts([FromQuery] string? query)
    {
        var contacts = await _storeService.GetContactsAsync();
        if (!string.IsNullOrWhiteSpace(query))
        {
            query = query.Trim().ToLowerInvariant();
            contacts = contacts.Where(c =>
                c.Name.ToLowerInvariant().Contains(query) ||
                c.Email.ToLowerInvariant().Contains(query) ||
                c.Department.ToLowerInvariant().Contains(query) ||
                c.Title.ToLowerInvariant().Contains(query)
            ).ToList();
        }
        
        var dtos = contacts.Select(c => c.ToDto()).ToList();
        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<ContactDto>> Create([FromBody] Contact contact)
    {
        if (string.IsNullOrWhiteSpace(contact.Email))
        {
            return BadRequest(Result<ContactDto>.Failure("Contact email is required."));
        }

        if (string.IsNullOrWhiteSpace(contact.Id))
        {
            contact.Id = Guid.NewGuid().ToString();
        }
        contact.Source = "Manual";

        await _storeService.SaveContactsAsync(new[] { contact });
        return Ok(contact.ToDto());
    }

    [HttpPost("import")]
    public async Task<ActionResult<List<ContactDto>>> ImportContacts(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(Result<List<ContactDto>>.Failure("No file uploaded for contact import."));
        }

        string fileName = file.FileName;
        string ext = Path.GetExtension(fileName).ToLowerInvariant();

        using var reader = new StreamReader(file.OpenReadStream());
        string fileText = await reader.ReadToEndAsync();

        Result<List<Contact>> parseResult;

        if (ext == ".vcf")
        {
            parseResult = _parserService.ParseVCard(fileText);
        }
        else // CSV (Outlook CSV)
        {
            parseResult = _parserService.ParseOutlookCsv(fileText);
        }

        if (!parseResult.IsSuccess)
        {
            return BadRequest(Result<List<ContactDto>>.Failure(parseResult.ErrorMessage ?? "Parse failed"));
        }

        var importedContacts = parseResult.Data ?? new List<Contact>();

        await _storeService.SaveContactsAsync(importedContacts);
        
        var allContacts = await _storeService.GetContactsAsync();
        var dtos = allContacts.Select(c => c.ToDto()).ToList();
        
        return Ok(dtos);
    }
}
