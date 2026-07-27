using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using DocumentFormat.OpenXml.Packaging;
using ExcelDataReader;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ReportReminder.Api.Models;
using UglyToad.PdfPig;

namespace ReportReminder.Api.Services;

public interface IDocumentParserService
{
    Task<UploadedFileInfo> SaveAndParseFileAsync(string projectId, IFormFile file);
    DocumentPreviewDto ParseTextContent(string fileName, string textContent);
    string UploadsDirectory { get; }
}

public class DocumentParserService : IDocumentParserService
{
    private readonly string _uploadsBaseDir;
    private readonly ILogger<DocumentParserService> _logger;

    public string UploadsDirectory => _uploadsBaseDir;

    public DocumentParserService(IConfiguration configuration, ILogger<DocumentParserService> logger)
    {
        _logger = logger;
        string configuredUploads = configuration["Storage:UploadsPath"] ?? string.Empty;
        if (string.IsNullOrWhiteSpace(configuredUploads))
        {
            _uploadsBaseDir = Path.Combine(AppContext.BaseDirectory, "uploads");
        }
        else
        {
            _uploadsBaseDir = Path.IsPathRooted(configuredUploads)
                ? configuredUploads
                : Path.Combine(AppContext.BaseDirectory, configuredUploads);
        }

        Directory.CreateDirectory(_uploadsBaseDir);

        // Register code pages for ExcelDataReader
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
    }

    public async Task<UploadedFileInfo> SaveAndParseFileAsync(string projectId, IFormFile file)
    {
        string projectUploadDir = Path.Combine(_uploadsBaseDir, projectId);
        Directory.CreateDirectory(projectUploadDir);

        string fileId = Guid.NewGuid().ToString("N");
        string safeFileName = Path.GetFileName(file.FileName);
        string savedFileName = $"{fileId}_{safeFileName}";
        string filePath = Path.Combine(projectUploadDir, savedFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        string extractedText = ExtractTextFromFile(filePath);
        var preview = ParseTextContent(safeFileName, extractedText);

        var uploadedFileInfo = new UploadedFileInfo
        {
            Id = fileId,
            FileName = safeFileName,
            FilePath = filePath,
            FileSize = file.Length,
            UploadedAt = DateTime.UtcNow,
            ExtractedItems = preview.ExtractedItems
        };

        return uploadedFileInfo;
    }

    public string ExtractTextFromFile(string filePath)
    {
        string ext = Path.GetExtension(filePath).ToLowerInvariant();
        try
        {
            switch (ext)
            {
                case ".txt":
                    return File.ReadAllText(filePath, Encoding.UTF8);

                case ".csv":
                    return File.ReadAllText(filePath, Encoding.UTF8);

                case ".pdf":
                    return ExtractTextFromPdf(filePath);

                case ".docx":
                    return ExtractTextFromDocx(filePath);

                case ".xlsx":
                case ".xls":
                    return ExtractTextFromExcel(filePath);

                default:
                    return File.ReadAllText(filePath, Encoding.UTF8);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting text from file {FilePath}", filePath);
            return string.Empty;
        }
    }

    private string ExtractTextFromPdf(string filePath)
    {
        var sb = new StringBuilder();
        using (var pdf = PdfDocument.Open(filePath))
        {
            foreach (var page in pdf.GetPages())
            {
                sb.AppendLine(page.Text);
            }
        }
        return sb.ToString();
    }

    private string ExtractTextFromDocx(string filePath)
    {
        var sb = new StringBuilder();
        using (WordprocessingDocument wordDoc = WordprocessingDocument.Open(filePath, false))
        {
            var body = wordDoc.MainDocumentPart?.Document.Body;
            if (body != null)
            {
                foreach (var param in body.Descendants<DocumentFormat.OpenXml.Wordprocessing.Paragraph>())
                {
                    sb.AppendLine(param.InnerText);
                }
            }
        }
        return sb.ToString();
    }

    private string ExtractTextFromExcel(string filePath)
    {
        var sb = new StringBuilder();
        using (var stream = File.Open(filePath, FileMode.Open, FileAccess.Read))
        {
            using (var reader = ExcelReaderFactory.CreateReader(stream))
            {
                var result = reader.AsDataSet();
                foreach (DataTable table in result.Tables)
                {
                    foreach (DataRow row in table.Rows)
                    {
                        var cells = row.ItemArray.Select(c => c?.ToString() ?? "").Where(c => !string.IsNullOrWhiteSpace(c));
                        sb.AppendLine(string.Join(" ", cells));
                    }
                }
            }
        }
        return sb.ToString();
    }

    public DocumentPreviewDto ParseTextContent(string fileName, string textContent)
    {
        var result = new DocumentPreviewDto
        {
            FileName = fileName,
            ExtractedItems = new List<ParsedItem>()
        };

        if (string.IsNullOrWhiteSpace(textContent))
            return result;

        var lines = textContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);

        // Regex patterns for Dates:
        // 1. ISO: 2026-08-15, 2026/08/15, 2026.08.15
        var isoRegex = new Regex(@"\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b");

        // 2. ROC: 115年8月15日, 民國115/08/15
        var rocRegex = new Regex(@"(?:民國)?\s*([1-9]\d{1,2})\s*[年/.]\s*(0?[1-9]|1[0-2])\s*[月/.]\s*(0?[1-9]|[12]\d|3[01])\s*日?");

        // 3. Standard Chinese Date: 2026年8月15日
        var cnRegex = new Regex(@"(20\d{2})\s*年\s*(0?[1-9]|1[0-2])\s*月\s*(0?[1-9]|[12]\d|3[01])\s*日?");

        var keywords = new[] { "報告", "繳交", "截止", "期中", "期末", "初稿", "結案", "審查", "計畫", "交付", "里程碑", "D-Day", "Milestone" };

        foreach (var line in lines)
        {
            string cleanLine = line.Trim();
            if (cleanLine.Length < 4) continue;

            DateTime? extractedDate = null;

            // Match ISO
            var isoMatch = isoRegex.Match(cleanLine);
            if (isoMatch.Success)
            {
                if (DateTime.TryParse($"{isoMatch.Groups[1].Value}-{isoMatch.Groups[2].Value.PadLeft(2, '0')}-{isoMatch.Groups[3].Value.PadLeft(2, '0')}", out DateTime dt))
                {
                    extractedDate = dt;
                }
            }

            // Match ROC
            if (!extractedDate.HasValue)
            {
                var rocMatch = rocRegex.Match(cleanLine);
                if (rocMatch.Success)
                {
                    if (int.TryParse(rocMatch.Groups[1].Value, out int rocYear) &&
                        int.TryParse(rocMatch.Groups[2].Value, out int month) &&
                        int.TryParse(rocMatch.Groups[3].Value, out int day))
                    {
                        int gregorianYear = rocYear + 1911;
                        if (gregorianYear >= 2000 && gregorianYear <= 2100)
                        {
                            try { extractedDate = new DateTime(gregorianYear, month, day); } catch { }
                        }
                    }
                }
            }

            // Match CN
            if (!extractedDate.HasValue)
            {
                var cnMatch = cnRegex.Match(cleanLine);
                if (cnMatch.Success)
                {
                    if (DateTime.TryParse($"{cnMatch.Groups[1].Value}-{cnMatch.Groups[2].Value.PadLeft(2, '0')}-{cnMatch.Groups[3].Value.PadLeft(2, '0')}", out DateTime dt))
                    {
                        extractedDate = dt;
                    }
                }
            }

            if (extractedDate.HasValue)
            {
                double confidence = 0.7;
                if (keywords.Any(k => cleanLine.Contains(k, StringComparison.OrdinalIgnoreCase)))
                {
                    confidence = 0.95;
                }

                // Extract title by stripping out date text or taking line prefix/suffix
                string titleCandidate = cleanLine;
                if (titleCandidate.Length > 80)
                {
                    titleCandidate = titleCandidate.Substring(0, 80) + "...";
                }

                result.ExtractedItems.Add(new ParsedItem
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Title = titleCandidate,
                    ExtractedDate = extractedDate.Value,
                    RawText = cleanLine,
                    Confidence = confidence
                });
            }
        }

        return result;
    }
}
