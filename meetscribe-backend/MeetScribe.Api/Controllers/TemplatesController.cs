using MeetScribe.Ai.Config;
using Microsoft.AspNetCore.Mvc;

namespace MeetScribe.Api.Controllers;

/// <summary>
/// Serves template configuration to the frontend.
/// Frontend uses this to render the template selector and
/// know how to display sections returned by the extraction API.
///
/// Future: This endpoint will also support CRUD for custom templates.
/// </summary>
[Route("api/templates")]
[ApiController]
public class TemplatesController : ControllerBase
{
    private readonly ITemplateConfigLoader _configLoader;

    public TemplatesController(ITemplateConfigLoader configLoader)
    {
        _configLoader = configLoader;
    }

    /// <summary>
    /// Returns the full template config (section types + templates).
    /// Frontend caches this and uses it for rendering.
    /// </summary>
    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        var config = _configLoader.GetConfig();
        return Ok(config);
    }

    /// <summary>
    /// Returns only the list of available templates (for the upload dropdown).
    /// </summary>
    [HttpGet]
    public IActionResult GetTemplates()
    {
        var templates = _configLoader.GetAllTemplates()
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Description,
                SectionCount = t.Sections.Count
            });

        return Ok(templates);
    }
}
