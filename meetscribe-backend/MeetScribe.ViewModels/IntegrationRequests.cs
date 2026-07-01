namespace MeetScribe.ViewModels;

public class ExportRequest
{
    public string Project { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? WorkItemType { get; set; }
    public int? Priority { get; set; }
    public string? IterationPath { get; set; }
    public string? Tags { get; set; }
    public string? AssignedTo { get; set; }
    public int? MeetingId { get; set; }
}

public class CheckDuplicateRequest
{
    public string Project { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int? MeetingId { get; set; }
}

public class BatchExportRequest
{
    public string Project { get; set; } = string.Empty;
    public string? IterationPath { get; set; }
    public int? MeetingId { get; set; }
    public bool Force { get; set; } = false;
    public List<BatchExportItem> Items { get; set; } = new();
}

public class BatchExportItem
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? WorkItemType { get; set; }
    public int? Priority { get; set; }
    public string? Tags { get; set; }
    public string? AssignedTo { get; set; }
}
