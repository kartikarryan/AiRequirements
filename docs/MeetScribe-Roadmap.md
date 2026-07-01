# MeetScribe — Product Roadmap

## Currently Shipped (MVP)

| Feature | Description |
|---------|-------------|
| Meeting recording | Chrome extension captures audio from any browser-based meeting |
| Audio upload and transcription | Upload recording, AI transcribes to text |
| Template-based AI extraction | Different meeting types produce different structured outputs |
| Confidence scoring | Each extracted item shows reliability level (high/medium/low) |
| Source quote traceability | Every item links to exact words from the transcript |
| Document view with editing | Review extracted data, edit inline, see confidence and source |
| Azure DevOps integration | Connect with PAT, test connection, manage settings |
| Export to DevOps | Editable ticket cards, project/sprint picker, direct work item creation |
| Per-ticket export status | See which tickets created successfully, which failed, with links |
| Duplicate detection | Warns before creating tickets that already exist |
| Export history | Re-open modal shows what was already exported with ticket IDs |
| Pre-fill project/sprint | Remembers last export destination for same meeting |
| Project management | Organize meetings into projects |
| Full-text search | Search across all meetings by keyword |
| PAT expiry notifications | Reminds you before credentials expire |

---

## Phase 1 — Production Ready

**Goal:** Ship to beta users with secure multi-user access.

| Feature | Description |
|---------|-------------|
| User authentication | Login and registration so each person has their own account |
| Data isolation | Each user sees only their own meetings and projects |
| Jira integration | Export tickets to Jira in addition to Azure DevOps |
| Provider selection per project | When multiple providers connected, choose which one each project exports to |
| Cloud deployment | Host on Azure or AWS so users can access from anywhere |
| Credential encryption | Store PATs and API tokens securely in the database |
| HTTPS | Secure connection for all data in transit |

---

## Phase 2 — Team Collaboration

**Goal:** Enable teams to work together on meeting outputs.

| Feature | Description |
|---------|-------------|
| Approval workflow | Send extracted tickets to a tech lead or PM for review before creating in DevOps |
| Shared projects | Multiple team members can see and work on the same project |
| Batch operations | Select multiple tickets and change type, priority, or assignee all at once |
| Export dashboard | See all tickets created across meetings — which sprint, which project, who created |
| Template auto-suggest | Based on meeting name or calendar invite, suggest the right template automatically |
| Ticket relationships | Set dependencies between tickets during export ("this story depends on that task") |

---

## Phase 3 — Native Integrations

**Goal:** Remove the need for the browser extension by connecting directly to meeting platforms.

| Feature | Description |
|---------|-------------|
| Microsoft Teams integration | Pull meeting recordings directly from Teams — no manual upload needed |
| Zoom integration | Same as Teams — access Zoom cloud recordings automatically |
| Meeting summary email | After extraction, auto-send a summary to all attendees |
| Slack notifications | Post to a channel when tickets are created from a meeting |
| Custom field mapping | Map extracted data to your organization's custom fields in DevOps or Jira (Epic Link, Story Points, etc.) |
| Linear integration | Support Linear as a third ticket provider |

---

## Phase 4 — Advanced Intelligence

**Goal:** Make the AI smarter and provide deeper insights across meetings.

| Feature | Description |
|---------|-------------|
| Real-time transcription | See text appearing live during the meeting, not just after upload |
| Cross-meeting comparison | Track how requirements evolved across multiple meetings on the same topic |
| Analytics dashboard | How many meetings processed, tickets created per sprint, extraction accuracy trends |
| Confidence explanations | Instead of just a percentage, explain why confidence is low (hedging language, partial information, unclear speaker) |
| Speaker identification | Identify who said what — attribute requirements and action items to specific people |
| Multi-language support | Process meetings in Hindi, Spanish, French, German and other languages |

---

## Phase 5 — Enterprise

**Goal:** Meet enterprise security, compliance, and scale requirements.

| Feature | Description |
|---------|-------------|
| Single Sign-On (SSO) | Login with Azure AD, Okta, or other enterprise identity providers |
| Audit logs | Full trail of who extracted what, who exported where, and when |
| Role-based access control | Admin, Business Analyst, and Viewer roles with different permissions |
| On-premise deployment | Host MeetScribe within company infrastructure for data residency compliance |
| Custom templates | Organizations create their own meeting templates without code changes |
| Public API | Allow third-party tools to trigger extractions, pull data, and automate workflows |

---

## Timeline (Estimated)

| Phase | Target |
|-------|--------|
| MVP | Shipped |
| Phase 1 — Production Ready | 4-6 weeks |
| Phase 2 — Team Collaboration | 2-3 months |
| Phase 3 — Native Integrations | 3-5 months |
| Phase 4 — Advanced Intelligence | 5-8 months |
| Phase 5 — Enterprise | 8-12 months |

---

## How Priorities Are Decided

Features are prioritized based on:

1. **User demand** — What clients and beta users ask for most
2. **Revenue impact** — What unlocks the next pricing tier or market segment
3. **Technical dependency** — What must be built before other features can work
4. **Competitive pressure** — What competitors offer that we must match

This roadmap is a living document. Priorities shift based on user feedback and market conditions.
