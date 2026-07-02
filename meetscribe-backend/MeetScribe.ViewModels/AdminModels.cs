namespace MeetScribe.ViewModels;

public class AdminUserListItem
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int UploadLimit { get; set; }
    public int UploadsUsed { get; set; }
    public bool IsAdmin { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}

public class UpdateUserQuotaRequest
{
    public int UploadLimit { get; set; }
    public bool ResetUsage { get; set; } = false;
}
