using MeetScribe.Ai.Clients;
using MeetScribe.Ai.Config;
using MeetScribe.Ai.Managers;
using MeetScribe.Ai.Prompts;
using MeetScribe.Ai.Services;
using MeetScribe.Ai.Setting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MeetScribe.Ai;

public static class DependeancyInjection
{
    public static void AddMeetScribeAi(this IServiceCollection services, IConfiguration configuration)
    {
        // Settings
        services.Configure<DeepgramSettings>(configuration.GetSection("DeepgramSettings"));
        services.Configure<OpenAISettings>(configuration.GetSection("OpenAiSettings"));
        services.Configure<BedrockSettings>(configuration.GetSection("BedrockSettings"));
        services.Configure<AnthropicSettings>(configuration.GetSection("AnthropicSettings"));

        // Config loader — singleton (loads once, caches in memory)
        services.AddSingleton<ITemplateConfigLoader, TemplateConfigLoader>();

        // AI Client — plugin pattern (switch provider via config)
        var aiProvider = configuration.GetValue<string>("AiProvider") ?? "Bedrock";

        switch (aiProvider.ToLower())
        {
            case "openai":
                services.AddScoped<IAiClient, OpenAiClient>();
                break;
            case "anthropic":
                services.AddScoped<IAiClient, AnthropicClient>();
                break;
            case "bedrock":
            default:
                services.AddScoped<IAiClient, BedrockClient>();
                break;
        }

        // Prompt builder
        services.AddSingleton<IPromptBuilder, PromptBuilder>();

        // Ticket integration services (plugin pattern)
        services.AddHttpClient<AzureDevOpsTicketService>();
        services.AddSingleton<ITicketServiceFactory, TicketServiceFactory>();

        // Managers
        services.AddScoped<ITranscriptionManager, TranscriptionManager>();
        services.AddScoped<IRequirementExtractionManager, RequirementExtractionManager>();
    }
}
