using MeetScribe.Api.Managers;
using MeetScribe.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MeetScribe.Api.Controllers;

/// <summary>Ticket export — projects, iterations, types, batch create, export history.</summary>
[Route("api/integrations")]
[ApiController]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly IExportManager _exportManager;

    public ExportController(IExportManager exportManager)
    {
        _exportManager = exportManager;
    }

    /// <summary>Gets DevOps/Jira projects for export modal dropdown.</summary>
    [HttpGet("{provider}/projects")]
    public async Task<IActionResult> GetProjects(string provider, CancellationToken cancellationToken)
    {
        var result = await _exportManager.GetProjectsAsync(provider, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Gets iterations/sprints for export modal dropdown.</summary>
    [HttpGet("{provider}/iterations")]
    public async Task<IActionResult> GetIterations(string provider, [FromQuery] string project, CancellationToken cancellationToken)
    {
        var result = await _exportManager.GetIterationsAsync(provider, project, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Gets available work item types for export modal dropdown.</summary>
    [HttpGet("{provider}/workitemtypes")]
    public async Task<IActionResult> GetWorkItemTypes(string provider, [FromQuery] string project, CancellationToken cancellationToken)
    {
        var result = await _exportManager.GetWorkItemTypesAsync(provider, project, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Batch export: validates duplicates, then creates tickets in DevOps/Jira.</summary>
    [HttpPost("{provider}/export/batch")]
    public async Task<IActionResult> ExportBatch(string provider, [FromBody] BatchExportRequest request, CancellationToken cancellationToken)
    {
        var result = await _exportManager.ExportBatchAsync(provider, request, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Gets previously exported tickets for a meeting.</summary>
    [HttpGet("{provider}/exported/{meetingId}")]
    public async Task<IActionResult> GetExported(string provider, int meetingId, CancellationToken cancellationToken)
    {
        var result = await _exportManager.GetExportedAsync(provider, meetingId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
