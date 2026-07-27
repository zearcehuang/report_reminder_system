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
        if (string.IsNullOrWhiteSpace(text)) return list;
        if (text.StartsWith("\uFEFF")) text = text.Substring(1);

        var rows = new List<List<string>>();
        using (var reader = new StringReader(text))
        {
            string? rawLine;
            while ((rawLine = reader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(rawLine)) continue;
                var row = ParseCsvLine(rawLine);
                if (row.Count > 0) rows.Add(row);
            }
        }

        if (rows.Count < 2) return list;

        var headers = rows[0].Select(h => h.Trim('"', '\'', ' ')).ToList();
        int fnIdx = headers.FindIndex(h => h.Equals("名字", StringComparison.OrdinalIgnoreCase) || h.Equals("First Name", StringComparison.OrdinalIgnoreCase));
        int lnIdx = headers.FindIndex(h => h.Equals("姓氏", StringComparison.OrdinalIgnoreCase) || h.Equals("Last Name", StringComparison.OrdinalIgnoreCase));
        int titleNameIdx = headers.FindIndex(h => h.Equals("稱謂", StringComparison.OrdinalIgnoreCase) || h.Equals("Suffix", StringComparison.OrdinalIgnoreCase));
        int compIdx = headers.FindIndex(h => h.Contains("公司", StringComparison.OrdinalIgnoreCase) || h.Contains("Company", StringComparison.OrdinalIgnoreCase));
        int deptIdx = headers.FindIndex(h => h.Contains("部門", StringComparison.OrdinalIgnoreCase) || h.Contains("Department", StringComparison.OrdinalIgnoreCase));
        int jobIdx = headers.FindIndex(h => h.Contains("職稱", StringComparison.OrdinalIgnoreCase) || h.Contains("Job Title", StringComparison.OrdinalIgnoreCase));
        int email1Idx = headers.FindIndex(h => h.Contains("電子郵件地址", StringComparison.OrdinalIgnoreCase) || h.Contains("E-mail Address", StringComparison.OrdinalIgnoreCase));
        int email2Idx = headers.FindIndex(h => h.Contains("電子郵件 2 地址", StringComparison.OrdinalIgnoreCase));
        int dispNameIdx = headers.FindIndex(h => h.Contains("電子郵件顯示名稱", StringComparison.OrdinalIgnoreCase) || h.Contains("Display Name", StringComparison.OrdinalIgnoreCase));

        var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int r = 1; r < rows.Count; r++)
        {
            var row = rows[r];
            string GetVal(int idx) => (idx >= 0 && idx < row.Count) ? row[idx].Trim('"', '\'', ' ') : "";

            string firstName = GetVal(fnIdx);
            string lastName = GetVal(lnIdx);
            string titleName = GetVal(titleNameIdx);
            string company = GetVal(compIdx);
            string dept = GetVal(deptIdx);
            string jobTitle = GetVal(jobIdx);
            string emailDispName = GetVal(dispNameIdx);

            string email = GetVal(email1Idx);
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@') || email.StartsWith("/o="))
            {
                email = GetVal(email2Idx);
            }
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@') || email.StartsWith("/o="))
            {
                var lineStr = string.Join(" ", row);
                var match = Regex.Match(lineStr, @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}");
                if (match.Success) email = match.Value;
            }

            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@') || email.StartsWith("/o=")) continue;
            if (seenEmails.Contains(email)) continue;
            seenEmails.Add(email);

            string displayName = "";
            if (!string.IsNullOrWhiteSpace(lastName) || !string.IsNullOrWhiteSpace(firstName))
            {
                bool isEn = Regex.IsMatch((lastName + firstName).Trim(), @"^[A-Za-z0-9\s._-]+$");
                displayName = isEn ? $"{firstName} {lastName}".Trim() : $"{lastName}{firstName}";
                if (!string.IsNullOrWhiteSpace(titleName) && !displayName.Contains(titleName))
                {
                    displayName += $" {titleName}";
                }
            }
            else if (!string.IsNullOrWhiteSpace(emailDispName) && emailDispName != email && !emailDispName.StartsWith("/o="))
            {
                displayName = emailDispName;
            }
            else
            {
                displayName = email.Split('@')[0];
            }

            string department = !string.IsNullOrWhiteSpace(dept) ? dept : (!string.IsNullOrWhiteSpace(company) ? company : "通用聯絡人");

            list.Add(new Contact
            {
                Id = Guid.NewGuid().ToString(),
                Name = displayName,
                Email = email,
                Department = department,
                Title = jobTitle,
                Source = "OutlookCSV"
            });
        }

        return list;
    }

    private List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var curr = new System.Text.StringBuilder();

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    curr.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(curr.ToString().Trim());
                curr.Clear();
            }
            else
            {
                curr.Append(c);
            }
        }
        result.Add(curr.ToString().Trim());
        return result;
    }
}
