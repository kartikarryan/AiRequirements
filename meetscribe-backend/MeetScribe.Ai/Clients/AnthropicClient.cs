using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using MeetScribe.Ai.Setting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MeetScribe.Ai.Clients;

/// <summary>
/// Anthropic API implementation of IAiClient.
/// Calls Claude models directly via https://api.anthropic.com/v1/messages.
/// </summary>
public sealed class AnthropicClient : IAiClient
{
    private readonly HttpClient _httpClient;
    private readonly string _model;
    private readonly ILogger<AnthropicClient> _logger;

    public AnthropicClient(IOptions<AnthropicSettings> settings, ILogger<AnthropicClient> logger)
    {
        _logger = logger;
        _model = settings.Value.Model;

        _httpClient = new HttpClient
        {
            BaseAddress = new Uri("https://api.anthropic.com/")
        };
        _httpClient.DefaultRequestHeaders.Add("x-api-key", settings.Value.ApiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        _httpClient.Timeout = TimeSpan.FromMinutes(10);
    }

    public async Task<string> SendPromptAsync(
        string systemPrompt,
        string userPrompt,
        float temperature = 0.1f,
        CancellationToken cancellationToken = default)
    {
        var requestBody = new
        {
            model = _model,
            max_tokens = 8192,
            temperature = (double)temperature,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = userPrompt }
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _logger.LogInformation("Calling Anthropic model: {Model}", _model);

        var response = await _httpClient.PostAsync("v1/messages", content, cancellationToken);

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Anthropic API error: {Status} {Body}", response.StatusCode, responseBody);
            throw new HttpRequestException($"Anthropic API returned {response.StatusCode}: {responseBody}");
        }

        var responseDoc = JsonDocument.Parse(responseBody);
        var text = responseDoc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;

        _logger.LogDebug("Anthropic response length: {Length} chars", text.Length);

        return StripMarkdownCodeFences(text);
    }

    private static string StripMarkdownCodeFences(string text)
    {
        var trimmed = text.Trim();

        if (trimmed.StartsWith("```"))
        {
            var firstNewline = trimmed.IndexOf('\n');
            if (firstNewline > 0)
                trimmed = trimmed[(firstNewline + 1)..];
        }

        if (trimmed.EndsWith("```"))
            trimmed = trimmed[..^3].TrimEnd();

        return trimmed;
    }
}
