# MeetScribe — Demo Script & Talking Points

## Elevator Pitch (30 seconds)

"MeetScribe turns meeting recordings into structured, exportable requirements. Upload a sprint planning or design review, and AI extracts user stories, action items, and blockers — ready to push directly to Azure DevOps in one click. No more lost action items, no manual note-taking, no copy-paste into your backlog."

---

## Target Audience

| Role | What they care about |
|------|---------------------|
| Business Analysts | Faster requirement capture, less manual formatting |
| Scrum Masters | Action items from sprint planning directly in the backlog |
| Engineering Managers | Would they buy this for their team? ROI on BA time |
| Product Managers | Requirements don't get lost between meeting and backlog |

---

## Demo Preparation Checklist

- [ ] Pre-record a 5-10 minute meeting audio (sprint planning works best)
- [ ] Pre-upload and extract it so results are ready (don't wait for AI live)
- [ ] Verify Azure DevOps connection is active
- [ ] Have a test project in DevOps with a current sprint/iteration
- [ ] Clear browser cache / use incognito if showing fresh login flow
- [ ] Test the full flow once end-to-end before the demo

---

## Recommended Demo Audio

Best results come from meetings where participants clearly discuss:
- Feature requests ("We need a dashboard with date filters")
- Acceptance criteria ("It should support export to PDF and CSV")
- Assignments ("John handles the API, Sarah takes the frontend")
- Blockers ("We're waiting on the security review before proceeding")
- Decisions ("We agreed to use PostgreSQL instead of MongoDB")

**Length:** 5-15 minutes. Shorter is better for demo — shows fast turnaround.

---

## Demo Script (10 minutes)

### 1. THE PROBLEM (1 minute)

"Every sprint planning, design review, and stakeholder meeting produces requirements. But where do they end up?"

- In someone's personal notes
- Lost in a Slack thread
- Never make it to the backlog
- Manually typed into Jira/DevOps hours later — incomplete

"MeetScribe solves this. Meeting audio in, structured requirements out, pushed to your backlog in one click."

---

### 2. SIGN IN (30 seconds)

- Show the landing page — professional, clear value proposition
- Click "Continue with Google"
- "Secure login via Google. No passwords to manage. Each user sees only their own data."

---

### 3. SHOW ONBOARDING (30 seconds)

- "First-time users see a guided 3-step setup"
- Step 1: Create a project (organize by team, sprint, or initiative)
- Step 2: Upload a meeting recording
- Step 3: Review and export

---

### 4. THE EXTRACTION (3 minutes) — KEY MOMENT

Open the pre-loaded completed meeting. Walk through:

**What the AI did automatically:**
- "I uploaded a 15-minute sprint planning recording"
- "The AI transcribed the full conversation"
- "Then it extracted structured requirements using our Agile template"

**Show the output:**
- User stories with acceptance criteria
- Action items with assignees
- Blockers and risks identified
- Decisions captured

**Highlight the template system:**
- "We have multiple extraction templates — Meeting Minutes, Agile Requirements, Product Discovery, Technical Review"
- "Same meeting audio, different structured output depending on your workflow"
- "A BA uses the Agile template, a PM uses Product Discovery — each gets what they need"

**Show inline editing:**
- "The BA can review every extracted item"
- "Edit titles, add missing acceptance criteria, fix assignees"
- "Nothing goes to the backlog without human review — AI accelerates, humans validate"

---

### 5. EXPORT TO AZURE DEVOPS (2 minutes)

- Click "Export to DevOps" button
- "Pick your project, pick your sprint"
- "Each requirement becomes a proper Work Item — title, description, acceptance criteria, all formatted correctly"
- Show items being created with success indicators
- "Duplicate detection — if you accidentally try to export the same item twice, it warns you"

**After export:**
- "Open Azure DevOps — the items are there, properly formatted, ready for your team"

---

### 6. WHAT MAKES THIS DIFFERENT (1 minute)

"Three things no other tool does together:"

| Capability | Competitors | MeetScribe |
|-----------|-------------|------------|
| Transcription | Otter.ai, Fireflies | Just text — no structure |
| AI notes | Notion AI, Copilot | Generic summaries — not exportable requirements |
| Backlog management | Jira, DevOps | Manual entry — no audio intelligence |

"MeetScribe bridges the gap: Audio to structured requirements to your backlog. One pipeline."

---

### 7. SECURITY & CONTROL (30 seconds)

- "Google SSO — enterprise-grade authentication via AWS Cognito"
- "Per-user data isolation — your meetings are only visible to you"
- "Upload quotas — controlled access during the beta phase"
- "Delete Account option — users own their data"

---

### 8. THE ASK (1 minute)

"I'm giving this to 10-15 people for 2 weeks. I want you to:"

1. Upload 3-5 real meetings (sprint planning, design reviews, stakeholder calls)
2. Review the extracted output — is it accurate? What's missing?
3. Try the export flow — does it save you time?

"After 2 weeks, one question: Would you pay $20/month for this?"

---

## Key Talking Points

### Value Proposition
- Saves 30+ minutes per meeting of BA/PM manual work
- Requirements captured while they're fresh — not hours later from memory
- Standardized format across teams (template-driven)
- Direct integration eliminates the "meeting notes to backlog" gap

### Template System (Differentiator)
- Meeting Minutes: Agenda, decisions, action items, follow-ups
- Agile Requirements: User stories, acceptance criteria, story points
- Product Discovery: Problems, opportunities, hypotheses, experiments
- Technical Review: Architecture decisions, tech debt, risks, dependencies

### Why Now?
- AI transcription quality crossed the threshold in 2025
- Remote/hybrid meetings generate more audio than ever
- Teams lose 40% of action items between meeting and backlog (industry stat)

---

## Questions They'll Ask

| Question | Your Answer |
|----------|-------------|
| "How accurate is the extraction?" | "85-90% on clear audio with distinct speakers. The BA reviews and edits before export — it's an accelerator, not a replacement for human judgment." |
| "What audio formats?" | "MP3, WAV, WebM. Up to 200MB per file — roughly 2 hours of audio." |
| "What about accents/multiple speakers?" | "Works well with clear English. Speaker diarization is automatic. Heavy accents or crosstalk reduce accuracy." |
| "How long does processing take?" | "2-5 minutes for a 15-minute recording. Longer meetings take proportionally longer." |
| "What about sensitive/confidential meetings?" | "Audio is processed and not retained permanently. Per-user isolation — nobody else can see your data. Delete Account removes everything." |
| "What languages?" | "English for now. Multi-language support is on the roadmap." |
| "Can my team share projects?" | "Coming in V2. Currently per-user — each person manages their own meetings." |
| "What's the pricing?" | "Free during the feedback phase. Pricing will be based on monthly upload volume — likely $15-25/month for individual, team plans TBD." |
| "Jira support?" | "Coming soon. Azure DevOps is fully supported today. Jira is next based on demand." |
| "Can I customize the templates?" | "On the roadmap. Today we have 4 built-in templates that cover 90% of use cases." |
| "What if the AI gets something wrong?" | "Every item is editable before export. Nothing goes to your backlog without your review and approval." |
| "How is this different from Otter.ai?" | "Otter transcribes. We extract. You get a transcript from Otter — you get ready-to-export user stories from MeetScribe." |

---

## Phrases to Use / Avoid

| Avoid | Use Instead |
|-------|-------------|
| "AI transcription tool" | "Meeting-to-requirements platform" |
| "It generates notes" | "It extracts structured, exportable requirements" |
| "Better than manual notes" | "Eliminates the meeting-to-backlog gap" |
| "It uses Claude/GPT" | "AI-powered extraction engine" |
| "Replaces the BA" | "Accelerates the BA's workflow by 10x" |
| "Fully automatic" | "AI-assisted with human review and approval" |

---

## Follow-Up After Demo

Send within 24 hours:
1. Link to the app
2. Their login credentials (Google email — just whitelist in Cognito)
3. A short note: "Upload 3 meetings this week, tell me what's missing"

After 1 week, check in:
- "Have you tried it? Any issues?"
- "What type of meetings did you upload?"

After 2 weeks, close:
- "Would you pay $20/month for this?"
- "What's the #1 thing that would make you say yes?"

---

## Technical Specs (if asked)

| Component | Technology |
|-----------|-----------|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | .NET 8 Web API + PostgreSQL |
| AI Extraction | Claude Haiku (Anthropic) |
| Speech-to-Text | Deepgram |
| Authentication | AWS Cognito + Google OAuth |
| Export | Azure DevOps REST API |
| Hosting | TBD (AWS/Vercel) |

---

## Success Metrics for Feedback Phase

| Metric | Target |
|--------|--------|
| Users who upload at least 1 meeting | 80% (8 of 10) |
| Users who upload 3+ meetings | 50% (5 of 10) |
| Users who try export | 40% (4 of 10) |
| "Would pay $20/month" | 3+ users (product-market signal) |
| Average accuracy rating | 7+ out of 10 |
