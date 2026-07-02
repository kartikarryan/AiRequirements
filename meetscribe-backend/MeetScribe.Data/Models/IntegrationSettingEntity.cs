namespace MeetScribe.Data.Models;

/// <summary>
/// Stores ticket system integration configuration.
/// Uses SettingsJson to store provider-specific fields dynamically.
/// Different providers have different fields — all stored as JSON.
///
/// Examples:
///   AzureDevOps: {"organizationUrl": "...", "accessToken": "...", "patExpiryDate": "..."}
///   Jira: {"domain": "...", "email": "...", "apiToken": "..."}
///   Linear: {"apiKey": "..."}
/// </summary>
public class IntegrationSettingEntity
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public UserEntity? User { get; set; }

    /// <summary>Provider ID: "AzureDevOps", "Jira", "Linear"</summary>
    public string Provider { get; set; } = string.Empty;

    /// <summary>All provider-specific settings stored as JSON (dynamic fields)</summary>
    public string SettingsJson { get; set; } = "{}";

    /// <summary>Whether this integration is active</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>When the connection was configured</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>When the settings were last updated</summary>
    public DateTime? UpdatedAt { get; set; }
}
