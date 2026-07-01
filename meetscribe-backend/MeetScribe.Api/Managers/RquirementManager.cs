using MeetScribe.Ai.Managers;
using MeetScribe.Api.Common.Utility;
using MeetScribe.Data.Models;
using MeetScribe.Data.Repository;
using MeetScribe.ViewModels;
using System.Text.Json;

namespace MeetScribe.Api.Managers;

public interface IRequirementManager
{
    /// <summary>
    /// Orchestrates the full pipeline:
    /// Validate → Save to DB → Transcribe → Extract → Update DB → Return minimal response.
    /// Full data fetched separately via GET /api/meetings/{id}.
    /// </summary>
    Task<ApiResponse<UploadResponse>> GenerateRequirementsAsync(
        AudioTranscriptionRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Orchestrates the meeting-to-requirements pipeline with database persistence.
///
/// Flow:
///   1. Validate audio file (type, size, not empty)
///   2. Save meeting to DB with status "Processing"
///   3. Transcribe audio via Deepgram
///   4. Extract requirements via AI (template-based)
///   5. Update DB with results (status: Completed/Error/NoData)
///   6. Return structured response
/// </summary>
public class RequirementManager : IRequirementManager
{
    private readonly ITranscriptionManager _transcriptionManager;
    private readonly IRequirementExtractionManager _extractionManager;
    private readonly IMeetingRepository _meetingRepository;
    private readonly IApiResponseBuilder _apiResponseBuilder;
    private readonly ILogger<RequirementManager> _logger;

    private const long MaxFileSizeBytes = 200 * 1024 * 1024;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public RequirementManager(
        ITranscriptionManager transcriptionManager,
        IRequirementExtractionManager extractionManager,
        IMeetingRepository meetingRepository,
        IApiResponseBuilder apiResponseBuilder,
        ILogger<RequirementManager> logger)
    {
        _transcriptionManager = transcriptionManager;
        _extractionManager = extractionManager;
        _meetingRepository = meetingRepository;
        _apiResponseBuilder = apiResponseBuilder;
        _logger = logger;
    }

    public async Task<ApiResponse<UploadResponse>> GenerateRequirementsAsync(
        AudioTranscriptionRequest request,
        CancellationToken cancellationToken = default)
    {
        // Step 1: Validate the uploaded file
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return validationError;
        }

        // Step 2: Save meeting to DB with "Processing" status
        var meetingEntity = new MeetingEntity
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            TemplateId = request.TemplateId,
            ProjectId = request.ProjectId,
            MeetingDate = request.MeetingDate.HasValue
                ? DateTime.SpecifyKind(request.MeetingDate.Value, DateTimeKind.Utc)
                : DateTime.UtcNow,
            AudioFileName = request.AudioFile!.FileName,
            AudioFileSize = request.AudioFile.Length,
            ExtractionResultJson = string.Empty,
            Status = "Processing",
            CreatedAt = DateTime.UtcNow,
        };

        await _meetingRepository.CreateAsync(meetingEntity, cancellationToken);
        _logger.LogInformation("Meeting saved to DB: {Id} ({Name})", meetingEntity.Id, meetingEntity.Name);

        try
        {
            // Step 3: Transcribe audio to text
            using var stream = request.AudioFile.OpenReadStream();

            var transcriptResult = await _transcriptionManager.TranscribeAsync(
                stream, cancellationToken);

            if (!transcriptResult.Success || string.IsNullOrWhiteSpace(transcriptResult.Transcript))
            {
                await UpdateMeetingStatus(meetingEntity, "Error",
                    transcriptResult.ErrorMessage ?? "Transcription failed.", cancellationToken);

                return _apiResponseBuilder.InternalServerError<UploadResponse>(
                    null, transcriptResult.ErrorMessage ?? "Transcription failed.");
            }

            _logger.LogInformation("Transcription complete: {Length} characters", transcriptResult.Transcript.Length);

            // Step 4: Extract using the selected template
            var extractionResult = await _extractionManager.ExtractAsync(
                transcriptResult.Transcript,
                request.TemplateId,
                cancellationToken);

            if (extractionResult is null)
            {
                await UpdateMeetingStatus(meetingEntity, "Error",
                    "Extraction failed to produce results.", cancellationToken);

                return _apiResponseBuilder.InternalServerError<UploadResponse>(
                    null, "Extraction failed to produce results.");
            }

            // Step 5: Determine if extraction found anything
            var hasData = extractionResult.Sections.Any(s => s.Data is not null);
            var status = hasData ? "Completed" : "NoData";

            // Step 6: Update DB with results
            meetingEntity.Status = status;
            meetingEntity.Transcript = transcriptResult.Transcript;
            meetingEntity.ExtractionResultJson = JsonSerializer.Serialize(extractionResult, JsonOptions);
            meetingEntity.CompletedAt = DateTime.UtcNow;

            await _meetingRepository.UpdateAsync(meetingEntity, cancellationToken);
            _logger.LogInformation("Meeting updated in DB: {Id} (Status: {Status})", meetingEntity.Id, status);

            // Step 7: Return minimal response (full data fetched via GET /api/meetings/{id})
            var uploadResponse = new UploadResponse
            {
                Id = meetingEntity.Id,
                Status = status,
                Message = hasData
                    ? "Requirements generated successfully."
                    : "No actionable items found in this transcript."
            };

            return _apiResponseBuilder.Ok(uploadResponse, uploadResponse.Message);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing meeting {Id}", meetingEntity.Id);

            await UpdateMeetingStatus(meetingEntity, "Error",
                "An unexpected error occurred.", cancellationToken);

            return _apiResponseBuilder.InternalServerError<UploadResponse>(
                null, "An unexpected error occurred. Please try again.");
        }
    }

    // -------------------------------------------------------------------------
    // Private Helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Validates the request: file presence, size, type, and required fields.
    /// </summary>
    private ApiResponse<UploadResponse>? ValidateRequest(AudioTranscriptionRequest request)
    {
        if (request.AudioFile is null || request.AudioFile.Length == 0)
        {
            return _apiResponseBuilder.BadRequest<UploadResponse>(
                null, "Audio file is required.");
        }

        if (request.AudioFile.Length > MaxFileSizeBytes)
        {
            return _apiResponseBuilder.BadRequest<UploadResponse>(
                null, $"File size exceeds the 200 MB limit. Your file: {request.AudioFile.Length / (1024 * 1024)} MB.");
        }

        var allowedExtensions = new[] { ".webm", ".mp3", ".wav" };
        var fileExtension = Path.GetExtension(request.AudioFile.FileName);
        if (!allowedExtensions.Contains(fileExtension, StringComparer.OrdinalIgnoreCase))
        {
            return _apiResponseBuilder.BadRequest<UploadResponse>(
                null, "Only .webm, .mp3, and .wav audio files are supported.");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return _apiResponseBuilder.BadRequest<UploadResponse>(
                null, "Meeting name is required.");
        }

        if (request.Name.Trim().Length > 50)
        {
            return _apiResponseBuilder.BadRequest<UploadResponse>(
                null, "Meeting name must be 50 characters or less.");
        }

        if (string.IsNullOrWhiteSpace(request.TemplateId))
        {
            return _apiResponseBuilder.BadRequest<UploadResponse>(
                null, "Template selection is required.");
        }

        return null;
    }

    /// <summary>
    /// Updates the meeting status in database (for error cases).
    /// </summary>
    private async Task UpdateMeetingStatus(
        MeetingEntity meeting, string status, string? errorMessage,
        CancellationToken cancellationToken)
    {
        meeting.Status = status;
        meeting.ErrorMessage = errorMessage;
        meeting.CompletedAt = DateTime.UtcNow;

        await _meetingRepository.UpdateAsync(meeting, cancellationToken);
    }
}
