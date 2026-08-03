using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ReportReminder.Api.Services;
using Xunit;

namespace ReportReminder.Tests;

public class DocumentParserTests
{
    private readonly DocumentParserService _parser;

    public DocumentParserTests()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Storage:UploadsPath"]).Returns("test_uploads");
        var httpClient = new HttpClient();
        _parser = new DocumentParserService(configMock.Object, NullLogger<DocumentParserService>.Instance, httpClient);
    }

    [Fact]
    public async Task ParseTextContentAsync_IsoDate_ExtractsCorrectDateAndTitle()
    {
        string content = "請於 2026-09-30 交付期中報告與簡報資料。";
        var result = await _parser.ParseTextContentAsync("test.txt", content);

        Assert.Single(result.ExtractedItems);
        var item = result.ExtractedItems.First();
        Assert.Equal(new DateTime(2026, 9, 30), item.ExtractedDate);
        Assert.True(item.Confidence > 0.8);
        Assert.Contains("2026-09-30", item.RawText);
    }

    [Fact]
    public async Task ParseTextContentAsync_RocDate_ConvertsToGregorianDate()
    {
        string content = "專案結案報告截止日期為 115年10月25日。";
        var result = await _parser.ParseTextContentAsync("sample.txt", content);

        Assert.Single(result.ExtractedItems);
        var item = result.ExtractedItems.First();
        // 115 + 1911 = 2026
        Assert.Equal(new DateTime(2026, 10, 25), item.ExtractedDate);
        Assert.True(item.Confidence > 0.8);
    }

    [Fact]
    public async Task ParseTextContentAsync_ChineseStandardDate_ExtractsCorrectly()
    {
        string content = "初稿審查會訂於 2026年11月12日 召開。";
        var result = await _parser.ParseTextContentAsync("notice.txt", content);

        Assert.Single(result.ExtractedItems);
        var item = result.ExtractedItems.First();
        Assert.Equal(new DateTime(2026, 11, 12), item.ExtractedDate);
    }

    [Fact]
    public async Task ParseTextContentAsync_MultipleLines_ParsesAllMatchingDates()
    {
        string content = @"專案時程表：
第一階段交付 2026-08-10 繳交
第二階段交付 115年09月15日 送件
結案報告 2026/12/20 審查";

        var result = await _parser.ParseTextContentAsync("schedule.txt", content);

        Assert.Equal(3, result.ExtractedItems.Count);
        Assert.Equal(new DateTime(2026, 8, 10), result.ExtractedItems[0].ExtractedDate);
        Assert.Equal(new DateTime(2026, 9, 15), result.ExtractedItems[1].ExtractedDate);
        Assert.Equal(new DateTime(2026, 12, 20), result.ExtractedItems[2].ExtractedDate);
    }
}
