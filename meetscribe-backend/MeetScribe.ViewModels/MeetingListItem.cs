namespace MeetScribe.ViewModels;

public sealed class MeetingListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TemplateId { get; set; } = string.Empty;
    public string AudioFileName { get; set; } = string.Empty;
    public long AudioFileSize { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public int? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public DateTime? MeetingDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
