namespace MeetScribe.Ai.Clients;

/// <summary>
/// Plugin interface for AI model providers.
/// Any AI service (OpenAI, Bedrock/Claude, Gemini, etc.) implements this.
/// ExtractionManager calls this — doesn't know or care which model is behind it.
///
/// To add a new provider:
///   1. Create a new class implementing IAiClient
///   2. Register it in DI based on config
///   That's it — ExtractionManager stays unchanged.
/// </summary>
public interface IAiClient
{
    /// <summary>
    /// Sends a prompt to the AI model and returns the response text.
    /// </summary>
    /// <param name="systemPrompt">System/role instructions</param>
    /// <param name="userPrompt">User message with transcript and extraction instructions</param>
    /// <param name="temperature">Creativity level (0.0 = deterministic, 1.0 = creative)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Raw JSON string response from the model</returns>
    Task<string> SendPromptAsync(
        string systemPrompt,
        string userPrompt,
        float temperature = 0.1f,
        CancellationToken cancellationToken = default);
}
