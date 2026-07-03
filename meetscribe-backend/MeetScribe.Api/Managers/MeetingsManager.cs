using FluentValidation;
using MeetScribe.Ai.Managers;
using MeetScribe.Api.Common.Utility;
using MeetScribe.Api.Services;
using MeetScribe.Data.Models;
using MeetScribe.Data.Repository;
using MeetScribe.ViewModels;
using System.Text.Json;

namespace MeetScribe.Api.Managers;

public interface IMeetingsManager
{
    Task<ApiResponse<List<MeetingListItem>>> GetAllAsync(int projectId, CancellationToken cancellationToken = default);
    Task<ApiResponse<MeetingEntity>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> SaveEditedExtractionAsync(int id, string editedResultJson, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RetryExtractionAsync(int id, string? templateId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<MeetingListItem>>> SearchAsync(string query, int projectId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> BulkDeleteAsync(List<int> ids, CancellationToken cancellationToken = default);
}

public class MeetingsManager : IMeetingsManager
{
    private readonly IMeetingRepository _meetingRepository;
    private readonly IRequirementExtractionManager _extractionManager;
    private readonly IApiResponseBuilder _response;
    private readonly ILogger<MeetingsManager> _logger;
    private readonly IUserContext _userContext;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public MeetingsManager(
        IMeetingRepository meetingRepository,
        IRequirementExtractionManager extractionManager,
        IApiResponseBuilder response,
        ILogger<MeetingsManager> logger,
        IUserContext userContext)
    {
        _meetingRepository = meetingRepository;
        _extractionManager = extractionManager;
        _response = response;
        _logger = logger;
        _userContext = userContext;
    }

    public async Task<ApiResponse<List<MeetingListItem>>> GetAllAsync(int projectId, CancellationToken cancellationToken = default)
    {
        if (projectId <= 0)
            return _response.BadRequest<List<MeetingListItem>>(null, $"ProjectId id {projectId} should be positive number.");

        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var filtered = await _meetingRepository.GetByProjectIdAsync(projectId, userId, cancellationToken);

        var listItems = filtered.Select(MapToListItem).ToList();

        return _response.Ok(listItems, $"{listItems.Count} meetings found.");
    }

    public async Task<ApiResponse<MeetingEntity>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return _response.BadRequest<MeetingEntity>(null, $"Meeting id {id} should be positive number.");

        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var meeting = await _meetingRepository.GetByIdAsync(id, userId, cancellationToken);
        if (meeting is null)
        {
            return _response.NotFound<MeetingEntity>(null, $"Meeting with ID {id} not found.");
        }

        return _response.Ok(meeting);
    }

    public async Task<ApiResponse<bool>> SaveEditedExtractionAsync(int id, string editedResultJson, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return _response.BadRequest(false, "Meeting ID must be a positive number.");

        if (string.IsNullOrEmpty(editedResultJson))
            return _response.BadRequest(false, "Edited result cannot be empty.");

        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var meeting = await _meetingRepository.GetByIdAsync(id, userId, cancellationToken);
        if (meeting is null)
            return _response.NotFound(false, $"Meeting with ID {id} not found.");

        meeting.EditedResultJson = editedResultJson;
        await _meetingRepository.UpdateAsync(meeting, cancellationToken);

        return _response.Ok(true, "Changes saved successfully.");
    }

    public async Task<ApiResponse<bool>> RetryExtractionAsync(int id, string? templateId, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return _response.BadRequest(false, "Id should be positive number.");

        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var meeting = await _meetingRepository.GetByIdAsync(id, userId, cancellationToken);
        if (meeting is null)
            return _response.NotFound(false, $"Meeting with ID {id} not found.");

        if (string.IsNullOrWhiteSpace(meeting.Transcript))
            return _response.BadRequest(false, "No transcript available for retry. Re-upload the audio.");

        var useTemplateId = templateId ?? meeting.TemplateId;

        var extractionResult = await _extractionManager.ExtractAsync(
            meeting.Transcript, useTemplateId, cancellationToken);

        if (extractionResult is null)
        {
            meeting.Status = "Error";
            meeting.ErrorMessage = "Retry extraction failed to produce results.";
            await _meetingRepository.UpdateAsync(meeting, cancellationToken);
            return _response.InternalServerError(false, "Extraction failed to produce results.");
        }

        var hasData = extractionResult.Sections.Any(s => s.Data is not null);

        meeting.ExtractionResultJson = JsonSerializer.Serialize(extractionResult, JsonOptions);
        meeting.EditedResultJson = null;
        meeting.TemplateId = useTemplateId;
        meeting.Status = hasData ? "Completed" : "NoData";
        meeting.ErrorMessage = null;
        meeting.CompletedAt = DateTime.UtcNow;

        await _meetingRepository.UpdateAsync(meeting, cancellationToken);

        return _response.Ok(true, hasData ? "Extraction regenerated successfully." : "No actionable items found.");
    }

    public async Task<ApiResponse<List<MeetingListItem>>> SearchAsync(string query, int projectId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(query))
            return _response.BadRequest(new List<MeetingListItem>(), "Search query is required.");

        if (query.Length < 3)
            return _response.BadRequest(new List<MeetingListItem>(), "Search query must be at least 3 characters long.");

        if (projectId <= 0)
            return _response.BadRequest(new List<MeetingListItem>(), $"Project id {projectId} should be positive number.");

        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var allMeetings = await _meetingRepository.GetByProjectIdAsync(projectId, userId, cancellationToken);

        var results = allMeetings
            .Where(m =>
                (m.Name != null && m.Name.Contains(query, StringComparison.OrdinalIgnoreCase)) ||
                (m.Transcript != null && m.Transcript.Contains(query, StringComparison.OrdinalIgnoreCase)) ||
                (m.ExtractionResultJson != null && m.ExtractionResultJson.Contains(query, StringComparison.OrdinalIgnoreCase))
            )
            .Select(MapToListItem)
            .ToList();

        return _response.Ok(results, $"{results.Count} results found for \"{query}\".");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return _response.BadRequest(false, "Id should be positive number.");

        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var meeting = await _meetingRepository.GetByIdAsync(id, userId, cancellationToken);
        if (meeting is null)
            return _response.NotFound(false, $"Meeting with ID {id} not found.");

        await _meetingRepository.DeleteAsync(id, userId, cancellationToken);

        _logger.LogInformation("Meeting deleted: {Id}", id);
        return _response.Ok(true, "Meeting deleted successfully.");
    }

    public async Task<ApiResponse<bool>> BulkDeleteAsync(List<int> ids, CancellationToken cancellationToken = default)
    {
        if (ids == null || ids.Count == 0)
            return _response.BadRequest(false, "No meeting IDs provided.");

        if (ids.Count > 50)
            return _response.BadRequest(false, "Cannot delete more than 50 meetings at once.");

        var userId = await _userContext.GetUserIdAsync(cancellationToken);
        var deletedCount = 0;

        foreach (var id in ids)
        {
            var success = await _meetingRepository.DeleteAsync(id, userId, cancellationToken);
            if (success) deletedCount++;
        }

        _logger.LogInformation("Bulk deleted {Count} meetings for user {UserId}", deletedCount, userId);
        return _response.Ok(true, $"{deletedCount} meeting(s) deleted successfully.");
    }

    private static MeetingListItem MapToListItem(MeetingEntity m) => new()
    {
        Id = m.Id,
        Name = m.Name,
        Description = m.Description,
        TemplateId = m.TemplateId,
        ProjectId = m.ProjectId,
        AudioFileName = m.AudioFileName,
        AudioFileSize = m.AudioFileSize,
        MeetingDate = m.MeetingDate,
        Status = m.Status,
        ErrorMessage = m.ErrorMessage,
        CreatedAt = m.CreatedAt,
    };
}
