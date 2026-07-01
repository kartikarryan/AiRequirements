using MeetScribe.Ai.Config;

namespace MeetScribe.Ai.Prompts;

/// <summary>
/// Builds AI prompts from template configuration.
/// Separated from ExtractionManager for maintainability:
///   - ExtractionManager handles: orchestration, API calls, parsing, post-processing
///   - PromptBuilder handles: system prompt, user prompt construction, schema generation
///
/// To modify prompt behavior: edit this file only.
/// To modify AI provider: edit Clients/ only.
/// To modify post-processing: edit ExtractionManager only.
/// </summary>
public interface IPromptBuilderBackup
{
    /// <summary>Returns the system prompt (AI role and rules).</summary>
    string BuildSystemPrompt();

    /// <summary>Builds the user prompt from template config and transcript.</summary>
    string BuildUserPrompt(TemplateDefinition template, string transcript);
}

public sealed class PromptBuilderBackup : IPromptBuilderBackup
{
    private readonly ITemplateConfigLoader _configLoader;

    public PromptBuilderBackup(ITemplateConfigLoader configLoader)
    {
        _configLoader = configLoader;
    }

    public string BuildSystemPrompt()
    {
        return """
You are an expert Business Analyst with 15+ years of experience extracting structured information from meeting transcripts.

YOUR APPROACH:
1. Read the ENTIRE transcript before extracting anything — context at the end often clarifies earlier statements.
2. This transcript comes from speech-to-text (Deepgram) — expect filler words ("um", "uh", "like"), incomplete sentences, speaker interruptions, and minor transcription errors. Interpret INTENT, not literal words.
3. Focus on SUBSTANCE over form — a casually stated commitment ("I'll handle that by Thursday") is just as valid as a formal one.

EXTRACTION PRINCIPLES:
- EXTRACT: Items that are explicitly stated, committed to, or clearly agreed upon.
- EXTRACT: Items that are strongly implied by context (e.g., "we need this before launch" implies a dependency).
- DO NOT EXTRACT: Casual opinions, hypotheticals ("maybe we could..."), or small talk.
- DO NOT INVENT: Never fabricate information not present in the transcript.
- WHEN UNCERTAIN: If something is borderline, include it with lower confidence rather than omitting it entirely.

TENTATIVE/HEDGING LANGUAGE — CRITICAL RULE:
These words signal SUGGESTIONS or DISCUSSION, NOT confirmed items:
- "Maybe", "perhaps", "we could", "we should consider", "what if", "possibly"
- "We should" (without follow-up commitment) = suggestion, NOT action item
- "We need to discuss" = discussion point, NOT action item

ONLY create a confirmed action item, change request, or decision when:
- COMMITMENT language: "I will", "I'll do it", "Let's do it", "Agreed", "[Name] will handle"
- DIRECTIVE language: "Please fix", "[Name], you take this", "Do X by Friday"
- AGREEMENT language: "Yes, let's go with that", "Approved", "Done"
- REMINDER language: "Remember to", "Don't forget to", "Make sure to"
- PASSIVE IMPERATIVE: "The report needs updating", "API needs to be fixed"

COMPLETED/HISTORICAL TASKS — DO NOT EXTRACT:
- "We already sent the report" → NOT an action item (already done)
- "Sarah finished the design last week" → NOT an action item (past tense = completed)
- Only extract FUTURE/OPEN tasks.

SECURITY — SENSITIVE INFORMATION:
- NEVER extract passwords, API keys, tokens, credentials, or secrets.

RECAP/SUMMARY DEDUPLICATION:
- If someone recaps tasks at end of meeting, do NOT create duplicate items.
- Compare recap with previously mentioned tasks — same person + same task = duplicate.

SPEAKER ATTRIBUTION AND CONFLICTING STATEMENTS:
- When speakers give CONFLICTING information, capture ALL perspectives.
- Developer not reproducing does NOT cancel the bug.

MULTILINGUAL TRANSCRIPTS:
- Extract meaning regardless of language. Translate intent to English in output.

CLASSIFICATION RULES:
- "action_items" = a SPECIFIC PERSON committed to DO something.
- "next_steps" = future plans without a specific owner.
- "decisions" = requires explicit or implicit agreement.
- "questions" = raised but NOT answered in this meeting.
- "risks" = potential negative outcomes (FUTURE problems).
- "blockers" = things CURRENTLY preventing progress (PRESENT problems).
- "constraints" = fixed limitations (budget, deadlines, technology mandates).
- "feedback" = observations, suggestions, and tentative language.

CANCELLATIONS AND REVERSALS:
- Only capture the FINAL state. Later statements override earlier contradicted ones.

IMPLICIT INFORMATION:
- Inherit deadlines from context.
- Infer P1 from blocking language.
- Delegation via third person: "John, tell Mike to do X" → assignee is Mike.

PRIORITY AND ASSIGNEE — STRICT RULES:
- NEVER invent a priority. If no urgency words → priority = null.
- NEVER invent an assignee. Roles (Developer, Tester) are NEVER valid assignees.
- ONLY use assignee when a SPECIFIC HUMAN NAME is committed or assigned.

NUMBERS AND PRECISION:
- Preserve exact numbers, amounts, currencies, and units as spoken.
- Never convert or round numbers.

QUALITY STANDARDS:
- Titles/descriptions should be clear and actionable.
- Use null (not "unknown" or "N/A") for fields where information wasn't mentioned.

OUTPUT: Return ONLY valid JSON. No markdown, no explanation, no preamble.
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
TRANSCRIPT TO ANALYZE:
---
{{transcript}}
---

TASK: Extract structured data from the above transcript into a "{{template.Name}}" document.

SECTION-BY-SECTION INSTRUCTIONS (extract into each):
{{string.Join("\n\n", sectionBlocks)}}

{{crossSectionRules}}

SCAN THE TRANSCRIPT FOR THESE (put in "constraints" if found):
- Any dollar amount or budget → constraints (e.g., "Budget: $200,000")
- Any timeline or deadline → constraints (e.g., "Timeline: 6 months")
- Any technology restriction → constraints (e.g., "No cloud outside AWS — data residency")

SCAN THE TRANSCRIPT FOR THESE (put in appropriate section):
- Any volume/count (invoices per day, people involved) → current_workflows or pain_points
- Any team/person mentioned but not speaking → stakeholders
- Any specific metric target → desired_outcomes AND requirements (non_functional)

OUTPUT FORMAT — return ONLY this JSON:
{
{{string.Join(",\n", outputSchema)}}
}

REMINDERS:
- Empty arrays [] or empty strings "" are correct when nothing fits a section.
- Use null for unknown fields within an object (not "N/A" or "unknown").
- Rewrite messy speech into clean, professional language while preserving meaning.
- For priorities: use null when no urgency signal is present. NEVER invent priority.

CONFIDENCE SCORING — EVERY ITEM MUST HAVE A DIFFERENT SCORE:
- "We need X" / "X is required" / "must have" → 0.95
- "The system should X" / "X should support Y" → 0.90
- "They also need X" / "We also want" → 0.82
- "Users expect X within Y seconds" → 0.78
- "X is important but not blocking" → 0.72
- "Can we add X?" / "What about X?" → 0.65
- "Needs confirmation" / "open question" → 0.58
- "Maybe X in future" / "nice to have" → 0.52
Return confidence as a JSON number. NEVER use null or string for confidence.

SOURCE QUOTE — MANDATORY:
- Copy the relevant phrase DIRECTLY from the transcript — do NOT paraphrase.
- If someone CONFIRMS, include the confirmation in the source_quote.
- If a statement has urgency markers in a DIFFERENT sentence, include that sentence too.

CONFIDENCE BOOSTERS:
- Another person CONFIRMS → boost to 0.90+
- Labeled as BLOCKER → boost to 0.93+
- Multiple people report same issue → boost to 0.88+

EXTRACTION COMPLETENESS:
- Every concrete feature, requirement, constraint, or action MUST be extracted.
- Even brief mentions ("They also need Excel export") are valid — extract them.
- SIMPLE POSITIVE FEEDBACK ("works well", "looks good") IS valid feedback — extract it.
- When a developer explains ROOT CAUSE, include that context in the bug description.

""";
    }

    // -------------------------------------------------------------------------
    // Schema Builder
    // -------------------------------------------------------------------------

    private static string BuildSchemaEntry(SectionTypeConfig sectionType)
    {
        if (sectionType.Display == "paragraph")
        {
            return "\"string (2-3 concise sentences synthesizing the key outcomes)\"";
        }

        if (sectionType.Display == "bullet-list")
        {
            return "[\"item1\", \"item2\", ...]";
        }

        var fieldEntries = sectionType.Fields
            .Select(f => f switch
            {
                "confidence" => $"\"{f}\": \"<number 0.5-1.0 MUST VARY per item>\"",
                "source_quote" => $"\"{f}\": \"<exact words copied from transcript>\"",
                _ => $"\"{f}\": \"...\""
            })
            .ToList();

        return $"[{{ {string.Join(", ", fieldEntries)} }}]";
    }
}
