using MeetScribe.Ai.Config;

namespace MeetScribe.Ai.Prompts;

/// <summary>
/// Builds AI prompts from template configuration.
/// Optimized for Claude models (Haiku/Sonnet) — concise, direct, example-driven.
///
/// Claude follows instructions precisely without needing excessive repetition.
/// Previous GPT-4o-mini version backed up at: PromptBuilder_GPT4oMini_Backup.cs
///
/// To modify prompt behavior: edit this file only.
/// </summary>
public interface IPromptBuilder
{
    string BuildSystemPrompt();
    string BuildUserPrompt(TemplateDefinition template, string transcript);
}

public sealed class PromptBuilder : IPromptBuilder
{
    private readonly ITemplateConfigLoader _configLoader;

    public PromptBuilder(ITemplateConfigLoader configLoader)
    {
        _configLoader = configLoader;
    }

    public string BuildSystemPrompt()
    {
        return """
You are an expert Business Analyst extracting structured information from meeting transcripts.

CORE RULES:
1. Read the ENTIRE transcript before extracting — context at the end clarifies earlier statements.
2. Transcript is from speech-to-text — expect filler words, incomplete sentences. Interpret INTENT.
3. EXTRACT items that are explicitly stated, committed to, or clearly agreed upon.
4. DO NOT INVENT information not present in the transcript.
5. When uncertain, include with lower confidence rather than omitting.

CLASSIFICATION:
- "action_items" = a SPECIFIC PERSON committed to DO something (name + verb + commitment).
- "next_steps" = future plans without a specific owner.
- "decisions" = explicit or implicit agreement reached.
- "questions" = raised but NOT answered.
- "risks" = potential future problems.
- "blockers" = currently preventing progress.
- "constraints" = fixed limitations (budget, deadlines, technology mandates).
- "feedback" = observations, suggestions, tentative language.

KEY RULES:
- NEVER invent priority. If no urgency words spoken → priority = null.
- NEVER invent assignee. Use ONLY a person's actual name spoken in the meeting (e.g., "Sarah", "Mike", "John").
  Set assignee = null if only a role/title is mentioned. BLOCKED values (always use null instead):
  Developer, Tester, QA, Designer, Product Manager, Project Manager, Team Lead, Manager,
  Engineer, Architect, DevOps, Frontend, Backend, Tech Lead, Scrum Master, PO, BA,
  "the team", "someone", "they", "we", "development team", "testing team".
- Preserve ALL numbers, amounts, dates exactly as spoken.
- Past tense + completion verbs = already done → do NOT extract as action item.
- If someone recaps at end of meeting → do NOT create duplicates.
- Only capture FINAL state when statements are contradicted or reversed later.
- NEVER extract passwords, API keys, or secrets.
- Mixed language transcripts: extract meaning, translate to English in output.

OUTPUT: Return ONLY valid JSON. No markdown code fences, no explanation.
""";
    }

    public string BuildUserPrompt(TemplateDefinition template, string transcript)
    {
        var sectionBlocks = new List<string>();
        var outputSchema = new List<string>();

        foreach (var section in template.Sections)
        {
            var sectionType = _configLoader.GetSectionType(section.Type);
            if (sectionType is null) continue;

            var block = $"■ \"{section.Key}\" — {sectionType.PromptInstruction}";
            if (sectionType.Examples is not null)
            {
                if (sectionType.Examples.Good.Count > 0)
                    block += $"\n  ✓ {sectionType.Examples.Good[0]}";
                if (sectionType.Examples.Bad.Count > 0)
                    block += $"\n  ✗ {sectionType.Examples.Bad[0]}";
            }
            sectionBlocks.Add(block);

            var schemaEntry = BuildSchemaEntry(sectionType);
            outputSchema.Add($"  \"{section.Key}\": {schemaEntry}");
        }

        var crossSectionRules = template.CrossSectionRules.Count > 0
            ? string.Join("\n", template.CrossSectionRules.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => $"• {r}"))
            : "";

        return $$"""
TRANSCRIPT:
---
{{transcript}}
---

TASK: Extract structured data into a "{{template.Name}}" document.

SECTIONS:
{{string.Join("\n\n", sectionBlocks)}}

{{crossSectionRules}}

OUTPUT FORMAT (return ONLY this JSON):
{
{{string.Join(",\n", outputSchema)}}
}

RULES:
- Empty arrays [] or empty strings "" when nothing fits a section.
- Use null for unknown fields (not "N/A" or "unknown").
- confidence: number 0.5-1.0. MUST vary per item based on speaker's certainty.
  Higher (0.90+): "we need", "must have", "agreed", confirmed by others.
  Lower (0.50-0.65): "maybe", "consider", "needs confirmation".
- source_quote: copy EXACT words from transcript. Do not paraphrase.
- Include root cause when developer explains technical reason for a bug.
- Capture ALL items including brief mentions ("also need X", "one more thing").
- Budget, timeline, and technology restrictions → always put in constraints.
""";
    }

    private static string BuildSchemaEntry(SectionTypeConfig sectionType)
    {
        if (sectionType.Display == "paragraph")
            return "\"string (2-3 concise sentences)\"";

        if (sectionType.Display == "bullet-list")
            return "[\"item1\", \"item2\", ...]";

        var fieldEntries = sectionType.Fields
            .Select(f => f switch
            {
                "confidence" => $"\"{f}\": 0.85",
                "source_quote" => $"\"{f}\": \"exact words from transcript\"",
                _ => $"\"{f}\": \"...\""
            })
            .ToList();

        return $"[{{ {string.Join(", ", fieldEntries)} }}]";
    }
}
