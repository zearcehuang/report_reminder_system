using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Moq.Protected;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;
using Xunit;

namespace ReportReminder.Tests;

public class ProjectAndTeamsTests : IDisposable
{
    private readonly string _tempDataDir;

    public ProjectAndTeamsTests()
    {
        _tempDataDir = Path.Combine(Path.GetTempPath(), "report_reminder_test_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempDataDir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDataDir))
        {
            try { Directory.Delete(_tempDataDir, true); } catch { }
        }
    }

    [Fact]
    public async Task JsonStoreService_MultiProjectIsolation_SavesAndRetrievesIndependently()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Storage:DataPath"]).Returns(_tempDataDir);

        var store = new JsonStoreService(configMock.Object, NullLogger<JsonStoreService>.Instance);

        var projectA = new Project { Id = "p-a", ProjectCode = "CODE-A", ProjectName = "Project Alpha" };
        var projectB = new Project { Id = "p-b", ProjectCode = "CODE-B", ProjectName = "Project Beta" };

        await store.SaveProjectAsync(projectA);
        await store.SaveProjectAsync(projectB);

        var projects = await store.GetProjectsAsync();
        Assert.Equal(2, projects.Count);

        var fetchedA = await store.GetProjectByIdAsync("p-a");
        var fetchedB = await store.GetProjectByIdAsync("p-b");

        Assert.NotNull(fetchedA);
        Assert.NotNull(fetchedB);
        Assert.Equal("Project Alpha", fetchedA!.ProjectName);
        Assert.Equal("Project Beta", fetchedB!.ProjectName);

        // Delete A
        await store.DeleteProjectAsync("p-a");
        var remaining = await store.GetProjectsAsync();
        Assert.Single(remaining);
        Assert.Equal("p-b", remaining[0].Id);
    }

    [Fact]
    public void TeamsWebhookService_BuildAdaptiveCardJson_ContainsExpectedFields()
    {
        var service = new TeamsWebhookService(new HttpClient(), NullLogger<TeamsWebhookService>.Instance);

        string json = service.BuildAdaptiveCardJson(
            projectCode: "PRJ-999",
            projectName: "Quantum System",
            milestoneTitle: "Final Acceptance Report",
            targetDate: new DateTime(2026, 12, 31),
            advanceDays: 3,
            owners: new List<string> { "bob@example.com", "charlie@example.com" }
        );

        Assert.Contains("PRJ-999", json);
        Assert.Contains("Quantum System", json);
        Assert.Contains("Final Acceptance Report", json);
        Assert.Contains("2026-12-31", json);
        Assert.Contains("bob@example.com", json);
        Assert.Contains("charlie@example.com", json);
    }

    [Fact]
    public async Task TeamsWebhookService_RetryMechanism_RetriesOnFailureAndSucceeds()
    {
        int callCount = 0;
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(() =>
            {
                callCount++;
                if (callCount < 3)
                {
                    return new HttpResponseMessage(HttpStatusCode.InternalServerError);
                }
                return new HttpResponseMessage(HttpStatusCode.OK);
            });

        var client = new HttpClient(handlerMock.Object);
        var service = new TeamsWebhookService(client, NullLogger<TeamsWebhookService>.Instance);

        var request = new TeamsNotificationRequestDto
        {
            ProjectId = "p-1",
            ProjectCode = "PRJ-001",
            ProjectName = "Test Project",
            MilestoneTitle = "Midterm Report",
            TargetDate = DateTime.Today.AddDays(5),
            AdvanceDays = 3,
            Owners = new List<string> { "dev@example.com" },
            WebhookUrl = "https://example.com/webhook"
        };

        var result = await service.SendNotificationAsync(request, maxRetries: 3, retryDelayMs: 10);

        Assert.True(result.Success);
        Assert.Equal(2, result.RetryCount); // 0-indexed attempt counter (2 retries = 3rd attempt succeeded)
        Assert.Equal(3, callCount);
    }
}
