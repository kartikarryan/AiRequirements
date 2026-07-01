namespace MeetScribe.ViewModels
{
    public sealed class TranscriptResult
    {
        public string Transcript { get; set; } = string.Empty;

        public bool Success { get; set; }

        public string? ErrorMessage { get; set; }
    }
}
