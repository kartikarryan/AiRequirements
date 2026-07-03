using MeetScribe.Api.Managers;
using MeetScribe.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MeetScribe.Api.Controllers;

[Route("api/meetings")]
[ApiController]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly IMeetingsManager _meetingsManager;

    public MeetingsController(IMeetingsManager meetingsManager)
    {
        _meetingsManager = meetingsManager;
    }

    /// <summary>Gets meetings list filtered by project. Used by the meetings table UI.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int projectId, CancellationToken cancellationToken)
    {
        var result = await _meetingsManager.GetAllAsync(projectId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Gets full meeting details (transcript + extraction). Used when user clicks a meeting row.</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _meetingsManager.GetByIdAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Saves user's inline edits from document view. Preserves original extraction as backup.</summary>
    [HttpPut("{id}/extraction")]
    public async Task<IActionResult> SaveExtraction(int id, [FromBody] SaveExtractionRequest request, CancellationToken cancellationToken)
    {
        var result = await _meetingsManager.SaveEditedExtractionAsync(id, request.EditedResultJson, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Re-runs AI extraction on existing transcript with same or different template.</summary>
    [HttpPost("{id}/retry")]
    public async Task<IActionResult> RetryExtraction(int id, [FromBody] RetryExtractionRequest request, CancellationToken cancellationToken)
    {
        var result = await _meetingsManager.RetryExtractionAsync(id, request.TemplateId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Searches across meeting names, transcripts, and extraction results. Debounced from UI.</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query, [FromQuery] int projectId, CancellationToken cancellationToken)
    {
        var result = await _meetingsManager.SearchAsync(query, projectId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Deletes a meeting and its associated data.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _meetingsManager.DeleteAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    /// <summary>Bulk delete meetings by IDs.</summary>
    [HttpPost("bulk-delete")]
    public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteRequest request, CancellationToken cancellationToken)
    {
        var result = await _meetingsManager.BulkDeleteAsync(request.Ids, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
