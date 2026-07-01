namespace MeetScribe.ViewModels;

public record SaveExtractionRequest(string EditedResultJson);
public record RetryExtractionRequest(string? TemplateId);
