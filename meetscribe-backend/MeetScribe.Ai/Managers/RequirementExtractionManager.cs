using MeetScribe.Ai.Clients;
using MeetScribe.Ai.Config;
using MeetScribe.Ai.Prompts;
using MeetScribe.ViewModels;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace MeetScribe.Ai.Managers;

public interface IRequirementExtractionManager
{
    Task<ExtractionResponse> ExtractAsync(
        string transcript,
        string templateId = "meeting-minutes",
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Orchestrates AI extraction. Responsibilities:
///   - Looks up template from config
///   - Calls PromptBuilder to build prompts (separated for maintainability)
///   - Calls IAiClient to send to AI (plugin — OpenAI, Bedrock, Gemini)
///   - Parses response JSON into sections
///   - Post-processes confidence scores
///
/// To change prompt logic: edit Prompts/PromptBuilder.cs
/// To change AI provider: edit Clients/ and config
/// To change post-processing: edit this file
/// </summary>
public sealed class RequirementExtractionManager : IRequirementExtractionManager
{
    private readonly IAiClient _aiClient;
    private readonly IPromptBuilder _promptBuilder;
    private readonly ITemplateConfigLoader _configLoader;
    private readonly ILogger<RequirementExtractionManager> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public RequirementExtractionManager(
        IAiClient aiClient,
        IPromptBuilder promptBuilder,
        ITemplateConfigLoader configLoader,
        ILogger<RequirementExtractionManager> logger)
    {
        _aiClient = aiClient;
        _promptBuilder = promptBuilder;
        _configLoader = configLoader;
        _logger = logger;
    }

    public async Task<ExtractionResponse> ExtractAsync(
        string transcript,
        string templateId = "meeting-minutes",
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(transcript);

        var template = _configLoader.GetTemplate(templateId);
        if (template is null)
        {
            _logger.LogWarning("Template not found: {TemplateId}.", templateId);
            return new ExtractionResponse();
        }

        _logger.LogInformation("Extracting with template: {TemplateId} ({TemplateName})",
            template.Id, template.Name);

        var systemPrompt = _promptBuilder.BuildSystemPrompt();
        var userPrompt = _promptBuilder.BuildUserPrompt(template, transcript);

        try
        {
            var json = await _aiClient.SendPromptAsync(
                systemPrompt, userPrompt, temperature: 0.1f, cancellationToken);

            if (string.IsNullOrWhiteSpace(json))
            {
                _logger.LogWarning("AI returned empty response.");
                return BuildEmptyResponse(template);
            }

            _logger.LogDebug("Raw extraction: {Response}", json);

            var response = ParseAndMapResponse(json, template);

            PostProcessConfidence(response);
            CorrectObviouslyWrongScores(response);
            StripRoleAssignees(response);

            LogSummary(response);
            return response;
        }
        catch (OperationCanceledException) { throw; }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize AI response.");
            return BuildEmptyResponse(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Extraction failed.");
            return BuildEmptyResponse(template);
        }
    }

    // -------------------------------------------------------------------------
    // Response Parsing
    // -------------------------------------------------------------------------

    private ExtractionResponse ParseAndMapResponse(string json, TemplateDefinition template)
    {
        var rawData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, JsonOptions)
            ?? new Dictionary<string, JsonElement>();

        var sections = new List<ExtractedSection>();

        foreach (var sectionRef in template.Sections)
        {
            var sectionType = _configLoader.GetSectionType(sectionRef.Type);
            object? data = null;

            if (rawData.TryGetValue(sectionRef.Key, out var element))
            {
                data = ConvertJsonElement(element, sectionType);
            }

            sections.Add(new ExtractedSection
            {
                Key = sectionRef.Key,
                Type = sectionRef.Type,
                Label = sectionRef.Label,
                Data = data,
            });
        }

        return new ExtractionResponse
        {
            TemplateId = template.Id,
            TemplateName = template.Name,
            Sections = sections,
        };
    }

    private static object? ConvertJsonElement(JsonElement element, SectionTypeConfig? sectionType)
    {
        if (sectionType?.Display == "paragraph")
        {
            return element.ValueKind == JsonValueKind.String ? element.GetString() : null;
        }

        if (sectionType?.Display == "bullet-list")
        {
            if (element.ValueKind == JsonValueKind.Array)
            {
                return element.EnumerateArray()
                    .Where(e => e.ValueKind == JsonValueKind.String)
                    .Select(e => e.GetString())
                    .ToList();
            }
            return new List<string>();
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            return element.EnumerateArray()
                .Where(e => e.ValueKind == JsonValueKind.Object)
                .Select(e =>
                {
                    var dict = new Dictionary<string, string?>();
                    foreach (var prop in e.EnumerateObject())
                    {
                        dict[prop.Name] = prop.Value.ValueKind == JsonValueKind.Null
                            ? null
                            : prop.Value.ToString();
                    }
                    return dict;
                })
                .ToList();
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Confidence Post-Processing
    // -------------------------------------------------------------------------

    private static void PostProcessConfidence(ExtractionResponse response)
    {
        foreach (var section in response.Sections)
        {
            if (section.Data is not List<Dictionary<string, string?>> items) continue;
            if (items.Count == 0) continue;
            if (!items.Any(i => i.ContainsKey("confidence"))) continue;

            var confidenceValues = items
                .Where(i => i.ContainsKey("confidence") && i["confidence"] != null)
                .Select(i => i["confidence"])
                .Distinct()
                .ToList();

            if (confidenceValues.Count <= 1)
            {
                foreach (var item in items)
                {
                    var quote = item.GetValueOrDefault("source_quote") ?? "";
                    item["confidence"] = CalculateConfidenceFromLanguage(quote).ToString("F2");
                }
            }
            else
            {
                foreach (var item in items)
                {
                    if (item.ContainsKey("confidence"))
                    {
                        var raw = item["confidence"] ?? "0.75";
                        if (!double.TryParse(raw, out var val) || val < 0.1 || val > 1.0)
                        {
                            var quote = item.GetValueOrDefault("source_quote") ?? "";
                            item["confidence"] = CalculateConfidenceFromLanguage(quote).ToString("F2");
                        }
                    }
                }
            }
        }
    }

    private static double CalculateConfidenceFromLanguage(string sourceQuote)
    {
        var lower = sourceQuote.ToLowerInvariant();

        string[] urgentMarkers = ["please fix", "blocker", "must fix", "before launch",
            "non-negotiable", "critical", "urgent", "showstopper", "needs to be fixed"];
        if (urgentMarkers.Any(m => lower.Contains(m)))
            return 0.93 + (lower.Length % 5) * 0.01;

        string[] highMarkers = ["we need", "must have", "required", "is required", "will fix",
            "will handle", "i'll do", "i will", "please", "by wednesday", "by friday",
            "by monday", "before friday", "before release", "agreed"];
        if (highMarkers.Any(m => lower.Contains(m)))
            return 0.90 + (lower.Length % 5) * 0.01;

        string[] clearMarkers = ["should allow", "should support", "the system should",
            "should be able", "expect", "they also need", "we also need", "we also want"];
        if (clearMarkers.Any(m => lower.Contains(m)))
            return 0.82 + (lower.Length % 8) * 0.01;

        string[] modMarkers = ["should", "users expect", "need that", "need this"];
        if (modMarkers.Any(m => lower.Contains(m)))
            return 0.72 + (lower.Length % 10) * 0.01;

        string[] requestMarkers = ["want", "can we", "can you add", "what about",
            "would be nice", "improvement", "consider"];
        if (requestMarkers.Any(m => lower.Contains(m)))
            return 0.65 + (lower.Length % 9) * 0.01;

        string[] lowMarkers = ["maybe", "in future", "nice to have", "could",
            "might", "needs confirmation", "open question", "not sure",
            "we'll consider", "next year", "someday"];
        if (lowMarkers.Any(m => lower.Contains(m)))
            return 0.50 + (lower.Length % 12) * 0.01;

        return 0.75 + (lower.Length % 7) * 0.01;
    }

    private static void CorrectObviouslyWrongScores(ExtractionResponse response)
    {
        foreach (var section in response.Sections)
        {
            if (section.Data is not List<Dictionary<string, string?>> items) continue;

            foreach (var item in items)
            {
                if (!item.ContainsKey("confidence") || !item.ContainsKey("source_quote")) continue;

                var rawConfidence = item["confidence"];
                var sourceQuote = item["source_quote"] ?? "";

                if (string.IsNullOrWhiteSpace(rawConfidence) || string.IsNullOrWhiteSpace(sourceQuote)) continue;
                if (!double.TryParse(rawConfidence, out var aiScore)) continue;

                var languageScore = CalculateConfidenceFromLanguage(sourceQuote);
                var gap = Math.Abs(aiScore - languageScore);

                if (gap > 0.12)
                {
                    item["confidence"] = languageScore.ToString("F2");
                }
            }
        }
    }

    private static readonly string[] BlockedAssigneeRoles =
    [
        "developer", "tester", "qa", "designer", "product manager", "project manager",
        "team lead", "manager", "engineer", "architect", "devops", "frontend", "backend",
        "tech lead", "scrum master", "po", "ba", "the team", "someone", "they", "we",
        "development team", "testing team", "team", "client", "customer", "stakeholder",
        "admin", "administrator", "analyst", "lead", "senior developer", "junior developer"
    ];

    private static void StripRoleAssignees(ExtractionResponse response)
    {
        foreach (var section in response.Sections)
        {
            if (section.Data is not List<Dictionary<string, string?>> items) continue;

            foreach (var item in items)
            {
                if (!item.TryGetValue("assignee", out var assignee)) continue;
                if (string.IsNullOrWhiteSpace(assignee)) continue;

                var lower = assignee.Trim().ToLowerInvariant();
                if (BlockedAssigneeRoles.Any(role => lower == role || lower.Contains(role)))
                {
                    item["assignee"] = null;
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static ExtractionResponse BuildEmptyResponse(TemplateDefinition template)
    {
        return new ExtractionResponse
        {
            TemplateId = template.Id,
            TemplateName = template.Name,
            Sections = template.Sections.Select(s => new ExtractedSection
            {
                Key = s.Key,
                Type = s.Type,
                Label = s.Label,
                Data = null,
            }).ToList(),
        };
    }

    private void LogSummary(ExtractionResponse response)
    {
        var nonEmpty = response.Sections.Count(s => s.Data is not null);
        _logger.LogInformation(
            "Extraction complete (template: {Template}) — {Filled}/{Total} sections have data",
            response.TemplateId, nonEmpty, response.Sections.Count);
    }
}
