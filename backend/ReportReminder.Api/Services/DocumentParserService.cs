using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
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
    Task<UploadedFileInfo> SaveAndParseFileAsync(string projectId, IFormFile file, CancellationToken cancellationToken = default);
    Task<DocumentPreviewDto> ParseTextContentAsync(string fileName, string textContent, CancellationToken cancellationToken = default);
    string UploadsDirectory { get; }
}

public class DocumentParserService : IDocumentParserService
{
    private readonly string _uploadsBaseDir;
    private readonly ILogger<DocumentParserService> _logger;
    private readonly HttpClient _httpClient;

    private static readonly Regex IsoRegex = new Regex(@"\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b", RegexOptions.Compiled);
    private static readonly Regex RocRegex = new Regex(@"(?:民國)?\s*([1-9]\d{1,2})\s*[年/.]\s*(0?[1-9]|1[0-2])\s*[月/.]\s*(0?[1-9]|[12]\d|3[01])\s*日?", RegexOptions.Compiled);
    private static readonly Regex CnRegex = new Regex(@"(20\d{2})\s*年\s*(0?[1-9]|1[0-2])\s*月\s*(0?[1-9]|[12]\d|3[01])\s*日?", RegexOptions.Compiled);
    private static readonly string[] Keywords = new[] { "報告", "繳交", "截止", "期中", "期末", "初稿", "結案", "審查", "計畫", "交付", "里程碑", "D-Day", "Milestone" };

    public string UploadsDirectory => _uploadsBaseDir;

    public DocumentParserService(IConfiguration configuration, ILogger<DocumentParserService> logger, HttpClient httpClient)
    {
        _logger = logger;
        _httpClient = httpClient;
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
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
    }

    public async Task<UploadedFileInfo> SaveAndParseFileAsync(string projectId, IFormFile file, CancellationToken cancellationToken = default)
    {
        string projectUploadDir = Path.Combine(_uploadsBaseDir, projectId);
        Directory.CreateDirectory(projectUploadDir);

        string fileId = Guid.NewGuid().ToString("N");
        string safeFileName = Path.GetFileName(file.FileName);
        string savedFileName = $"{fileId}_{safeFileName}";
        string filePath = Path.Combine(projectUploadDir, savedFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        string extractedText = ExtractTextFromFile(filePath);
        var preview = await ParseTextContentAsync(safeFileName, extractedText, cancellationToken);

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
                case ".csv":
                case ".md":
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

    public async Task<DocumentPreviewDto> ParseTextContentAsync(string fileName, string textContent, CancellationToken cancellationToken = default)
    {
        var llmResult = await ParseWithLlmAsync(fileName, textContent, cancellationToken);
        if (llmResult != null && llmResult.ExtractedItems != null && llmResult.ExtractedItems.Any())
        {
            return llmResult;
        }

        return ParseHeuristic(fileName, textContent);
    }

    private async Task<DocumentPreviewDto?> ParseWithLlmAsync(string fileName, string textContent, CancellationToken cancellationToken = default)
    {
        string? openAiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        string? geminiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        if (string.IsNullOrWhiteSpace(openAiKey) && string.IsNullOrWhiteSpace(geminiKey))
            return null;

        try
        {
            if (!string.IsNullOrWhiteSpace(openAiKey))
                return await CallOpenAiAsync(fileName, textContent, openAiKey, cancellationToken);
            else if (!string.IsNullOrWhiteSpace(geminiKey))
                return await CallGeminiAsync(fileName, textContent, geminiKey, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LLM parsing failed. Falling back to heuristic.");
        }
        return null;
    }

    private async Task<DocumentPreviewDto?> CallOpenAiAsync(string fileName, string textContent, string apiKey, CancellationToken cancellationToken = default)
    {
        string prompt = GetLlmPrompt(fileName, textContent);
        var requestBody = new
        {
            model = "gpt-4o",
            response_format = new { type = "json_object" },
            messages = new[] { new { role = "system", content = prompt } }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(15));

        var response = await _httpClient.SendAsync(request, cts.Token);
        if (!response.IsSuccessStatusCode) throw new Exception($"OpenAI Error: {response.StatusCode}");

        var responseString = await response.Content.ReadAsStringAsync(cts.Token);
        using var document = JsonDocument.Parse(responseString);
        string content = document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";

        return FormatLlmResult(content, fileName);
    }

    private async Task<DocumentPreviewDto?> CallGeminiAsync(string fileName, string textContent, string apiKey, CancellationToken cancellationToken = default)
    {
        string prompt = GetLlmPrompt(fileName, textContent);
        var requestBody = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { responseMimeType = "application/json" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={apiKey}");
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(15));

        var response = await _httpClient.SendAsync(request, cts.Token);
        if (!response.IsSuccessStatusCode) throw new Exception($"Gemini Error: {response.StatusCode}");

        var responseString = await response.Content.ReadAsStringAsync(cts.Token);
        using var document = JsonDocument.Parse(responseString);
        string content = document.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";

        return FormatLlmResult(content, fileName);
    }

    private string GetLlmPrompt(string fileName, string text)
    {
        string truncatedText = text.Length > 10000 ? text.Substring(0, 10000) : text;
        return $@"You are an expert contract analyst. Extract project milestones from the following contract text.
For each milestone, extract the following 5 dimensions:
1. title (String)
2. dayOffset (Number, D+N days)
3. deliverables (Array of Strings)
4. penaltyTerms (String)
5. clauseReference (String)

Return JSON format: {{ ""milestones"": [ {{ ""title"": ""..."", ""dayOffset"": 30, ""deliverables"": [""...""], ""penaltyTerms"": ""..."", ""clauseReference"": ""..."" }} ] }}

Contract Name: {fileName}
Text: {truncatedText}";
    }

    private DocumentPreviewDto FormatLlmResult(string jsonContent, string fileName)
    {
        var result = new DocumentPreviewDto { FileName = fileName, ExtractedItems = new List<ParsedItem>() };
        try
        {
            jsonContent = CleanJsonString(jsonContent);
            using var doc = JsonDocument.Parse(jsonContent);
            if (doc.RootElement.TryGetProperty("milestones", out var milestones))
            {
                foreach (var m in milestones.EnumerateArray())
                {
                    int dayOffset = m.TryGetProperty("dayOffset", out var dObj) && dObj.ValueKind == JsonValueKind.Number ? dObj.GetInt32() : 30;
                    string title = m.TryGetProperty("title", out var tObj) ? tObj.GetString() ?? "Unknown Milestone" : "Unknown Milestone";
                    
                    var deliverables = new List<string>();
                    if (m.TryGetProperty("deliverables", out var deliv) && deliv.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var d in deliv.EnumerateArray()) deliverables.Add(d.GetString() ?? "");
                    }

                    string penaltyTerms = m.TryGetProperty("penaltyTerms", out var pObj) ? pObj.GetString() ?? "" : "";
                    string clauseRef = m.TryGetProperty("clauseReference", out var cObj) ? cObj.GetString() ?? "" : "";

                    result.ExtractedItems.Add(new ParsedItem
                    {
                        Id = Guid.NewGuid().ToString("N"),
                        Title = title,
                        ExtractedDate = DateTime.UtcNow.AddDays(dayOffset),
                        RawText = $"AI parsed from: {fileName}",
                        Confidence = 0.95,
                        Deliverables = deliverables,
                        PenaltyTerms = penaltyTerms,
                        ClauseReference = clauseRef,
                        DayOffset = dayOffset
                    });
                }
            }
        }
        catch { }
        return result;
    }

    private string CleanJsonString(string str)
    {
        if (string.IsNullOrWhiteSpace(str)) return "{}";
        string clean = str.Trim();
        if (clean.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
            clean = clean.Substring(7);
        else if (clean.StartsWith("```", StringComparison.OrdinalIgnoreCase))
            clean = clean.Substring(3);
        if (clean.EndsWith("```"))
            clean = clean.Substring(0, clean.Length - 3);

        clean = clean.Trim();
        int firstBrace = clean.IndexOf('{');
        int lastBrace = clean.LastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace >= firstBrace)
        {
            return clean.Substring(firstBrace, lastBrace - firstBrace + 1);
        }
        return clean;
    }

    private DocumentPreviewDto ParseHeuristic(string fileName, string textContent)
    {
        var result = new DocumentPreviewDto { FileName = fileName, ExtractedItems = new List<ParsedItem>() };
        if (string.IsNullOrWhiteSpace(textContent)) return result;

        var lines = textContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            string cleanLine = line.Trim();
            if (cleanLine.Length < 4) continue;

            DateTime? extractedDate = null;

            var isoMatch = IsoRegex.Match(cleanLine);
            if (isoMatch.Success)
            {
                if (DateTime.TryParse($"{isoMatch.Groups[1].Value}-{isoMatch.Groups[2].Value.PadLeft(2, '0')}-{isoMatch.Groups[3].Value.PadLeft(2, '0')}", out DateTime dt))
                    extractedDate = dt;
            }

            if (!extractedDate.HasValue)
            {
                var rocMatch = RocRegex.Match(cleanLine);
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

            if (!extractedDate.HasValue)
            {
                var cnMatch = CnRegex.Match(cleanLine);
                if (cnMatch.Success)
                {
                    if (DateTime.TryParse($"{cnMatch.Groups[1].Value}-{cnMatch.Groups[2].Value.PadLeft(2, '0')}-{cnMatch.Groups[3].Value.PadLeft(2, '0')}", out DateTime dt))
                        extractedDate = dt;
                }
            }

            if (extractedDate.HasValue)
            {
                double confidence = 0.7;
                if (Keywords.Any(k => cleanLine.Contains(k, StringComparison.OrdinalIgnoreCase)))
                    confidence = 0.95;

                string titleCandidate = cleanLine.Length > 80 ? cleanLine.Substring(0, 80) + "..." : cleanLine;

                result.ExtractedItems.Add(new ParsedItem
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Title = titleCandidate,
                    ExtractedDate = extractedDate.Value,
                    RawText = cleanLine,
                    Confidence = confidence,
                    DayOffset = 30, // fallback value
                    Deliverables = new List<string> { titleCandidate },
                    PenaltyTerms = "逾期每日按本案合約總價千分之一計罰違約金",
                    ClauseReference = "參照標案需求說明書"
                });
            }
        }

        return result;
    }
}
