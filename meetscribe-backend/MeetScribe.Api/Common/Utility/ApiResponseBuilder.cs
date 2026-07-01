using MeetScribe.ViewModels;

namespace MeetScribe.Api.Common.Utility;

public interface IApiResponseBuilder
{
    ApiResponse<T> Ok<T>(T? data, string? message = null);
    ApiResponse<T> Created<T>(T? data, string? message = null);
    ApiResponse<T> NoConent<T>(T? data, string? message = null);
    ApiResponse<T> NotFound<T>(T? data, string? message = null);
    ApiResponse<T> BadRequest<T>(T? data, string? message = null, List<string>? erros = null);
    ApiResponse<T> Conflict<T>(T? data, string? message = null);
    ApiResponse<T> InternalServerError<T>(T? data, string? message = null);
}
public class ApiResponseBuilder : IApiResponseBuilder
{
    // 200 OK
    public ApiResponse<T> Ok<T>(T? data, string? message = null)
    {
        return new ApiResponse<T>
        {
            StatusCode = 200,
            Message = message,
            Data = data
        };
    }
    public ApiResponse<T> Created<T>(T? data, string? message = null)
    {
        return new ApiResponse<T>
        {
            StatusCode = 201,
            Message = message,
            Data = data
        };
    }
    public ApiResponse<T> NoConent<T>(T? data, string? message = null)
    {
        return new ApiResponse<T>
        {
            StatusCode = 204,
            Message = message,
            Data = data
        };
    }

    public ApiResponse<T> NotFound<T>(T? data, string? message = null)
    {
        return new ApiResponse<T>
        {
            StatusCode = 404,
            Message = message,
            Data = data
        };
    }
    public ApiResponse<T> BadRequest<T>(T? data, string? message = null, List<string>? erros = null)
    {
        return new ApiResponse<T>
        {
            StatusCode = 400,
            Message = message,
            Data = data,
            Errors = erros
        };
    }

    public ApiResponse<T> Conflict<T>(T? data, string? message = null)
    {
        return new ApiResponse<T>
        {
            StatusCode = 409,
            Message = message,
            Data = data,
        };
    }

    public ApiResponse<T> InternalServerError<T>(T? data, string? message = null)
    {
        return new ApiResponse<T>
        {
            StatusCode = 500,
            Message = message,
            Data = data,
        };
    }
}
