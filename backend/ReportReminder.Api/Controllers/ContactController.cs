using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;

namespace ReportReminder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly IJsonStoreService _storeService;

    public ContactController(IJsonStoreService storeService)
    {
        _storeService = storeService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Contact>>> GetContacts([FromQuery] string? query)
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
        return Ok(contacts);
    }

    [HttpPost]
    public async Task<ActionResult<Contact>> Create([FromBody] Contact contact)
    {
        if (string.IsNullOrWhiteSpace(contact.Email))
        {
            return BadRequest(new { message = "Contact email is required." });
        }

        if (string.IsNullOrWhiteSpace(contact.Id))
        {
            contact.Id = Guid.NewGuid().ToString();
        }
        contact.Source = "Manual";

        await _storeService.SaveContactsAsync(new[] { contact });
        return Ok(contact);
    }

    [HttpPost("import")]
    public async Task<ActionResult<List<Contact>>> ImportContacts(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded for contact import." });
        }

        string fileName = file.FileName;
        string ext = Path.GetExtension(fileName).ToLowerInvariant();

        using var reader = new StreamReader(file.OpenReadStream());
        string fileText = await reader.ReadToEndAsync();

        var importedContacts = new List<Contact>();

        if (ext == ".vcf")
        {
            importedContacts = ParseVCard(fileText);
        }
        else // CSV (Outlook CSV)
        {
            importedContacts = ParseOutlookCsv(fileText);
        }

        await _storeService.SaveContactsAsync(importedContacts);
        var allContacts = await _storeService.GetContactsAsync();
        return Ok(allContacts);
    }

    private List<Contact> ParseVCard(string text)
    {
        var list = new List<Contact>();
        var cards = text.Split(new[] { "BEGIN:VCARD" }, StringSplitOptions.RemoveEmptyEntries);

        foreach (var card in cards)
        {
            if (!card.Contains("END:VCARD")) continue;

            string name = string.Empty;
            string email = string.Empty;
            string dept = string.Empty;
            string title = string.Empty;

            var lines = card.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines)
            {
                if (line.StartsWith("FN:", StringComparison.OrdinalIgnoreCase))
                {
                    name = line.Substring(3).Trim();
                }
                else if (line.StartsWith("EMAIL", StringComparison.OrdinalIgnoreCase))
                {
                    int colonIdx = line.IndexOf(':');
                    if (colonIdx >= 0) email = line.Substring(colonIdx + 1).Trim();
                }
                else if (line.StartsWith("ORG:", StringComparison.OrdinalIgnoreCase))
                {
                    dept = line.Substring(4).Trim();
                }
                else if (line.StartsWith("TITLE:", StringComparison.OrdinalIgnoreCase))
                {
                    title = line.Substring(6).Trim();
                }
            }

            if (!string.IsNullOrWhiteSpace(email))
            {
                list.Add(new Contact
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = string.IsNullOrWhiteSpace(name) ? email.Split('@')[0] : name,
                    Email = email,
                    Department = dept,
                    Title = title,
                    Source = "vCard"
                });
            }
        }

        return list;
    }

    private List<Contact> ParseOutlookCsv(string text)
    {
        var list = new List<Contact>();
        using var reader = new StringReader(text);
        string? headerLine = reader.ReadLine();
        if (headerLine == null) return list;

        var headers = headerLine.Split(',').Select(h => h.Trim('"').Trim()).ToArray();
        int nameIdx = Array.FindIndex(headers, h => h.Contains("Name", StringComparison.OrdinalIgnoreCase) || h.Contains("姓名", StringComparison.OrdinalIgnoreCase));
        int emailIdx = Array.FindIndex(headers, h => h.Contains("E-mail", StringComparison.OrdinalIgnoreCase) || h.Contains("Email", StringComparison.OrdinalIgnoreCase) || h.Contains("郵件", StringComparison.OrdinalIgnoreCase));
        int deptIdx = Array.FindIndex(headers, h => h.Contains("Department", StringComparison.OrdinalIgnoreCase) || h.Contains("部門", StringComparison.OrdinalIgnoreCase));
        int titleIdx = Array.FindIndex(headers, h => h.Contains("Title", StringComparison.OrdinalIgnoreCase) || h.Contains("職稱", StringComparison.OrdinalIgnoreCase));

        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            var parts = line.Split(',').Select(p => p.Trim('"').Trim()).ToArray();

            string email = (emailIdx >= 0 && emailIdx < parts.Length) ? parts[emailIdx] : "";
            if (string.IsNullOrWhiteSpace(email))
            {
                // Try regex search for email in line
                var match = Regex.Match(line, @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}");
                if (match.Success) email = match.Value;
            }

            if (!string.IsNullOrWhiteSpace(email))
            {
                string name = (nameIdx >= 0 && nameIdx < parts.Length) ? parts[nameIdx] : email.Split('@')[0];
                string dept = (deptIdx >= 0 && deptIdx < parts.Length) ? parts[deptIdx] : "";
                string title = (titleIdx >= 0 && titleIdx < parts.Length) ? parts[titleIdx] : "";

                list.Add(new Contact
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = string.IsNullOrWhiteSpace(name) ? email.Split('@')[0] : name,
                    Email = email,
                    Department = dept,
                    Title = title,
                    Source = "OutlookCSV"
                });
            }
        }

        return list;
    }
}
