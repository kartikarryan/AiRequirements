namespace MeetScribe.ViewModels;

public class ProjectListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LinkedProvider { get; set; }
    public DateTime CreatedAt { get; set; }
    public int MeetingCount { get; set; }
    public DateTime? LastActivityAt { get; set; }
}
