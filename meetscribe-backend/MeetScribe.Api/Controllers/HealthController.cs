using MeetScribe.Data.Context;
using Microsoft.AspNetCore.Mvc;

namespace MeetScribe.Api.Controllers;

[Route("api/health")]
[ApiController]
public class HealthController : ControllerBase
{
    private readonly MeetScribeDbContext _db;

    public HealthController(MeetScribeDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Check()
    {
        try
        {
            var canConnect = await _db.Database.CanConnectAsync();
            return Ok(new
            {
                status = "healthy",
                database = canConnect ? "connected" : "disconnected",
                timestamp = DateTime.UtcNow,
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "unhealthy",
                database = "error",
                error = ex.Message,
                timestamp = DateTime.UtcNow,
            });
        }
    }
}
