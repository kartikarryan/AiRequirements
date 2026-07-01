using System.Text;
using System.Text.Json;
using Amazon;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Amazon.Runtime.CredentialManagement;
using MeetScribe.Ai.Setting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MeetScribe.Ai.Clients;

/// <summary>
/// AWS Bedrock implementation of IAiClient.
/// Calls Claude models (Haiku, Sonnet, Opus) via AWS Bedrock.
///
/// To switch between Claude models, just change ModelId in appsettings:
///   - Claude Haiku: "us.anthropic.claude-haiku-4-5-20251001-v1:0"
///   - Claude Sonnet: "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
///   - Claude Opus: "us.anthropic.claude-opus-4-6-v1"
/// </summary>
public sealed class BedrockClient : IAiClient
{
    private readonly AmazonBedrockRuntimeClient _client;
    private readonly string _modelId;
    private readonly ILogger<BedrockClient> _logger;

    public BedrockClient(IOptions<BedrockSettings> settings, ILogger<BedrockClient> logger)
    {
        _logger = logger;
        _modelId = settings.Value.ModelId;

        var region = RegionEndpoint.GetBySystemName(settings.Value.Region ?? "us-east-1");

        var chain = new CredentialProfileStoreChain();

        if (!chain.TryGetAWSCredentials("659775407886_wl-loft-engineer", out var credentials))
        {
            throw new Exception("Profile not found");
        }

        _client = new AmazonBedrockRuntimeClient(credentials, region);
    }

    public async Task<string> SendPromptAsync(
        string systemPrompt,
        string userPrompt,
        float temperature = 0.1f,
        CancellationToken cancellationToken = default)
    {
        // Build Claude Messages API request body
        var requestBody = new
        {
            anthropic_version = "bedrock-2023-05-31",
            max_tokens = 8192,
            temperature = temperature,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = userPrompt }
            }
        };

        var jsonRequest = JsonSerializer.Serialize(requestBody);

        var request = new InvokeModelRequest
        {
            ModelId = _modelId,
            ContentType = "application/json",
            Accept = "application/json",
            Body = new MemoryStream(Encoding.UTF8.GetBytes(jsonRequest))
        };

        _logger.LogInformation("Calling Bedrock model: {ModelId}", _modelId);

        var response = await _client.InvokeModelAsync(request, cancellationToken);

        // Parse response
        using var reader = new StreamReader(response.Body);
        var responseJson = await reader.ReadToEndAsync(cancellationToken);

        var responseDoc = JsonDocument.Parse(responseJson);
        var content = responseDoc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;

        _logger.LogDebug("Bedrock raw response: {Response}", content);

        // Claude may wrap JSON in markdown code fences — strip them
        content = StripMarkdownCodeFences(content);

        return content;
    }

    /// <summary>
    /// Strips markdown code fences from Claude's response.
    /// Claude sometimes wraps JSON in ```json ... ``` even when asked not to.
    /// </summary>
    private static string StripMarkdownCodeFences(string text)
    {
        var trimmed = text.Trim();

        // Remove ```json at start and ``` at end
        if (trimmed.StartsWith("```"))
        {
            var firstNewline = trimmed.IndexOf('\n');
            if (firstNewline > 0)
            {
                trimmed = trimmed[(firstNewline + 1)..];
            }
        }

        if (trimmed.EndsWith("```"))
        {
            trimmed = trimmed[..^3].TrimEnd();
        }

        return trimmed;
    }
}
