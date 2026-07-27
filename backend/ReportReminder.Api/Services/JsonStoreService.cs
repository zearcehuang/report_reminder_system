using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ReportReminder.Api.Models;

namespace ReportReminder.Api.Services;

public interface IJsonStoreService
{
    Task<List<Project>> GetProjectsAsync();
    Task<Project?> GetProjectByIdAsync(string id);
    Task SaveProjectAsync(Project project);
    Task DeleteProjectAsync(string id);

    Task<List<Holiday>> GetHolidaysAsync();
    Task SaveHolidaysAsync(IEnumerable<Holiday> holidays);

    Task<List<Contact>> GetContactsAsync();
    Task SaveContactsAsync(IEnumerable<Contact> contacts);
}

public class JsonStoreService : IJsonStoreService
{
    private readonly string _dataDir;
    private readonly string _projectsFilePath;
    private readonly string _holidaysFilePath;
    private readonly string _contactsFilePath;
    private readonly ILogger<JsonStoreService> _logger;

    private static readonly SemaphoreSlim _projectsLock = new(1, 1);
    private static readonly SemaphoreSlim _holidaysLock = new(1, 1);
    private static readonly SemaphoreSlim _contactsLock = new(1, 1);

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public JsonStoreService(IConfiguration configuration, ILogger<JsonStoreService> logger)
    {
        _logger = logger;
        
        string configuredDataPath = configuration["Storage:DataPath"] ?? string.Empty;
        if (string.IsNullOrWhiteSpace(configuredDataPath))
        {
            _dataDir = Path.Combine(AppContext.BaseDirectory, "data");
        }
        else
        {
            _dataDir = Path.IsPathRooted(configuredDataPath)
                ? configuredDataPath
                : Path.Combine(AppContext.BaseDirectory, configuredDataPath);
        }

        Directory.CreateDirectory(_dataDir);

        _projectsFilePath = Path.Combine(_dataDir, "projects.json");
        _holidaysFilePath = Path.Combine(_dataDir, "holidays.json");
        _contactsFilePath = Path.Combine(_dataDir, "contacts.json");

        EnsureFilesExist();
    }

    private void EnsureFilesExist()
    {
        if (!File.Exists(_projectsFilePath))
        {
            File.WriteAllText(_projectsFilePath, "[]");
        }
        if (!File.Exists(_holidaysFilePath))
        {
            File.WriteAllText(_holidaysFilePath, "[]");
        }
        if (!File.Exists(_contactsFilePath))
        {
            File.WriteAllText(_contactsFilePath, "[]");
        }
    }

    #region Projects
    public async Task<List<Project>> GetProjectsAsync()
    {
        await _projectsLock.WaitAsync();
        try
        {
            if (!File.Exists(_projectsFilePath)) return new List<Project>();
            string json = await File.ReadAllTextAsync(_projectsFilePath);
            return JsonSerializer.Deserialize<List<Project>>(json, _jsonOptions) ?? new List<Project>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading projects.json");
            return new List<Project>();
        }
        finally
        {
            _projectsLock.Release();
        }
    }

    public async Task<Project?> GetProjectByIdAsync(string id)
    {
        var projects = await GetProjectsAsync();
        return projects.FirstOrDefault(p => p.Id == id);
    }

    public async Task SaveProjectAsync(Project project)
    {
        await _projectsLock.WaitAsync();
        try
        {
            List<Project> projects = new();
            if (File.Exists(_projectsFilePath))
            {
                string json = await File.ReadAllTextAsync(_projectsFilePath);
                projects = JsonSerializer.Deserialize<List<Project>>(json, _jsonOptions) ?? new List<Project>();
            }

            int index = projects.FindIndex(p => p.Id == project.Id);
            project.UpdatedAt = DateTime.UtcNow;
            if (index >= 0)
            {
                projects[index] = project;
            }
            else
            {
                projects.Add(project);
            }

            string updatedJson = JsonSerializer.Serialize(projects, _jsonOptions);
            await File.WriteAllTextAsync(_projectsFilePath, updatedJson);
        }
        finally
        {
            _projectsLock.Release();
        }
    }

    public async Task DeleteProjectAsync(string id)
    {
        await _projectsLock.WaitAsync();
        try
        {
            if (!File.Exists(_projectsFilePath)) return;
            string json = await File.ReadAllTextAsync(_projectsFilePath);
            var projects = JsonSerializer.Deserialize<List<Project>>(json, _jsonOptions) ?? new List<Project>();
            projects.RemoveAll(p => p.Id == id);

            string updatedJson = JsonSerializer.Serialize(projects, _jsonOptions);
            await File.WriteAllTextAsync(_projectsFilePath, updatedJson);
        }
        finally
        {
            _projectsLock.Release();
        }
    }
    #endregion

    #region Holidays
    public async Task<List<Holiday>> GetHolidaysAsync()
    {
        await _holidaysLock.WaitAsync();
        try
        {
            if (!File.Exists(_holidaysFilePath)) return new List<Holiday>();
            string json = await File.ReadAllTextAsync(_holidaysFilePath);
            return JsonSerializer.Deserialize<List<Holiday>>(json, _jsonOptions) ?? new List<Holiday>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading holidays.json");
            return new List<Holiday>();
        }
        finally
        {
            _holidaysLock.Release();
        }
    }

    public async Task SaveHolidaysAsync(IEnumerable<Holiday> holidays)
    {
        await _holidaysLock.WaitAsync();
        try
        {
            List<Holiday> currentHolidays = new();
            if (File.Exists(_holidaysFilePath))
            {
                string json = await File.ReadAllTextAsync(_holidaysFilePath);
                currentHolidays = JsonSerializer.Deserialize<List<Holiday>>(json, _jsonOptions) ?? new List<Holiday>();
            }

            var dict = currentHolidays.ToDictionary(h => h.Date.Date, h => h);
            foreach (var holiday in holidays)
            {
                dict[holiday.Date.Date] = holiday;
            }

            var updatedList = dict.Values.OrderBy(h => h.Date).ToList();
            string updatedJson = JsonSerializer.Serialize(updatedList, _jsonOptions);
            await File.WriteAllTextAsync(_holidaysFilePath, updatedJson);
        }
        finally
        {
            _holidaysLock.Release();
        }
    }
    #endregion

    #region Contacts
    public async Task<List<Contact>> GetContactsAsync()
    {
        await _contactsLock.WaitAsync();
        try
        {
            if (!File.Exists(_contactsFilePath)) return new List<Contact>();
            string json = await File.ReadAllTextAsync(_contactsFilePath);
            return JsonSerializer.Deserialize<List<Contact>>(json, _jsonOptions) ?? new List<Contact>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading contacts.json");
            return new List<Contact>();
        }
        finally
        {
            _contactsLock.Release();
        }
    }

    public async Task SaveContactsAsync(IEnumerable<Contact> contacts)
    {
        await _contactsLock.WaitAsync();
        try
        {
            List<Contact> currentContacts = new();
            if (File.Exists(_contactsFilePath))
            {
                string json = await File.ReadAllTextAsync(_contactsFilePath);
                currentContacts = JsonSerializer.Deserialize<List<Contact>>(json, _jsonOptions) ?? new List<Contact>();
            }

            var dict = currentContacts.ToDictionary(c => c.Email.ToLowerInvariant(), c => c);
            foreach (var contact in contacts)
            {
                if (string.IsNullOrWhiteSpace(contact.Email)) continue;
                dict[contact.Email.ToLowerInvariant()] = contact;
            }

            var updatedList = dict.Values.ToList();
            string updatedJson = JsonSerializer.Serialize(updatedList, _jsonOptions);
            await File.WriteAllTextAsync(_contactsFilePath, updatedJson);
        }
        finally
        {
            _contactsLock.Release();
        }
    }
    #endregion
}
