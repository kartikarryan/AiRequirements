namespace MeetScribe.ViewModels;

public sealed class ExtractionResponse
{
    public string TemplateId { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public List<ExtractedSection> Sections { get; set; } = new();
}

public sealed class ExtractedSection
{
    public string Key { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public object? Data { get; set; }
}
