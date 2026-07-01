namespace MeetScribe.ViewModels;

public sealed class UploadResponse
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Message { get; set; }
}
