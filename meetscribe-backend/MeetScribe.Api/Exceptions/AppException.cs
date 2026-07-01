namespace MeetScribe.Api.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }
    public List<string>? Errors { get; }

    public AppException(string message, int statusCode = 500, List<string>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Errors = errors;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message = "Resource not found.")
        : base(message, 404) { }
}

public class ConflictException : AppException
{
    public ConflictException(string message = "Resource already exists.")
        : base(message, 409) { }
}

public class AppValidationException : AppException
{
    public AppValidationException(string message, List<string> errors)
        : base(message, 400, errors) { }
}
