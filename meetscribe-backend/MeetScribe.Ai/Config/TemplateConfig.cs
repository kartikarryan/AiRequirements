using System.Text.Json.Serialization;

namespace MeetScribe.Ai.Config;

/// <summary>
/// Root configuration object loaded from templates-config.json.
/// Single source of truth for all template and section type definitions.
/// Both backend (prompt building) and frontend (rendering) use this config.
/// </summary>
public sealed class TemplateConfig
{
    [JsonPropertyName("section_types")]
    public Dictionary<string, SectionTypeConfig> SectionTypes { get; set; } = new();

    [JsonPropertyName("templates")]
    public List<TemplateDefinition> Templates { get; set; } = new();
}

/// <summary>
/// Defines a section type — how AI should extract it and how UI should display it.
/// </summary>
public sealed class SectionTypeConfig
{
    [JsonPropertyName("display")]
    public string Display { get; set; } = "paragraph";

    [JsonPropertyName("prompt_instruction")]
    public string PromptInstruction { get; set; } = string.Empty;

    [JsonPropertyName("exportable")]
    public bool Exportable { get; set; } = false;

    [JsonPropertyName("defaultWorkItemType")]
    public string? DefaultWorkItemType { get; set; }

    [JsonPropertyName("fields")]
    public List<string> Fields { get; set; } = new();

    [JsonPropertyName("columns")]
    public List<ColumnConfig>? Columns { get; set; }

    [JsonPropertyName("examples")]
    public SectionExamples? Examples { get; set; }
}

/// <summary>
/// Good/bad extraction examples to improve AI accuracy via few-shot learning.
/// </summary>
public sealed class SectionExamples
{
    [JsonPropertyName("good")]
    public List<string> Good { get; set; } = new();

    [JsonPropertyName("bad")]
    public List<string> Bad { get; set; } = new();
}

/// <summary>
/// Column definition for table-type sections.
/// </summary>
public sealed class ColumnConfig
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("editable")]
    public bool Editable { get; set; }
}

/// <summary>
/// Defines a complete template — its metadata and which sections it includes.
/// </summary>
public sealed class TemplateDefinition
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("sections")]
    public List<TemplateSectionRef> Sections { get; set; } = new();

    [JsonPropertyName("cross_section_rules")]
    public List<string> CrossSectionRules { get; set; } = new();
}

/// <summary>
/// Reference to a section within a template.
/// Links a section key to its type and display label.
/// </summary>
public sealed class TemplateSectionRef
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;
}
