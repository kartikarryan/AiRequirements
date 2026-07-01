# MeetScribe — Product Document

## What is MeetScribe?

MeetScribe is an AI-powered platform that turns your meeting recordings into two things:

1. **Structured meeting documents** — summaries, decisions, discussions, and minutes you can share with your team immediately
2. **Ready-to-export work items** — action items, user stories, and bugs that go directly into Azure DevOps as tickets

One recording. Two outputs. Minutes for the team, tickets for the board — all with source traceability back to the exact words spoken.

---

## Two Use Cases, One Tool

### Use Case 1: Meeting Minutes and Documentation

After every meeting, someone needs to write up what was discussed, what was decided, and who needs to do what. MeetScribe generates this automatically:

- Decisions made during the meeting
- Key discussions and topics covered
- Questions raised and answers given
- Risks identified
- Attendees and their roles

You can copy or download the full document and share it with your team — complete meeting minutes without manual effort.

### Use Case 2: Ticket Creation

Action items, requirements, and bugs discussed in the meeting need to end up on your board. MeetScribe extracts these as structured items with titles, descriptions, acceptance criteria, and priorities — then exports them directly to Azure DevOps.

No copy-pasting between a Word document and your ticket system. One click from meeting to board.

### Both at the Same Time

Most meetings need both. Sprint planning produces minutes (what was discussed) AND tickets (what to build). MeetScribe handles both from a single recording:

| What MeetScribe Extracts | Meeting Minutes | Exportable Tickets |
|--------------------------|:---:|:---:|
| Decisions Made | ✅ Included in document | — |
| Key Discussions | ✅ Included in document | — |
| Questions and Answers | ✅ Included in document | — |
| Action Items | ✅ Included in document | ✅ Export as Task |
| User Stories / Requirements | ✅ Included in document | ✅ Export as User Story |
| Bugs Reported | ✅ Included in document | ✅ Export as Bug |
| Risks Identified | ✅ Included in document | ✅ Export as Task |
| Change Requests | ✅ Included in document | ✅ Export as User Story |

---

## The Problem We Solve

Every meeting produces action items, requirements, decisions, and bugs. But after the meeting:

- Notes are incomplete (you were talking, not writing)
- Meeting minutes take 20-30 minutes to write up properly
- Creating tickets takes another 30-60 minutes per meeting
- Requirements get lost between meeting and backlog
- Weeks later, someone asks "who said this?" — no proof
- Same information typed into meeting notes, then again into tickets

**Result:** 1-2 hours wasted after every meeting. Things fall through cracks. No evidence trail.

---

## How MeetScribe Works

### Step 1: Record Your Meeting

Use the MeetScribe browser extension to record any meeting — whether it's a video call, screen share, or in-person discussion captured via laptop.

- One-click start/stop recording
- Works with any meeting platform (Teams, Zoom, Google Meet, WebEx)
- Audio stored securely until uploaded

### Step 2: Upload and Extract

Upload the recording to MeetScribe. Choose a meeting template that matches your meeting type:

| Template | Best For | What It Extracts |
|----------|----------|-----------------|
| Sprint Planning | Agile planning sessions | User stories, action items, decisions, blockers |
| Bug Triage | Bug review meetings | Bugs reported, priority assignments, owners |
| Stakeholder Review | Client/stakeholder meetings | Requirements, change requests, risks, Q&A |
| General Meeting | Any meeting | Action items, decisions, key discussions |

The AI listens to the full recording and extracts structured information — not just a summary, but actual items with titles, descriptions, owners, priorities, and acceptance criteria.

### Step 3: Review with Confidence

MeetScribe shows you everything it extracted in a clean document view:

- **Confidence scores** — Each item shows how confident the AI is (green = high, yellow = medium, red = review needed)
- **Source quotes** — Click to see the exact words from the transcript that this item came from
- **Organized by section** — Action items separate from requirements separate from decisions

You review, verify, and make edits if needed — all in one place.

### Step 4: Export to Your Board

When you're satisfied, click "Export to Azure DevOps" and your items become real tickets:

- Select your project and sprint
- Each ticket is fully editable before creation (title, description, acceptance criteria, type, priority)
- Choose which items to export (check/uncheck)
- Tickets are created directly in your Azure DevOps board
- See confirmation with ticket ID and link for each one

---

## Key Features

### Template-Based Extraction

Different meetings produce different outputs. A sprint planning session shouldn't be processed the same way as a bug triage. MeetScribe uses templates to extract the right information for each meeting type.

You select the template before upload. The AI knows what to look for.

### Confidence Scoring

Not everything the AI extracts is equally reliable. MeetScribe tells you:

- **High confidence (green):** Clear, explicit statement in the meeting. Trust it.
- **Medium confidence (yellow):** Implied or partially stated. Worth reviewing.
- **Low confidence (red):** Uncertain extraction. Verify before using.

This means you spend review time where it matters — not checking everything equally.

### Source Quote Traceability

Every extracted item links back to the exact words from the transcript. When someone asks "where did this requirement come from?" — you click the source and show them proof.

This eliminates:
- "I never said that" disputes
- Misattributed requirements
- Requirements without context

### Editable Export

The export modal isn't just a dump to your board. Before creating tickets, you can:

- Edit titles and descriptions
- Add or modify acceptance criteria
- Change work item type (Task, User Story, Bug, Feature)
- Set priority
- Assign to a team member
- Select which items to include or exclude

What you see in the modal is exactly what gets created in DevOps.

### Duplicate Prevention

MeetScribe checks for duplicates before creating tickets:

- Already exported this item from this meeting? It warns you.
- Similar ticket title exists in your DevOps project? It warns you.

You decide whether to proceed — the system never silently creates duplicates.

### Export History

When you re-open the export modal for a meeting, you see:

- Which items were already exported (with ticket ID and link)
- Which project and sprint they went to
- Which items still need to be exported

No guessing about what's been done.

### Project Organization

Organize your meetings into projects:

- Group related meetings together
- Filter and search across all meetings
- Track how many tickets came from each project

### Full-Text Search

Search across all your meetings by keyword. "Find every meeting where we discussed payment API" — returns matching meetings instantly.

---

## Integration: Azure DevOps

MeetScribe connects directly to your Azure DevOps organization:

**Setup (one time):**
1. Go to Settings
2. Enter your Azure DevOps organization URL
3. Paste your Personal Access Token (PAT)
4. Test connection — done

**What it creates:**
- Work items with title, description, acceptance criteria
- Correct work item type (Task, User Story, Bug)
- Priority level
- Assigned to team member
- Sprint/iteration assignment
- Tagged with "MeetScribe" for tracking

**What you see after export:**
- Ticket ID and number
- Direct link to open in DevOps
- Which project and sprint it landed in
- Success or failure status for each item

---

## Who Is This For?

### Business Analysts

You attend 3-5 meetings per week. After each one, you spend 30-60 minutes creating tickets. MeetScribe gives you that time back. You review what the AI extracted (5 minutes), refine if needed, and export. Done.

### Product Managers

Requirements come from stakeholder meetings, client calls, sprint reviews. They get lost in notes, emails, and memory. MeetScribe captures everything with source evidence — your backlog stays complete and traceable.

### Scrum Masters

Sprint planning produces a list of work items that need to end up on the board. Instead of typing each one manually during or after the meeting, export them directly with correct types, priorities, and acceptance criteria.

### Team Leads

When a developer asks "why are we building this?" — the ticket has a source quote linking to the exact conversation. Decisions are documented automatically. No more "I think someone mentioned this in a meeting last month."

### Meeting Organizers

You run weekly syncs, client calls, or project updates. After each meeting, you need to send minutes to everyone. MeetScribe generates structured meeting minutes automatically — decisions, discussions, Q&A, action items — ready to copy and share.

### Project Coordinators

You need a single place that captures what happened in a meeting AND turns the action items into trackable work. MeetScribe gives you the document (for the team) and the tickets (for the board) from the same recording.

---

## What MeetScribe is NOT

- **Not a live transcription tool** — You upload recordings after the meeting
- **Not a meeting scheduler** — It processes recordings, doesn't manage calendars
- **Not just a note-taking app** — It produces structured documents AND exportable work items
- **Not a replacement for human review** — AI extracts, you verify and approve

---

## Security and Privacy

- Meeting audio is processed and can be deleted after extraction
- Azure DevOps credentials are stored securely
- PAT expiry notifications remind you to refresh credentials
- No meeting data is shared with third parties
- Source quotes stay within your MeetScribe instance

---

## Typical Workflow

### Workflow A: Meeting Minutes + Tickets (Sprint Planning)

```
Monday 10:00 AM — Sprint Planning Meeting (1 hour)
    ↓
Monday 10:02 AM — Stop recording, upload to MeetScribe
    ↓
Monday 10:04 AM — AI extraction complete
    ↓
Monday 10:05 AM — Review document: decisions, discussions, user stories, action items
    ↓
Monday 10:06 AM — Copy meeting minutes → paste in email/Slack → send to team
    ↓
Monday 10:08 AM — Fix one title, add acceptance criteria to another
    ↓
Monday 10:09 AM — Export → 12 tickets created in Sprint 14
    ↓
Monday 10:10 AM — Done. Minutes shared. Board populated.

Total time spent: 8 minutes (vs. 1-2 hours manually)
```

### Workflow B: Meeting Minutes Only (Client Update Call)

```
Wednesday 3:00 PM — Client status update call (30 minutes)
    ↓
Wednesday 3:02 PM — Upload recording, select "General Meeting" template
    ↓
Wednesday 3:04 PM — AI extracts: decisions, action items, discussions, Q&A
    ↓
Wednesday 3:05 PM — Review minutes, verify key decisions captured
    ↓
Wednesday 3:06 PM — Download document → attach to project folder / email to client
    ↓
Done. Client has meeting record. No tickets needed.

Total time spent: 4 minutes (vs. 20-30 minutes writing minutes manually)
```

### Workflow C: Tickets Only (Bug Triage)

```
Thursday 11:00 AM — Bug triage meeting (45 minutes)
    ↓
Thursday 11:02 AM — Upload, select "Bug Triage" template
    ↓
Thursday 11:04 AM — AI extracts: 8 bugs with severity, steps to reproduce
    ↓
Thursday 11:06 AM — Review, adjust priorities
    ↓
Thursday 11:07 AM — Export → 8 bug tickets created with steps to reproduce
    ↓
Done. All bugs on the board with proper details.

Total time spent: 5 minutes (vs. 40 minutes manually)
```

---

## Time Savings

| Meeting Frequency | Manual Time | With MeetScribe | Weekly Savings |
|-------------------|-------------|-----------------|----------------|
| 3 meetings/week | 4.5 hours | 30 minutes | 4 hours |
| 5 meetings/week | 7.5 hours | 50 minutes | 6.5 hours |
| 10 meetings/week | 15 hours | 100 minutes | 13.3 hours |

---

## Getting Started

1. **Install the browser extension** — enables meeting recording
2. **Connect Azure DevOps** — Settings page, paste your PAT
3. **Create a project** — organize your meetings
4. **Record a meeting** — one click start/stop
5. **Upload and select template** — choose meeting type
6. **Review extraction** — verify with confidence scores
7. **Export to DevOps** — edit and create tickets

First meeting to first tickets: under 15 minutes.

---

## FAQ

**Q: How accurate is the AI extraction?**
A: 90-95% accuracy. Confidence scores tell you which items to verify. Source quotes let you check against the original words.

**Q: What if the AI gets something wrong?**
A: Edit it. Every field is editable before export. The AI gives you a starting point — you have full control over what gets created.

**Q: Does it work with Jira?**
A: Currently Azure DevOps. Jira support is planned for a future release.

**Q: Can multiple people use it?**
A: Currently single-user. Team features with shared projects and approval workflows are coming soon.

**Q: What audio quality is needed?**
A: Standard meeting audio quality works. Clear speech produces better results. Very noisy environments may reduce accuracy.

**Q: How long can meetings be?**
A: Up to 3 hours per recording. Longer meetings extract more items but take proportionally longer to process.

**Q: Is my data secure?**
A: Recordings are processed on secure servers. No data is shared externally. You can delete recordings after extraction.

---

## Summary

MeetScribe eliminates the gap between "what was discussed" and "what ends up on the board." It gives BAs, PMs, and team leads a reliable, evidence-backed path from meeting to tickets — saving hours every week and ensuring nothing gets lost.

**One sentence:** Record your meeting, let AI extract the work items, review with confidence, export to DevOps — done in minutes, not hours.
