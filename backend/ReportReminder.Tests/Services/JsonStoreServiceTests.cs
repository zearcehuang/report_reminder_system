using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using ReportReminder.Api.Models;
using ReportReminder.Api.Services;
using Xunit;

namespace ReportReminder.Tests.Services;

public class JsonStoreServiceTests : IDisposable
{
    private readonly string _testDataDir;
    private readonly IConfiguration _config;
    private readonly Mock<ILogger<JsonStoreService>> _loggerMock;
    private readonly JsonStoreService _service;

    public JsonStoreServiceTests()
    {
        _testDataDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        var myConfiguration = new Dictionary<string, string>
        {
            {"Storage:DataPath", _testDataDir}
        };

        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(myConfiguration)
            .Build();

        _loggerMock = new Mock<ILogger<JsonStoreService>>();
        _service = new JsonStoreService(_config, _loggerMock.Object);
    }

    [Fact]
    public async Task SaveProjectAsync_ShouldBeThreadSafe()
    {
        // Arrange
        int taskCount = 100;
        var tasks = new List<Task>();
        
        // Act
        for (int i = 0; i < taskCount; i++)
        {
            var p = new Project { Id = $"proj_{i}", ProjectName = $"Proj {i}" };
            tasks.Add(Task.Run(() => _service.SaveProjectAsync(p)));
        }

        await Task.WhenAll(tasks);

        // Assert
        var projects = await _service.GetProjectsAsync();
        Assert.Equal(taskCount, projects.Count);
    }

    [Fact]
    public async Task GetProjectsAsync_ShouldReturnFromCacheAfterFirstRead()
    {
        // Arrange
        var p = new Project { Id = "cache_test", ProjectName = "Cache Proj" };
        await _service.SaveProjectAsync(p);

        // Delete underlying file to prove it reads from cache
        var path = Path.Combine(_testDataDir, "projects.json");
        File.Delete(path);

        // Act
        var projects = await _service.GetProjectsAsync();

        // Assert
        Assert.Single(projects);
        Assert.Equal("cache_test", projects[0].Id);
    }

    public void Dispose()
    {
        if (Directory.Exists(_testDataDir))
        {
            Directory.Delete(_testDataDir, true);
        }
    }
}
