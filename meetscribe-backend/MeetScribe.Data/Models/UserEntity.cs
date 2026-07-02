namespace MeetScribe.Data.Models;

public class UserEntity
{
    public int Id { get; set; }

    /// <summary>Cognito unique identifier (sub claim from JWT).</summary>
    public string CognitoSub { get; set; } = string.Empty;

    /// <summary>User's email from Google.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Display name from Google profile.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Google profile picture URL.</summary>
    public string? PictureUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public int UploadLimit { get; set; } = 5;

    public int UploadsUsed { get; set; } = 0;

    public DateTime? QuotaResetAt { get; set; }

    public bool IsAdmin { get; set; } = false;

    public string? AdminNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    public List<ProjectEntity> Projects { get; set; } = new();
    public List<MeetingEntity> Meetings { get; set; } = new();
    public List<IntegrationSettingEntity> IntegrationSettings { get; set; } = new();
}
