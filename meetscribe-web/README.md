# MeetScribe Web — Meeting Audio to Action Items

> Upload meeting audio (.webm) → AI extracts action items → Human validates → Export to Jira/Azure DevOps

## Overview

This is the web application component of MeetScribe. Users upload meeting recordings captured by the [MeetScribe browser extension](../meetscribe-extension/), and the system automatically extracts action items for validation and export.

## Current State (MVP)

Single-page application with:
- Upload button for .webm audio files
- Meetings table showing all uploads with status (processing/completed/error)
- Expandable work items panel for completed meetings
- Approve/Reject/Edit actions on each work item
- Mock data layer (no backend required to run)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| State | React useState (simple, no external library) |
| API Layer | Service module with mock data (swap for .NET later) |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
meetscribe-web/
├── src/
│   ├── components/              # React components
│   │   ├── MeetingsTable.tsx    # Table of all uploaded meetings
│   │   ├── WorkItemsPanel.tsx   # Expandable work items with actions
│   │   └── UploadModal.tsx      # Upload dialog with drag & drop
│   ├── services/
│   │   └── meetingService.ts    # API layer (mock now, .NET later)
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces and enums
│   ├── data/
│   │   └── mockData.ts          # Sample data for development
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind imports + base styles
├── DESIGN.md                    # Full UI/UX design document
├── README.md                    # This file
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

## Data Flow

```
App (state owner)
  ├── MeetingsTable (displays meetings, handles row clicks)
  ├── WorkItemsPanel (displays items for selected meeting, handles approve/reject/edit)
  └── UploadModal (handles file upload)

All data changes go through services/meetingService.ts
  └── Currently: in-memory mock data with simulated delays
  └── Future: HTTP calls to .NET backend API
```

## Connecting to .NET Backend (Future)

When your .NET backend is ready, update `src/services/meetingService.ts`:

1. Replace mock implementations with `fetch()` calls
2. Point to your API URL (e.g., `https://api.meetscribe.com`)
3. The component code stays the same — only the service layer changes

Example:
```typescript
// Before (mock):
export async function getAllMeetings(): Promise<Meeting[]> {
  await delay(300);
  return [...meetings];
}

// After (real API):
export async function getAllMeetings(): Promise<Meeting[]> {
  const response = await fetch('/api/meetings');
  return response.json();
}
```

## API Endpoints (for .NET backend)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/meetings/upload | Upload audio file |
| GET | /api/meetings | List all meetings |
| GET | /api/meetings/:id | Get meeting detail |
| DELETE | /api/meetings/:id | Delete meeting |
| POST | /api/meetings/:id/extract | Trigger re-extraction |
| PUT | /api/work-items/:id | Update work item |
| PATCH | /api/work-items/:id/approve | Approve item |
| PATCH | /api/work-items/:id/reject | Reject item |
| POST | /api/work-items/export | Export to Jira/DevOps |

## Future Enhancements

- [ ] Re-extract with guided AI focus
- [ ] Export to Jira / Azure DevOps
- [ ] Edit work item modal with full fields
- [ ] User authentication (AWS Cognito)
- [ ] Real-time processing status via WebSocket
- [ ] AI-generated acceptance criteria
- [ ] Meeting history sidebar
