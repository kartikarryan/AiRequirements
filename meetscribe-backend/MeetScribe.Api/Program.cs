using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MeetScribe.Ai;
using MeetScribe.Api;
using MeetScribe.Api.Middleware;
using MeetScribe.Api.Services;
using MeetScribe.Data;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog — daily log files, auto-delete after 5 days
var logPath = OperatingSystem.IsLinux()
    ? "/var/log/meetscribe/meetscribe-.log"
    : Path.Combine(AppContext.BaseDirectory, "logs", "meetscribe-.log");

builder.Host.UseSerilog((context, config) =>
{
    config
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
        .WriteTo.Console(outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss}] [{Level:u3}] {Message:lj}{NewLine}{Exception}")
        .WriteTo.File(
            path: logPath,
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 5,
            outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss}] [{Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}",
            shared: true
        );
});

// Increase limits for large audio file uploads (200 MB, 10 min timeout)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 210 * 1024 * 1024;
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10);
});

// Add services
builder.Services.AddControllers(options =>
{
    options.MaxModelBindingCollectionSize = int.MaxValue;
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS — reads allowed origins from config (appsettings.json or env vars)
var allowedOrigins = builder.Configuration["AllowedOrigins"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[]
    {
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ai-requirements-xi.vercel.app",
        "https://meet-scribe.com"
    };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// AWS Cognito JWT Authentication
var cognitoSettings = builder.Configuration.GetSection("CognitoSettings");
var region = cognitoSettings["Region"] ?? "us-east-1";
var userPoolId = cognitoSettings["UserPoolId"] ?? "us-east-1_PLACEHOLDER";
var clientId = cognitoSettings["ClientId"] ?? "PLACEHOLDER_CLIENT_ID";
var authority = $"https://cognito-idp.{region}.amazonaws.com/{userPoolId}";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Authority = authority;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        ValidateIssuer = true,
        ValidIssuer = authority,
        ValidateAudience = false,
        ValidateLifetime = true,
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = context =>
        {
            var claimClientId = context.Principal?.FindFirst("client_id")?.Value;
            if (claimClientId != clientId)
            {
                context.Fail("Invalid client_id");
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContext, UserContext>();

builder.Services.AddMeetScribeApi(builder.Configuration);
builder.Services.AddMeetScribeAi(builder.Configuration);
builder.Services.AddMeetScribeData(builder.Configuration);

var app = builder.Build();

// Swagger — Development only, or via secret path in production
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseSwagger(c => c.RouteTemplate = "internal-docs/{documentName}/swagger.json");
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/internal-docs/v1/swagger.json", "MeetScribe API");
        c.RoutePrefix = "internal-docs";
    });
}

// Enable CORS
app.UseCors();

// Global exception middleware
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{

    // app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.RunAsync();