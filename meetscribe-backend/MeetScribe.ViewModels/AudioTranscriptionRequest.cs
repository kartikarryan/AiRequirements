using Microsoft.AspNetCore.Http;

namespace MeetScribe.ViewModels;

/// <summary>
/// Request model for uploading audio and triggering extraction.
/// Sent as multipart/form-data from the React frontend.
/// </summary>
public class AudioTranscriptionRequest
{
    /// <summary>The .webm audio file to process (required, max 200MB).</summary>
    public IFormFile AudioFile { get; set; }

    /// <summary>User-provided meeting name (required, max 50 chars).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Template ID that determines what to extract and how to format output.
    /// Required. Values: "meeting-minutes", "requirements-doc", "action-items"
    /// </summary>
    public string TemplateId { get; set; } = "meeting-minutes";

    /// <summary>Optional meeting description (max 100 chars).</summary>
    public string? Description { get; set; }

    /// <summary>Project ID to group this meeting under (optional).</summary>
    public int? ProjectId { get; set; }

    /// <summary>When the meeting actually happened (optional, defaults to today).</summary>
    public DateTime? MeetingDate { get; set; }
}
