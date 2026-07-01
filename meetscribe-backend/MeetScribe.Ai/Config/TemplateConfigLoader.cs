using System.Text.Json;

namespace MeetScribe.Ai.Config;

/// <summary>
/// Loads and provides access to the template configuration.
/// Reads from templates-config.json on startup and caches in memory.
///
/// Future: This can be replaced with a database-backed implementation
/// without changing the interface.
/// </summary>
public interface ITemplateConfigLoader
{
    /// <summary>Returns the full configuration (section types + templates).</summary>
    TemplateConfig GetConfig();

    /// <summary>Returns a specific template by ID, or null if not found.</summary>
    TemplateDefinition? GetTemplate(string templateId);

    /// <summary>Returns all available templates (for UI dropdown).</summary>
    IReadOnlyList<TemplateDefinition> GetAllTemplates();

    /// <summary>Returns a section type definition by key.</summary>
    SectionTypeConfig? GetSectionType(string typeKey);
}

public sealed class TemplateConfigLoader : ITemplateConfigLoader
{
    private readonly TemplateConfig _config;

    public TemplateConfigLoader()
    {
        var configPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "Config", "templates-config.json");

        if (!File.Exists(configPath))
        {
            throw new FileNotFoundException(
                $"Template configuration file not found at: {configPath}");
        }

        var json = File.ReadAllText(configPath);

        _config = JsonSerializer.Deserialize<TemplateConfig>(json)
            ?? throw new InvalidOperationException("Failed to deserialize template config.");
    }

    public TemplateConfig GetConfig() => _config;

    public TemplateDefinition? GetTemplate(string templateId)
    {
        return _config.Templates.FirstOrDefault(t =>
            t.Id.Equals(templateId, StringComparison.OrdinalIgnoreCase));
    }

    public IReadOnlyList<TemplateDefinition> GetAllTemplates()
    {
        return _config.Templates.AsReadOnly();
    }

    public SectionTypeConfig? GetSectionType(string typeKey)
    {
        return _config.SectionTypes.GetValueOrDefault(typeKey);
    }
}
