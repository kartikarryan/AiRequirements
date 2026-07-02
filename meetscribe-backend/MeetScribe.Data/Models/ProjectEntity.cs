namespace MeetScribe.Data.Models;

public class ProjectEntity
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public UserEntity? User { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Which ticket provider this project exports to.
    /// Null = auto (uses only connected provider, or asks user if multiple).
    /// Values: "AzureDevOps", "Jira", "Linear"
    /// </summary>
    public string? LinkedProvider { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<MeetingEntity> Meetings { get; set; } = new();
}
