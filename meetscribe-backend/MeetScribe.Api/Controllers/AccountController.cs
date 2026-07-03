using MeetScribe.Api.Services;
using MeetScribe.Data.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Api.Controllers;

[Route("api/account")]
[ApiController]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly MeetScribeDbContext _db;
    private readonly IUserContext _userContext;

    public AccountController(MeetScribeDbContext db, IUserContext userContext)
    {
        _db = db;
        _userContext = userContext;
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAccount(CancellationToken cancellationToken)
    {
        var currentUser = await _userContext.GetCurrentUserAsync(cancellationToken);

        var user = await _db.Users
            .Include(u => u.Projects)
            .Include(u => u.Meetings)
            .Include(u => u.IntegrationSettings)
            .FirstOrDefaultAsync(u => u.Id == currentUser.Id, cancellationToken);

        if (user is null)
            return NotFound(new { message = "User not found." });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Account and all associated data deleted successfully." });
    }
}
