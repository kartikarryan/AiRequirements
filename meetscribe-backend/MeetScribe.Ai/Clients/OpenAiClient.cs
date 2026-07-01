using MeetScribe.Ai.Setting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI.Chat;

namespace MeetScribe.Ai.Clients;

/// <summary>
/// OpenAI implementation of IAiClient.
/// Uses GPT-4o-mini or any OpenAI model via the OpenAI SDK.
/// </summary>
public sealed class OpenAiClient : IAiClient
{
    private readonly ChatClient _chatClient;
    private readonly ILogger<OpenAiClient> _logger;

    public OpenAiClient(IOptions<OpenAISettings> settings, ILogger<OpenAiClient> logger)
    {
        _logger = logger;
        _chatClient = new ChatClient(
            model: settings.Value.Model ?? "gpt-4o-mini",
            apiKey: settings.Value.ApiKey);
    }

    public async Task<string> SendPromptAsync(
        string systemPrompt,
        string userPrompt,
        float temperature = 0.1f,
        CancellationToken cancellationToken = default)
    {
        var messages = new List<ChatMessage>
        {
            ChatMessage.CreateSystemMessage(systemPrompt),
            ChatMessage.CreateUserMessage(userPrompt)
        };

        var options = new ChatCompletionOptions
        {
            ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat(),
            Temperature = temperature
        };

        var completion = await _chatClient.CompleteChatAsync(
            messages, options, cancellationToken);

        var json = completion.Value.Content[0].Text;

        _logger.LogDebug("OpenAI response length: {Length} chars", json?.Length ?? 0);

        return json ?? string.Empty;
    }
}
