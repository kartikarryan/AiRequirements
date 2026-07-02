using MeetScribe.Api.Exceptions;
using MeetScribe.ViewModels;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.Json;

namespace MeetScribe.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var apiResponse = new ApiResponse<object>();

        switch (exception)
        {
            case AppValidationException validationEx:
                _logger.LogInformation(
                    "Validation failed. Path={Path} Errors={Errors}",
                    context.Request.Path, string.Join("; ", validationEx.Errors ?? new()));
                apiResponse.StatusCode = validationEx.StatusCode;
                apiResponse.Message = validationEx.Message;
                apiResponse.Errors = validationEx.Errors;
                break;

            case NotFoundException notFoundEx:
                _logger.LogWarning(
                    "Resource not found. Path={Path} Message={Message}",
                    context.Request.Path, notFoundEx.Message);
                apiResponse.StatusCode = notFoundEx.StatusCode;
                apiResponse.Message = notFoundEx.Message;
                break;

            case ForbiddenException forbiddenEx:
                _logger.LogWarning(
                    "Access denied. Path={Path} Message={Message}",
                    context.Request.Path, forbiddenEx.Message);
                apiResponse.StatusCode = forbiddenEx.StatusCode;
                apiResponse.Message = forbiddenEx.Message;
                break;

            case QuotaExceededException quotaEx:
                _logger.LogWarning(
                    "Quota exceeded. Path={Path} Message={Message}",
                    context.Request.Path, quotaEx.Message);
                apiResponse.StatusCode = quotaEx.StatusCode;
                apiResponse.Message = quotaEx.Message;
                break;

            case ConflictException conflictEx:
                _logger.LogWarning(
                    "Conflict. Path={Path} Message={Message}",
                    context.Request.Path, conflictEx.Message);
                apiResponse.StatusCode = conflictEx.StatusCode;
                apiResponse.Message = conflictEx.Message;
                break;

            case AppException appEx:
                _logger.LogError(appEx,
                    "Application error. Path={Path} Message={Message}",
                    context.Request.Path, appEx.Message);
                apiResponse.StatusCode = appEx.StatusCode;
                apiResponse.Message = appEx.Message;
                apiResponse.Errors = appEx.Errors;
                break;

            case DbUpdateException dbEx:
                _logger.LogError(dbEx,
                    "Database error. Path={Path} Method={Method}",
                    context.Request.Path, context.Request.Method);
                apiResponse.StatusCode = (int)HttpStatusCode.InternalServerError;
                apiResponse.Message = "A database error occurred. Please try again.";
                break;

            case TaskCanceledException:
            case OperationCanceledException:
                _logger.LogInformation("Request cancelled. Path={Path}", context.Request.Path);
                apiResponse.StatusCode = 499;
                apiResponse.Message = "Request was cancelled.";
                break;

            case HttpRequestException httpEx:
                _logger.LogError(httpEx,
                    "External service error. Path={Path} Method={Method}",
                    context.Request.Path, context.Request.Method);
                apiResponse.StatusCode = (int)HttpStatusCode.BadGateway;
                apiResponse.Message = "External service is unavailable. Please try again.";
                break;

            default:
                _logger.LogCritical(exception,
                    "Unhandled exception. Path={Path} Method={Method} Type={ExceptionType}",
                    context.Request.Path, context.Request.Method, exception.GetType().Name);
                apiResponse.StatusCode = (int)HttpStatusCode.InternalServerError;
                apiResponse.Message = "Something went wrong. Please try again.";
                break;
        }

        response.StatusCode = apiResponse.StatusCode;

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await response.WriteAsJsonAsync(apiResponse, jsonOptions);
    }
}
