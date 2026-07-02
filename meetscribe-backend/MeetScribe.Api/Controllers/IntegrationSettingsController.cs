using MeetScribe.Api.Managers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MeetScribe.Api.Controllers;

/// <summary>Provider settings — connect, test, disconnect, get projects/iterations/types.</summary>
[Route("api/integrations")]
[ApiController]
[Authorize]
public class IntegrationSettingsController : ControllerBase
{
    private readonly IIntegrationSettingsManager _settingsManager;

    public IntegrationSettingsController(IIntegrationSettingsManager settingsManager)
    {
        _settingsManager = settingsManager;
    }

    /// <summary>Gets all configured integrations.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _settingsManager.GetAllAsync(cancellationToken);
        return StatusCode(result.StatusCode, result.Data);
    }

    /// <summary>Gets config for a specific provider.</summary>
    [HttpGet("{provider}")]
    public async Task<IActionResult> GetByProvider(string provider, CancellationToken cancellationToken)
    {
        var result = await _settingsManager.GetByProviderAsync(provider, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Tests connection for a provider without saving.</summary>
    [HttpPost("{provider}/test")]
    public async Task<IActionResult> TestConnection(string provider, [FromBody] Dictionary<string, string> settings, CancellationToken cancellationToken)
    {
        var result = await _settingsManager.TestConnectionAsync(provider, settings, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Saves integration settings for a provider.</summary>
    [HttpPost("{provider}")]
    public async Task<IActionResult> SaveSettings(string provider, [FromBody] Dictionary<string, string> settings, CancellationToken cancellationToken)
    {
        var result = await _settingsManager.SaveSettingsAsync(provider, settings, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Disconnects a provider.</summary>
    [HttpDelete("{provider}")]
    public async Task<IActionResult> Disconnect(string provider, CancellationToken cancellationToken)
    {
        var result = await _settingsManager.DisconnectAsync(provider, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

}
