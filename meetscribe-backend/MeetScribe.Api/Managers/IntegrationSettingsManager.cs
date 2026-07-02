using MeetScribe.Ai.Services;
using MeetScribe.Api.Common.Utility;
using MeetScribe.Api.Services;
using MeetScribe.Data.Models;
using MeetScribe.Data.Repository;
using MeetScribe.ViewModels;
using System.Text.Json;

namespace MeetScribe.Api.Managers;

public interface IIntegrationSettingsManager
{
    Task<ApiResponse<object>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<object>> GetByProviderAsync(string provider, CancellationToken cancellationToken = default);
    Task<ApiResponse<object>> TestConnectionAsync(string provider, Dictionary<string, string> settings, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> SaveSettingsAsync(string provider, Dictionary<string, string> settings, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DisconnectAsync(string provider, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<string>>> GetProjectsAsync(string provider, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<string>>> GetIterationsAsync(string provider, string project, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<string>>> GetWorkItemTypesAsync(string provider, string project, CancellationToken cancellationToken = default);
}

public class IntegrationSettingsManager : IIntegrationSettingsManager
{
    private readonly IIntegrationSettingRepository _settingsRepo;
    private readonly ITicketServiceFactory _ticketFactory;
    private readonly IApiResponseBuilder _response;
    private readonly IUserContext _userContext;

    public IntegrationSettingsManager(
        IIntegrationSettingRepository settingsRepo,
        ITicketServiceFactory ticketFactory,
        IApiResponseBuilder response,
        IUserContext userContext)
    {
        _settingsRepo = settingsRepo;
        _ticketFactory = ticketFactory;
        _response = response;
        _userContext = userContext;
    }

    public async Task<ApiResponse<object>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var all = await _settingsRepo.GetAllActiveAsync(userId, cancellationToken);

        var result = all.Select(s => new
        {
            s.Provider,
            Settings = MaskSecrets(s.Provider, JsonSerializer.Deserialize<Dictionary<string, string>>(s.SettingsJson) ?? new()),
            s.IsActive,
            s.CreatedAt,
            s.UpdatedAt,
        }).ToList();

        return _response.Ok<object>(new { configured = result.Any(), data = result });
    }

    public async Task<ApiResponse<object>> GetByProviderAsync(string provider, CancellationToken cancellationToken = default)
    {
        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var setting = await _settingsRepo.GetByProviderAsync(provider, userId, cancellationToken);

        if (setting is null)
            return _response.Ok<object>(new { configured = false, provider });

        var settings = JsonSerializer.Deserialize<Dictionary<string, string>>(setting.SettingsJson) ?? new();

        return _response.Ok<object>(new
        {
            configured = true,
            provider = setting.Provider,
            settings = MaskSecrets(provider, settings),
            setting.CreatedAt,
            setting.UpdatedAt,
        });
    }

    public async Task<ApiResponse<object>> TestConnectionAsync(string provider, Dictionary<string, string> settings, CancellationToken cancellationToken = default)
    {
        if (!_ticketFactory.IsSupported(provider))
            return _response.BadRequest<object>(null, $"Provider '{provider}' is not supported.");

        var service = _ticketFactory.GetService(provider);
        var isValid = await service.TestConnectionAsync(settings, cancellationToken);

        if (!isValid)
            return _response.Ok<object>(new { success = false, message = "Connection failed. Check your credentials." });

        List<string> projects = new();
        try { projects = await service.GetProjectsAsync(settings, cancellationToken); } catch { }

        return _response.Ok<object>(new { success = true, message = "Connected successfully.", projects });
    }

    public async Task<ApiResponse<bool>> SaveSettingsAsync(string provider, Dictionary<string, string> settings, CancellationToken cancellationToken = default)
    {
        if (!_ticketFactory.IsSupported(provider))
            return _response.BadRequest(false, $"Provider '{provider}' is not supported.");

        if (settings == null || settings.Count == 0)
            return _response.BadRequest(false, "Settings are required.");

        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var entity = new IntegrationSettingEntity
        {
            Provider = provider,
            SettingsJson = JsonSerializer.Serialize(settings),
            IsActive = true,
            UserId = userId,
        };

        await _settingsRepo.SaveAsync(entity, cancellationToken);
        return _response.Ok(true, $"{provider} integration saved successfully.");
    }

    public async Task<ApiResponse<bool>> DisconnectAsync(string provider, CancellationToken cancellationToken = default)
    {
        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var deleted = await _settingsRepo.DeleteAsync(provider, userId, cancellationToken);
        if (!deleted)
            return _response.NotFound(false, "No integration found for this provider.");

        return _response.Ok(true, $"{provider} disconnected.");
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

    private static Dictionary<string, string> MaskSecrets(string provider, Dictionary<string, string> settings)
    {
        var masked = new Dictionary<string, string>(settings);
        string[] secretKeys = ["accessToken", "apiToken", "apiKey", "pat"];

        foreach (var key in secretKeys)
        {
            if (masked.ContainsKey(key) && !string.IsNullOrEmpty(masked[key]))
            {
                var val = masked[key];
                masked[key] = val.Length > 8 ? val[..4] + "****" + val[^4..] : "****";
            }
        }

        return masked;
    }
}
