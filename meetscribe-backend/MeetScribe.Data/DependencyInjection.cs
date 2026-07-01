using MeetScribe.Data.Context;
using MeetScribe.Data.Repository;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MeetScribe.Data;

/// <summary>
/// Registers data layer services: DbContext and repositories.
/// Called from Program.cs to keep registration centralized.
/// </summary>
public static class DependencyInjection
{
    public static void AddMeetScribeData(this IServiceCollection services, IConfiguration configuration)
    {
        // Register DbContext with PostgreSQL
        services.AddDbContext<MeetScribeDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"));
        });

        // Register repositories
        services.AddScoped<IMeetingRepository, MeetingRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<IIntegrationSettingRepository, IntegrationSettingRepository>();
        services.AddScoped<IExportedTicketRepository, ExportedTicketRepository>();
    }
}
