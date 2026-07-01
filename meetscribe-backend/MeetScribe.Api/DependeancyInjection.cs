using FluentValidation;
using MeetScribe.Api.Common.Utility;
using MeetScribe.Api.Managers;
using MeetScribe.Validators;
using MeetScribe.ViewModels;

namespace MeetScribe.Api
{
    public static class DependeancyInjection
    {
        public static void AddMeetScribeApi(this IServiceCollection services, IConfiguration configuration)
        {
            // Managers
            services.AddScoped<IRequirementManager, RequirementManager>();
            services.AddScoped<IMeetingsManager, MeetingsManager>();
            services.AddScoped<IProjectManager, ProjectManager>();
            services.AddScoped<IIntegrationSettingsManager, IntegrationSettingsManager>();
            services.AddScoped<IExportManager, ExportManager>();
            services.AddScoped<IApiResponseBuilder, ApiResponseBuilder>();

            // Validators
            services.AddScoped<IValidator<CreateProjectRequest>, CreateProjectValidator>();
            services.AddScoped<IValidator<BatchExportRequest>, BatchExportValidator>();
            
        }
    }
}
