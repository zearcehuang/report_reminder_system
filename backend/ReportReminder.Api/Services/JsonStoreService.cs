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
    Task<List<Project>> GetProjectsAsync(CancellationToken cancellationToken = default);
    Task<Project?> GetProjectByIdAsync(string id, CancellationToken cancellationToken = default);
    Task SaveProjectAsync(Project project, CancellationToken cancellationToken = default);
    Task DeleteProjectAsync(string id, CancellationToken cancellationToken = default);

    Task<List<Holiday>> GetHolidaysAsync(CancellationToken cancellationToken = default);
    Task SaveHolidaysAsync(IEnumerable<Holiday> holidays, CancellationToken cancellationToken = default);

    Task<List<Contact>> GetContactsAsync(CancellationToken cancellationToken = default);
    Task SaveContactsAsync(IEnumerable<Contact> contacts, CancellationToken cancellationToken = default);
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

    private List<Project>? _projectsCache = null;
    private List<Holiday>? _holidaysCache = null;
    private List<Contact>? _contactsCache = null;

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
    public async Task<List<Project>> GetProjectsAsync(CancellationToken cancellationToken = default)
    {
        await _projectsLock.WaitAsync(cancellationToken);
        try
        {
            if (_projectsCache != null) return new List<Project>(_projectsCache);
            if (!File.Exists(_projectsFilePath)) return new List<Project>();
            string json = await File.ReadAllTextAsync(_projectsFilePath, cancellationToken);
            var result = JsonSerializer.Deserialize<List<Project>>(json, _jsonOptions) ?? new List<Project>();
            _projectsCache = new List<Project>(result);
            return result;
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

    public async Task<Project?> GetProjectByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var projects = await GetProjectsAsync(cancellationToken);
        return projects.FirstOrDefault(p => p.Id == id);
    }

    public async Task SaveProjectAsync(Project project, CancellationToken cancellationToken = default)
    {
        await _projectsLock.WaitAsync(cancellationToken);
        try
        {
            List<Project> projects = new();
            if (File.Exists(_projectsFilePath))
            {
                string json = await File.ReadAllTextAsync(_projectsFilePath, cancellationToken);
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
            string tempPath = _projectsFilePath + ".tmp." + Guid.NewGuid();
            await File.WriteAllTextAsync(tempPath, updatedJson, cancellationToken);
            File.Move(tempPath, _projectsFilePath, overwrite: true);
            _projectsCache = new List<Project>(projects);
        }
        finally
        {
            _projectsLock.Release();
        }
    }

    public async Task DeleteProjectAsync(string id, CancellationToken cancellationToken = default)
    {
        await _projectsLock.WaitAsync(cancellationToken);
        try
        {
            if (!File.Exists(_projectsFilePath)) return;
            string json = await File.ReadAllTextAsync(_projectsFilePath, cancellationToken);
            var projects = JsonSerializer.Deserialize<List<Project>>(json, _jsonOptions) ?? new List<Project>();
            projects.RemoveAll(p => p.Id == id);

            string updatedJson = JsonSerializer.Serialize(projects, _jsonOptions);
            string tempPath = _projectsFilePath + ".tmp." + Guid.NewGuid();
            await File.WriteAllTextAsync(tempPath, updatedJson, cancellationToken);
            File.Move(tempPath, _projectsFilePath, overwrite: true);
            _projectsCache = new List<Project>(projects);
        }
        finally
        {
            _projectsLock.Release();
        }
    }
    #endregion

    #region Holidays
    public async Task<List<Holiday>> GetHolidaysAsync(CancellationToken cancellationToken = default)
    {
        await _holidaysLock.WaitAsync(cancellationToken);
        try
        {
            if (_holidaysCache != null) return new List<Holiday>(_holidaysCache);
            if (!File.Exists(_holidaysFilePath)) return new List<Holiday>();
            string json = await File.ReadAllTextAsync(_holidaysFilePath, cancellationToken);
            var result = JsonSerializer.Deserialize<List<Holiday>>(json, _jsonOptions) ?? new List<Holiday>();
            _holidaysCache = new List<Holiday>(result);
            return result;
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

    public async Task SaveHolidaysAsync(IEnumerable<Holiday> holidays, CancellationToken cancellationToken = default)
    {
        await _holidaysLock.WaitAsync(cancellationToken);
        try
        {
            List<Holiday> currentHolidays = new();
            if (File.Exists(_holidaysFilePath))
            {
                string json = await File.ReadAllTextAsync(_holidaysFilePath, cancellationToken);
                currentHolidays = JsonSerializer.Deserialize<List<Holiday>>(json, _jsonOptions) ?? new List<Holiday>();
            }

            var dict = currentHolidays.ToDictionary(h => h.Date.Date, h => h);
            foreach (var holiday in holidays)
            {
                dict[holiday.Date.Date] = holiday;
            }

            var updatedList = dict.Values.OrderBy(h => h.Date).ToList();
            string updatedJson = JsonSerializer.Serialize(updatedList, _jsonOptions);
            string tempPath = _holidaysFilePath + ".tmp." + Guid.NewGuid();
            await File.WriteAllTextAsync(tempPath, updatedJson, cancellationToken);
            File.Move(tempPath, _holidaysFilePath, overwrite: true);
            _holidaysCache = new List<Holiday>(updatedList);
        }
        finally
        {
            _holidaysLock.Release();
        }
    }
    #endregion

    #region Contacts
    public async Task<List<Contact>> GetContactsAsync(CancellationToken cancellationToken = default)
    {
        await _contactsLock.WaitAsync(cancellationToken);
        try
        {
            if (_contactsCache != null) return new List<Contact>(_contactsCache);
            if (!File.Exists(_contactsFilePath)) return new List<Contact>();
            string json = await File.ReadAllTextAsync(_contactsFilePath, cancellationToken);
            var result = JsonSerializer.Deserialize<List<Contact>>(json, _jsonOptions) ?? new List<Contact>();
            _contactsCache = new List<Contact>(result);
            return result;
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

    public async Task SaveContactsAsync(IEnumerable<Contact> contacts, CancellationToken cancellationToken = default)
    {
        await _contactsLock.WaitAsync(cancellationToken);
        try
        {
            List<Contact> currentContacts = new();
            if (File.Exists(_contactsFilePath))
            {
                string json = await File.ReadAllTextAsync(_contactsFilePath, cancellationToken);
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
            string tempPath = _contactsFilePath + ".tmp." + Guid.NewGuid();
            await File.WriteAllTextAsync(tempPath, updatedJson, cancellationToken);
            File.Move(tempPath, _contactsFilePath, overwrite: true);
            _contactsCache = new List<Contact>(updatedList);
        }
        finally
        {
            _contactsLock.Release();
        }
    }
    #endregion
}
