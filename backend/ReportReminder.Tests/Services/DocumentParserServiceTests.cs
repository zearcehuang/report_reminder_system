using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using ReportReminder.Api.Services;
using Xunit;

namespace ReportReminder.Tests.Services;

public class DocumentParserServiceTests
{
    private readonly Mock<IConfiguration> _configMock;
    private readonly Mock<ILogger<DocumentParserService>> _loggerMock;
    private readonly HttpClient _httpClient;
    private readonly DocumentParserService _service;

    public DocumentParserServiceTests()
    {
        _configMock = new Mock<IConfiguration>();
        _configMock.Setup(c => c["Storage:UploadsPath"]).Returns("test_uploads");
        _loggerMock = new Mock<ILogger<DocumentParserService>>();
        _httpClient = new HttpClient();

        _service = new DocumentParserService(_configMock.Object, _loggerMock.Object, _httpClient);
    }

    [Fact]
    public async Task ParseTextContentAsync_ShouldReturnHeuristic_WhenNoApiKeys()
    {
        // Arrange
        // Assuming no API keys are set in env
        string text = "2026年8月15日需繳交計畫書。逾期每日按本案合約總價千分之一計罰違約金";

        // Act
        var result = await _service.ParseTextContentAsync("test.txt", text);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.ExtractedItems);
        var item = result.ExtractedItems[0];
        Assert.Contains("計畫書", item.Title);
        Assert.Equal(30, item.DayOffset);
        Assert.Equal(0.90, item.Confidence);
    }
}
