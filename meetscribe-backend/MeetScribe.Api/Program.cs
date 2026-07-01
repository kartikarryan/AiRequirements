using MeetScribe.Ai;
using MeetScribe.Api;
using MeetScribe.Api.Middleware;
using MeetScribe.Data;

var builder = WebApplication.CreateBuilder(args);

// Increase limits for large audio file uploads (200 MB, 10 min timeout)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 210 * 1024 * 1024; // 210 MB (slightly over 200 MB limit)
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10);
});

// Add services to the container.

builder.Services.AddControllers(options =>
{
    options.MaxModelBindingCollectionSize = int.MaxValue;
}).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS — allows React frontend (localhost:5173) to call this API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",   // Vite dev server
                "http://localhost:3000" ,   // Alternative React port
                "http://10.175.197.131:501",
                "http://10.175.197.100:2601",// Deployed 131 React port
                "http://10.175.197.100:2601"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddMeetScribeApi(builder.Configuration);
builder.Services.AddMeetScribeAi(builder.Configuration);
builder.Services.AddMeetScribeData(builder.Configuration);

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();

// Global exception handler — must be early in pipeline to catch all errors
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    //app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
