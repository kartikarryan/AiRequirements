using MeetScribe.Data.Models;

namespace MeetScribe.Api.Services;

public interface IUserContext
{
    /// <summary>
    /// Gets the current authenticated user's DB Id.
    /// Auto-creates the user record on first call if it doesn't exist.
    /// </summary>
    Task<int> GetUserIdAsync(CancellationToken cancellationToken = default);

    /// <summary>Gets the full user entity.</summary>
    Task<UserEntity> GetCurrentUserAsync(CancellationToken cancellationToken = default);
}
