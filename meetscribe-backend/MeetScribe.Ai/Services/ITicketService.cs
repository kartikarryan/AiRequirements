namespace MeetScribe.Ai.Services;

/// <summary>
/// Common interface for all ticket management providers.
/// Each provider (Azure DevOps, Jira, Linear) implements this.
/// Factory resolves the correct implementation based on provider name.
///
/// Settings are passed as Dictionary — each provider reads its own keys.
/// </summary>
public interface ITicketService
{
    Task<bool> TestConnectionAsync(Dictionary<string, string> settings, CancellationToken cancellationToken = default);
    Task<List<string>> GetProjectsAsync(Dictionary<string, string> settings, CancellationToken cancellationToken = default);
    Task<List<string>> GetIterationsAsync(Dictionary<string, string> settings, string project, CancellationToken cancellationToken = default);
    Task<List<string>> GetWorkItemTypesAsync(Dictionary<string, string> settings, string project, CancellationToken cancellationToken = default);
    Task<CreateWorkItemResult> CreateWorkItemAsync(Dictionary<string, string> settings, string project, CreateWorkItemRequest request, CancellationToken cancellationToken = default);
    Task<List<DuplicateWorkItem>> FindDuplicatesAsync(Dictionary<string, string> settings, string project, string title, CancellationToken cancellationToken = default);
    Task<List<DuplicateWorkItem>> FindDuplicatesBatchAsync(Dictionary<string, string> settings, string project, List<string> titles, CancellationToken cancellationToken = default);
}

// -------------------------------------------------------------------------
// Shared Models (used by all providers)
// -------------------------------------------------------------------------

public class CreateWorkItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string WorkItemType { get; set; } = "Task";
    public int? Priority { get; set; }
    public string? IterationPath { get; set; }
    public string? AreaPath { get; set; }
    public string? Tags { get; set; }
    public string? AssignedTo { get; set; }
}

public class CreateWorkItemResult
{
    public bool Success { get; set; }
    public int WorkItemId { get; set; }
    public string WorkItemUrl { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}

public class DuplicateWorkItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string WorkItemType { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}
