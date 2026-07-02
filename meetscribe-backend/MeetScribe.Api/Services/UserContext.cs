using System.Security.Claims;
using MeetScribe.Api.Exceptions;
using MeetScribe.Data.Context;
using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Api.Services;

public class UserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly MeetScribeDbContext _db;
    private UserEntity? _cachedUser;

    public UserContext(IHttpContextAccessor httpContextAccessor, MeetScribeDbContext db)
    {
        _httpContextAccessor = httpContextAccessor;
        _db = db;
    }

    public async Task<int> GetUserIdAsync(CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        return user.Id;
    }

    public async Task<UserEntity> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (_cachedUser is not null)
            return _cachedUser;

        var claims = _httpContextAccessor.HttpContext?.User;
        var sub = claims?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? claims?.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(sub))
            throw new UnauthorizedAccessException("No user identity found in token.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.CognitoSub == sub, cancellationToken);

        if (user is null)
        {
            var email = claims?.FindFirst("email")?.Value
                        ?? claims?.FindFirst(ClaimTypes.Email)?.Value
                        ?? string.Empty;

            var name = claims?.FindFirst("name")?.Value
                       ?? claims?.FindFirst(ClaimTypes.Name)?.Value
                       ?? email;

            user = new UserEntity
            {
                CognitoSub = sub,
                Email = email,
                Name = name,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow,
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync(cancellationToken);
        }
        else
        {
            if (!user.IsActive)
                throw new ForbiddenException("Your account has been disabled. Contact an administrator.");

            user.LastLoginAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        _cachedUser = user;
        return user;
    }
}
