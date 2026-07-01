namespace MeetScribe.Data.Models;

public class ExportedTicketEntity
{
    public int Id { get; set; }
    public int MeetingId { get; set; }
    public MeetingEntity? Meeting { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public string? IterationPath { get; set; }
    public int ExternalTicketId { get; set; }
    public string ExternalTicketUrl { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string WorkItemType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
