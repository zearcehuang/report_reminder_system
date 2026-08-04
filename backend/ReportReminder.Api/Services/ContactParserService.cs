using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using ReportReminder.Api.Core;
using ReportReminder.Api.Models;

namespace ReportReminder.Api.Services;

public class ContactParserService : IContactParserService
{
    public Result<List<Contact>> ParseVCard(string text)
    {
        try
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

            return Result<List<Contact>>.Success(list);
        }
        catch (Exception ex)
        {
            return Result<List<Contact>>.Failure($"Failed to parse vCard file: {ex.Message}");
        }
    }

    public Result<List<Contact>> ParseOutlookCsv(string text)
    {
        try
        {
            var list = new List<Contact>();
            if (string.IsNullOrWhiteSpace(text)) return Result<List<Contact>>.Success(list);
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

            if (rows.Count < 2) return Result<List<Contact>>.Success(list);

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

            return Result<List<Contact>>.Success(list);
        }
        catch (Exception ex)
        {
            return Result<List<Contact>>.Failure($"Failed to parse CSV file: {ex.Message}");
        }
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
