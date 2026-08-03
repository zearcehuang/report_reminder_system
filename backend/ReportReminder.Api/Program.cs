using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ReportReminder.Api.Services;
using ReportReminder.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Services DI
builder.Services.AddSingleton<IJsonStoreService, JsonStoreService>();
builder.Services.AddHttpClient<IDgpaHolidayService, DgpaHolidayService>();
builder.Services.AddHttpClient<IDocumentParserService, DocumentParserService>();
builder.Services.AddHttpClient<ITeamsWebhookService, TeamsWebhookService>();
builder.Services.AddHostedService<ReminderBackgroundService>();

builder.WebHost.UseUrls("http://*:5000");

var app = builder.Build();

// Configure HTTP request pipeline.
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
