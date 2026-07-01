using MeetScribe.Api.Managers;
using MeetScribe.ViewModels;
using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.AspNetCore.Mvc;

namespace MeetScribe.Api.Controllers
{
    [Route("api/requirements")]
    [ApiController]
    public class RequirementController : ControllerBase
    {
        private readonly IRequirementManager _requirementManager;

        public RequirementController(IRequirementManager requirementManager)
        {
            _requirementManager = requirementManager;
        }

        [HttpPost]
        [RequestSizeLimit(210 * 1024 * 1024)] // 210 MB
        [RequestTimeout(600_000)] // 10 minutes
        public async Task<IActionResult> GenerateRequirements(AudioTranscriptionRequest request)
        {
            var result = await _requirementManager.GenerateRequirementsAsync(request);

            return StatusCode(result.StatusCode, result);
        }
    }
}
