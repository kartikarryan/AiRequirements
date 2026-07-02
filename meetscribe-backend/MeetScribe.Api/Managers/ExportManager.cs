using MeetScribe.Ai.Services;
using MeetScribe.Api.Common.Utility;
using MeetScribe.Api.Services;
using MeetScribe.Data.Models;
using MeetScribe.Data.Repository;
using MeetScribe.ViewModels;
using System.Text.Json;

namespace MeetScribe.Api.Managers;

public interface IExportManager
{
    Task<ApiResponse<List<string>>> GetProjectsAsync(string provider, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<string>>> GetIterationsAsync(string provider, string project, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<string>>> GetWorkItemTypesAsync(string provider, string project, CancellationToken cancellationToken = default);
    Task<ApiResponse<object>> ExportBatchAsync(string provider, BatchExportRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<object>>> GetExportedAsync(string provider, int meetingId, CancellationToken cancellationToken = default);
}

public class ExportManager : IExportManager
{
    private readonly IIntegrationSettingRepository _settingsRepo;
    private readonly ITicketServiceFactory _ticketFactory;
    private readonly IExportedTicketRepository _exportedRepo;
    private readonly IApiResponseBuilder _response;
    private readonly ILogger<ExportManager> _logger;
    private readonly IUserContext _userContext;

    public ExportManager(
        IIntegrationSettingRepository settingsRepo,
        ITicketServiceFactory ticketFactory,
        IExportedTicketRepository exportedRepo,
        IApiResponseBuilder response,
        ILogger<ExportManager> logger,
        IUserContext userContext)
    {
        _settingsRepo = settingsRepo;
        _ticketFactory = ticketFactory;
        _exportedRepo = exportedRepo;
        _response = response;
        _logger = logger;
        _userContext = userContext;
    }

    public async Task<ApiResponse<List<string>>> GetProjectsAsync(string provider, CancellationToken cancellationToken = default)
    {
        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var setting = await _settingsRepo.GetByProviderAsync(provider, userId, cancellationToken);
        if (setting is null)
            return _response.BadRequest<List<string>>(null, "Provider not configured.");

        var settings = JsonSerializer.Deserialize<Dictionary<string, string>>(setting.SettingsJson) ?? new();
        var service = _ticketFactory.GetService(provider);
        var projects = await service.GetProjectsAsync(settings, cancellationToken);

        return _response.Ok(projects);
    }

    public async Task<ApiResponse<List<string>>> GetIterationsAsync(string provider, string project, CancellationToken cancellationToken = default)
    {
        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var setting = await _settingsRepo.GetByProviderAsync(provider, userId, cancellationToken);
        if (setting is null)
            return _response.BadRequest<List<string>>(null, "Provider not configured.");

        var settings = JsonSerializer.Deserialize<Dictionary<string, string>>(setting.SettingsJson) ?? new();
        var service = _ticketFactory.GetService(provider);
        var iterations = await service.GetIterationsAsync(settings, project, cancellationToken);

        return _response.Ok(iterations);
    }

    public async Task<ApiResponse<List<string>>> GetWorkItemTypesAsync(string provider, string project, CancellationToken cancellationToken = default)
    {
        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var setting = await _settingsRepo.GetByProviderAsync(provider, userId, cancellationToken);
        if (setting is null)
            return _response.BadRequest<List<string>>(null, "Provider not configured.");

        var settings = JsonSerializer.Deserialize<Dictionary<string, string>>(setting.SettingsJson) ?? new();
        var service = _ticketFactory.GetService(provider);
        var types = await service.GetWorkItemTypesAsync(settings, project, cancellationToken);

        return _response.Ok(types);
    }

    public async Task<ApiResponse<object>> ExportBatchAsync(string provider, BatchExportRequest request, CancellationToken cancellationToken = default)
    {
        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var setting = await _settingsRepo.GetByProviderAsync(provider,userId, cancellationToken);
        if (setting is null)
            return _response.BadRequest<object>(null, "Provider not configured.");

        if (!_ticketFactory.IsSupported(provider))
            return _response.BadRequest<object>(null, $"Provider '{provider}' is not supported.");

        if (request.Items == null || request.Items.Count == 0)
            return _response.BadRequest<object>(null, "No items to export.");

        if (string.IsNullOrWhiteSpace(request.Project))
            return _response.BadRequest<object>(null, "Project is required.");

        var settings = JsonSerializer.Deserialize<Dictionary<string, string>>(setting.SettingsJson) ?? new();
        var service = _ticketFactory.GetService(provider);
        var titles = request.Items.Select(i => i.Title).ToList();

        // Step 1: Batch duplicate check (skip if force=true)
        if (!request.Force)
        {
            var duplicateTitles = new List<string>();

            if (request.MeetingId.HasValue)
            {
                var internalDups = await _exportedRepo.FindDuplicatesBatchAsync(
                    request.MeetingId.Value, titles, provider, cancellationToken);
                duplicateTitles.AddRange(internalDups.Select(d => d.Title));
            }

            var externalDups = await service.FindDuplicatesBatchAsync(settings, request.Project, titles, cancellationToken);
            foreach (var ext in externalDups)
            {
                if (!duplicateTitles.Contains(ext.Title))
                    duplicateTitles.Add(ext.Title);
            }

            if (duplicateTitles.Count > 0)
            {
                return _response.Ok<object>(new { status = "duplicates_found", duplicates = duplicateTitles });
            }
        }

        // Step 2: Create all tickets
        var results = new List<object>();
        foreach (var item in request.Items)
        {
            var workItemRequest = new CreateWorkItemRequest
            {
                Title = item.Title,
                Description = item.Description,
                WorkItemType = item.WorkItemType ?? "Task",
                Priority = item.Priority,
                IterationPath = request.IterationPath,
                Tags = item.Tags ?? "MeetScribe",
                AssignedTo = item.AssignedTo,
            };

            var result = await service.CreateWorkItemAsync(settings, request.Project, workItemRequest, cancellationToken);

            if (result.Success)
            {
                if (request.MeetingId.HasValue)
                {
                    await _exportedRepo.SaveAsync(new ExportedTicketEntity
                    {
                        MeetingId = request.MeetingId.Value,
                        Provider = provider,
                        Project = request.Project,
                        IterationPath = request.IterationPath,
                        ExternalTicketId = result.WorkItemId,
                        ExternalTicketUrl = result.WorkItemUrl,
                        Title = item.Title,
                        WorkItemType = item.WorkItemType ?? "Task",
                    }, cancellationToken);
                }

                results.Add(new { title = item.Title, success = true, ticketId = result.WorkItemId, ticketUrl = result.WorkItemUrl });
                _logger.LogInformation("Exported ticket #{TicketId} to {Provider}/{Project}", result.WorkItemId, provider, request.Project);
            }
            else
            {
                results.Add(new { title = item.Title, success = false, error = result.ErrorMessage ?? "Failed" });
                _logger.LogWarning("Failed to export '{Title}' to {Provider}: {Error}", item.Title, provider, result.ErrorMessage);
            }
        }

        return _response.Ok<object>(new { status = "created", results });
    }

    public async Task<ApiResponse<List<object>>> GetExportedAsync(string provider, int meetingId, CancellationToken cancellationToken = default)
    {
        if (meetingId <= 0)
            return _response.BadRequest<List<object>>(null, "Meeting ID must be a positive number.");

        var exported = await _exportedRepo.GetByMeetingIdAsync(meetingId, cancellationToken);
        var filtered = exported
            .Where(e => e.Provider == provider)
            .Select(e => (object)new
            {
                e.Title,
                e.ExternalTicketId,
                e.ExternalTicketUrl,
                e.Project,
                e.IterationPath,
                e.WorkItemType,
                e.CreatedAt,
            })
            .ToList();

        return _response.Ok(filtered);
    }
}
