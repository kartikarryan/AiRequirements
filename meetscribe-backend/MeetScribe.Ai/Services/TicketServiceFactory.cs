using Microsoft.Extensions.DependencyInjection;

namespace MeetScribe.Ai.Services;

/// <summary>
/// Factory that resolves the correct ITicketService implementation
/// based on provider name from the database.
///
/// To add a new provider:
///   1. Create XyzService implementing ITicketService
///   2. Add case to GetService() below
///   That's it — controller and frontend work automatically.
/// </summary>
public interface ITicketServiceFactory
{
    ITicketService GetService(string provider);
    bool IsSupported(string provider);
}

public class TicketServiceFactory : ITicketServiceFactory
{
    private readonly IServiceProvider _serviceProvider;

    public TicketServiceFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public ITicketService GetService(string provider)
    {
        return provider switch
        {
            "AzureDevOps" => _serviceProvider.GetRequiredService<AzureDevOpsTicketService>(),
            // "Jira" => _serviceProvider.GetRequiredService<JiraTicketService>(),
            // "Linear" => _serviceProvider.GetRequiredService<LinearTicketService>(),
            _ => throw new NotSupportedException($"Provider '{provider}' is not supported.")
        };
    }

    public bool IsSupported(string provider)
    {
        return provider switch
        {
            "AzureDevOps" => true,
            // "Jira" => true,
            // "Linear" => true,
            _ => false
        };
    }
}
