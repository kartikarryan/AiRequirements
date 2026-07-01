namespace MeetScribe.Ai.Setting;

/// <summary>
/// Configuration for AWS Bedrock AI client.
/// Credentials can be provided here or via environment variables.
/// </summary>
public class BedrockSettings
{
    /// <summary>AWS region where Bedrock is available (e.g., "us-east-1")</summary>
    public string Region { get; set; } = "us-east-2";

    /// <summary>
    /// Model ID to use. Change this to switch Claude models:
    ///   - "us.anthropic.claude-haiku-4-5-20251001-v1:0" (fast, cheap)
    ///   - "us.anthropic.claude-sonnet-4-5-20250929-v1:0" (best accuracy)
    ///   - "us.anthropic.claude-opus-4-6-v1" (overkill)
    /// </summary>
    public string ModelId { get; set; } = "us.anthropic.claude-haiku-4-5-20251001-v1:0";

    /// <summary>AWS Access Key ID (optional if using environment variables or IAM role)</summary>
    //public string? AccessKeyId { get; set; }

    /// <summary>AWS Secret Access Key (optional if using environment variables or IAM role)</summary>
    //public string? SecretAccessKey { get; set; }

    /// <summary>AWS Session Token for temporary credentials (optional)</summary>
    //public string? SessionToken { get; set; }
}
