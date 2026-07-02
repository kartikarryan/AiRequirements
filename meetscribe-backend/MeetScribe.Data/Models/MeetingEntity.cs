namespace MeetScribe.Data.Models;

/// <summary>
/// Represents an uploaded meeting audio file and its processing result.
/// This is the primary table — stores meeting metadata, file info, and status.
/// </summary>
public class MeetingEntity
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public UserEntity? User { get; set; }

    /// <summary>User-provided meeting name (max 50 chars).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description (max 100 chars).</summary>
    public string? Description { get; set; }

    /// <summary>Project this meeting belongs to (nullable — null means uncategorized).</summary>
    public int? ProjectId { get; set; }
    public ProjectEntity? Project { get; set; }

    /// <summary>Template ID used for extraction (e.g., "meeting-minutes").</summary>
    public string TemplateId { get; set; } = string.Empty;

    /// <summary>Template display name at time of upload.</summary>
    //public string TemplateName { get; set; } = string.Empty;

    /// <summary>Original uploaded audio file name.</summary>
    public string AudioFileName { get; set; } = string.Empty;

    /// <summary>File size in bytes.</summary>
    public long AudioFileSize { get; set; }

    /// <summary>Path or key where audio file is stored (local path or S3 key).</summary>
    public string? AudioStoragePath { get; set; }

    /// <summary>Processing status: Processing, Completed, Error, NoData.</summary>
    public string Status { get; set; } = "Processing";

    /// <summary>Error message if status is Error.</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>Raw transcript text from Deepgram.</summary>
    public string? Transcript { get; set; }

    /// <summary>JSON string of the AI-generated extraction result (never overwritten by user edits).</summary>
    public string ExtractionResultJson { get; set; }

    /// <summary>JSON string of the user-edited extraction result (nullable — null means not edited yet).</summary>
    public string? EditedResultJson { get; set; }

    /// <summary>When the meeting actually happened (user-provided).</summary>
    public DateTime? MeetingDate { get; set; }

    /// <summary>When the meeting was uploaded.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>When the processing completed (or failed).</summary>
    public DateTime? CompletedAt { get; set; }
}
