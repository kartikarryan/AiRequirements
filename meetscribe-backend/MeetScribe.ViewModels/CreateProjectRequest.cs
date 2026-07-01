namespace MeetScribe.ViewModels
{
    public class CreateProjectRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? LinkedProvider { get; set; } = null;
    }
}
