using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using ReportReminder.Api.Models;

namespace ReportReminder.Api.Services;

public interface ITeamsWebhookService
{
    string BuildAdaptiveCardJson(string projectCode, string projectName, string milestoneTitle, DateTime targetDate, int advanceDays, List<string> owners);
    Task<TeamsNotificationResultDto> SendNotificationAsync(TeamsNotificationRequestDto request, int maxRetries = 3, int retryDelayMs = 200);
}

public class TeamsWebhookService : ITeamsWebhookService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TeamsWebhookService> _logger;

    public TeamsWebhookService(HttpClient httpClient, ILogger<TeamsWebhookService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string BuildAdaptiveCardJson(string projectCode, string projectName, string milestoneTitle, DateTime targetDate, int advanceDays, List<string> owners)
    {
        string formattedOwners = (owners != null && owners.Count > 0)
            ? string.Join(", ", owners.Select(o => o.Contains("@") ? o : $"@{o}"))
            : "Unassigned";

        string dateStr = targetDate.ToString("yyyy-MM-dd");
        string advanceNoticeStr = advanceDays > 0 ? $"提前 {advanceDays} 天預警提醒" : "當日截止提醒";

        var cardObject = new
        {
            type = "message",
            attachments = new[]
            {
                new
                {
                    contentType = "application/vnd.microsoft.card.adaptive",
                    content = new
                    {
                        type = "AdaptiveCard",
                        body = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                size = "Large",
                                weight = "Bolder",
                                text = $"🔔 [報告催繳提醒] {projectCode} - {milestoneTitle}",
                                color = "Attention"
                            },
                            new
                            {
                                type = "TextBlock",
                                text = $"專案名稱：{projectName}",
                                isSubtle = true,
                                wrap = true
                            },
                            new
                            {
                                type = "FactSet",
                                facts = new[]
                                {
                                    new { title = "專案代碼", value = projectCode },
                                    new { title = "里程碑項目", value = milestoneTitle },
                                    new { title = "應繳交日期", value = dateStr },
                                    new { title = "提醒機制", value = advanceNoticeStr },
                                    new { title = "負責人員", value = formattedOwners }
                                }
                            },
                            new
                            {
                                type = "TextBlock",
                                text = $"⚠️ 請相關負責人員 ({formattedOwners}) 儘速完成報告並儲存上傳！",
                                wrap = true,
                                weight = "Bolder"
                            }
                        },
                        schema = "http://adaptivecards.io/schemas/adaptive-card.json",
                        version = "1.4"
                    }
                }
            }
        };

        return JsonSerializer.Serialize(cardObject, new JsonSerializerOptions { WriteIndented = true });
    }

    public async Task<TeamsNotificationResultDto> SendNotificationAsync(TeamsNotificationRequestDto request, int maxRetries = 3, int retryDelayMs = 200)
    {
        var result = new TeamsNotificationResultDto
        {
            Success = false,
            RetryCount = 0,
            Timestamp = DateTime.UtcNow
        };

        if (string.IsNullOrWhiteSpace(request.WebhookUrl))
        {
            result.StatusMessage = "Webhook URL is empty or invalid.";
            return result;
        }

        string jsonContent = BuildAdaptiveCardJson(
            request.ProjectCode,
            request.ProjectName,
            request.MilestoneTitle,
            request.TargetDate,
            request.AdvanceDays,
            request.Owners
        );

        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            result.RetryCount = attempt - 1;
            try
            {
                using var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(request.WebhookUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    result.Success = true;
                    result.StatusMessage = $"Notification successfully delivered on attempt {attempt}.";
                    _logger.LogInformation("Teams webhook delivered successfully to project {ProjectCode}.", request.ProjectCode);
                    return result;
                }
                else
                {
                    result.StatusMessage = $"HTTP Error {(int)response.StatusCode}: {response.ReasonPhrase}";
                    _logger.LogWarning("Teams webhook attempt {Attempt} failed with status {StatusCode}.", attempt, response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                result.StatusMessage = $"Exception on attempt {attempt}: {ex.Message}";
                _logger.LogWarning(ex, "Exception sending Teams webhook on attempt {Attempt}.", attempt);
            }

            if (attempt < maxRetries && retryDelayMs > 0)
            {
                await Task.Delay(retryDelayMs);
            }
        }

        return result;
    }
}
