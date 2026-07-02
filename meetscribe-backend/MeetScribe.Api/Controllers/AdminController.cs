using MeetScribe.Api.Exceptions;
using MeetScribe.Api.Services;
using MeetScribe.Data.Context;
using MeetScribe.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Api.Controllers;

[Route("api/admin")]
[ApiController]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly MeetScribeDbContext _db;
    private readonly IUserContext _userContext;

    public AdminController(MeetScribeDbContext db, IUserContext userContext)
    {
        _db = db;
        _userContext = userContext;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers(CancellationToken cancellationToken)
    {
        await EnsureAdminAsync(cancellationToken);

        var users = await _db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.LastLoginAt)
            .Select(u => new AdminUserListItem
            {
                Id = u.Id,
                Email = u.Email,
                Name = u.Name,
                IsActive = u.IsActive,
                UploadLimit = u.UploadLimit,
                UploadsUsed = u.UploadsUsed,
                IsAdmin = u.IsAdmin,
                AdminNotes = u.AdminNotes,
                LastLoginAt = u.LastLoginAt,
                CreatedAt = u.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return Ok(new { data = users });
    }

    [HttpPut("users/{id}/status")]
    public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        await EnsureAdminAsync(cancellationToken);

        var user = await _db.Users.FindAsync(new object[] { id }, cancellationToken);
        if (user is null)
            return NotFound(new { message = "User not found." });

        user.IsActive = request.IsActive;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = $"User {user.Email} {(request.IsActive ? "enabled" : "disabled")}." });
    }

    [HttpPut("users/{id}/quota")]
    public async Task<IActionResult> UpdateUserQuota(int id, [FromBody] UpdateUserQuotaRequest request, CancellationToken cancellationToken)
    {
        await EnsureAdminAsync(cancellationToken);

        var user = await _db.Users.FindAsync(new object[] { id }, cancellationToken);
        if (user is null)
            return NotFound(new { message = "User not found." });

        user.UploadLimit = request.UploadLimit;
        if (request.ResetUsage)
            user.UploadsUsed = 0;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = $"User {user.Email} quota updated to {request.UploadLimit}." });
    }

    private async Task EnsureAdminAsync(CancellationToken cancellationToken)
    {
        var currentUser = await _userContext.GetCurrentUserAsync(cancellationToken);
        if (!currentUser.IsAdmin)
            throw new ForbiddenException("Admin access required.");
    }
}
