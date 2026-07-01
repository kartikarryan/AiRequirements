# MeetScribe - Meeting Audio Capture Extension

> A Chrome/Edge browser extension that captures meeting audio for AI-powered requirement extraction and task generation.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [User Flow](#user-flow)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Future Roadmap](#future-roadmap)
- [Troubleshooting](#troubleshooting)

---

## Overview

MeetScribe is a browser extension that captures audio from meeting tabs (Google Meet, Microsoft Teams, Zoom Web, etc.) and saves the recording locally as a `.webm` file.

**Current Version (POC):** Records audio → Downloads `.webm` file locally.

**Future Vision:** Records audio → Uploads to cloud → Transcribes via Whisper → AI extracts requirements, topics, and action items → Human validates → Pushes tickets to Jira/Azure DevOps.

### What Problem Does This Solve?

Meetings generate requirements, decisions, and action items that often get lost or poorly documented. MeetScribe automates the capture-to-ticket pipeline:

1. **No manual note-taking** — focus on the meeting, not your notepad
2. **Complete capture** — AI processes the full conversation, not just what someone remembers to write down
3. **Consistent extraction** — every requirement gets the same treatment
4. **Audit trail** — recorded evidence for every ticket created

---

## Architecture

The extension follows Chrome Manifest V3 architecture with four isolated contexts:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER EXTENSION                            │
│                                                                     │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐   │
│  │   Popup UI   │    │   Background    │    │ Content Script   │   │
│  │   (React)    │◄──►│ Service Worker  │◄──►│ (Meeting Tab)    │   │
│  │              │    │                 │    │                  │   │
│  │ • Start/Stop │    │ • State mgmt   │    │ • Consent banner │   │
│  │ • Timer      │    │ • Tab capture   │    │ • Recording dot  │   │
│  │ • Download   │    │ • Download mgmt │    │                  │   │
│  └──────────────┘    └────────┬────────┘    └──────────────────┘   │
│                               │                                     │
│                               ▼                                     │
│                    ┌─────────────────────┐                          │
│                    │ Offscreen Document  │                          │
│                    │                     │                          │
│                    │ • MediaRecorder     │                          │
│                    │ • Audio chunking    │                          │
│                    │ • Blob assembly     │                          │
│                    └─────────────────────┘                          │
│                                                                     │
│  Communication: chrome.runtime.sendMessage() (JSON-serializable)    │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Four Contexts?

| Context | Why It Exists |
|---------|--------------|
| **Popup** | User interface — opens when clicking the extension icon |
| **Background (Service Worker)** | Orchestrates everything, persists state, manages lifecycle |
| **Content Script** | Injects UI into the meeting page (consent banner) |
| **Offscreen Document** | MV3 service workers can't use MediaRecorder — this hidden page can |

---

## Project Structure

```
meetscribe-extension/
│
├── public/                          # Static assets (copied to dist as-is)
│   ├── manifest.json                # Chrome extension configuration
│   ├── popup.html                   # HTML shell for React popup
│   ├── offscreen.html               # Hidden page for audio recording
│   └── icons/                       # Extension icons (16/32/48/128px)
│
├── src/
│   ├── shared/                      # Code shared across all contexts
│   │   ├── types.ts                 # TypeScript interfaces and enums
│   │   ├── constants.ts             # Configuration values
│   │   ├── storage.ts               # chrome.storage.local wrapper
│   │   └── utils.ts                 # Pure utility functions
│   │
│   ├── popup/                       # Extension popup (React app)
│   │   ├── index.tsx                # React entry point
│   │   ├── App.tsx                  # Root component with page routing
│   │   ├── pages/
│   │   │   ├── RecordPage.tsx       # Tag selection + start recording
│   │   │   ├── RecordingPage.tsx    # Live timer + stop button
│   │   │   └── CompletePage.tsx     # Download or discard recording
│   │   └── styles/
│   │       └── popup.css            # All popup styles
│   │
│   ├── background/                  # Service Worker (extension brain)
│   │   ├── index.ts                 # Message router + lifecycle handlers
│   │   ├── audioCapture.ts          # Tab capture + offscreen management
│   │   └── downloadManager.ts       # File download logic
│   │
│   ├── content/                     # Injected into meeting pages
│   │   ├── index.ts                 # Message listener
│   │   └── consentBanner.ts         # Shadow DOM consent notification
│   │
│   └── offscreen/                   # Hidden audio recording page
│       └── offscreen.ts             # MediaRecorder implementation
│
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── webpack.config.js                # Build configuration
└── README.md                        # This file
```

---

## User Flow

### Recording a Meeting

```
1. User opens a meeting in browser (Teams, Meet, Zoom, etc.)
2. User clicks the MeetScribe extension icon
3. User selects the meeting type (Standup, Planning, Client Call, etc.)
4. User clicks "Start Recording"
5. A red banner appears on the page: "MeetScribe is recording this meeting"
6. The popup shows a live timer
7. User clicks "Stop Recording" when meeting ends
8. User sees recording summary (duration, type)
9. User clicks "Download Recording" → .webm file saved to Downloads
```

### State Machine

```
              start                 stop                 download/discard
  ┌──────┐ ────────► ┌───────────┐ ─────► ┌─────────┐ ──────────────► ┌──────┐
  │ IDLE │           │ RECORDING │        │ STOPPED │                 │ IDLE │
  └──────┘ ◄──────── └───────────┘        └─────────┘ ◄────────────── └──────┘
              error                                       reset
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Popup UI | React 18 + TypeScript | Component-based UI |
| Background | TypeScript | State management, orchestration |
| Content Script | TypeScript + Shadow DOM | Page-injected consent banner |
| Offscreen | TypeScript + MediaRecorder API | Audio capture and encoding |
| Build | Webpack 5 | Bundling, TypeScript compilation |
| Audio Format | WebM (Opus codec) | Good compression, browser-native |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Chrome or Edge browser
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd meetscribe-extension

# Install dependencies
npm install

# Build the extension
npm run build
```

### Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from this project
5. The MeetScribe icon appears in your toolbar

### Loading in Edge

1. Open Edge and navigate to `edge://extensions/`
2. Enable **Developer Mode** (toggle in left sidebar)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from this project

---

## Development

### Available Scripts

```bash
# Development build with file watching (auto-rebuilds on change)
npm run dev

# Production build (optimized, minified)
npm run build

# Type checking without compilation
npm run type-check

# Linting
npm run lint

# Clean dist folder
npm run clean
```

### Development Workflow

1. Run `npm run dev` (watches for file changes)
2. Load the `dist/` folder in Chrome as an unpacked extension
3. Make code changes → Webpack auto-rebuilds
4. Click the refresh icon on `chrome://extensions/` to reload
5. Test the extension on a meeting tab

### Hot Reload Tip

After code changes:
- **Popup changes**: Close and reopen the popup
- **Background changes**: Click refresh on the extensions page
- **Content script changes**: Refresh the meeting tab

---

## How It Works

### Audio Capture Pipeline

```
1. chrome.tabCapture.getMediaStreamId(tabId)
   → Gets a token representing the tab's audio stream

2. chrome.offscreen.createDocument()
   → Creates a hidden page with DOM access

3. navigator.mediaDevices.getUserMedia({ chromeMediaSource: 'tab' })
   → Converts the token into an actual MediaStream (in offscreen doc)

4. new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
   → Records the stream into chunks every 1 second

5. recorder.stop() → assembles chunks into a Blob

6. Blob → base64 data URL → sent via chrome.runtime.sendMessage()

7. Background creates an object URL → chrome.downloads.download()
```

### Why base64 Data URLs?

Chrome's message passing (`chrome.runtime.sendMessage`) only supports JSON-serializable data. Blobs and ArrayBuffers aren't JSON-serializable, so we encode audio as a base64 data URL string for transit between contexts.

### Consent Banner (Shadow DOM)

The consent banner uses Shadow DOM to prevent:
- Host page CSS from breaking our banner styles
- Our banner CSS from interfering with the meeting page
- Z-index wars with the host page (we use max z-index: 2147483647)

---

## Configuration

### Audio Settings (src/shared/constants.ts)

| Setting | Default | Description |
|---------|---------|-------------|
| `AUDIO_MIME_TYPE` | `audio/webm;codecs=opus` | Recording codec |
| `AUDIO_CHUNK_INTERVAL_MS` | `1000` | How often data chunks are emitted |
| `MAX_RECORDING_DURATION_SECONDS` | `14400` (4hrs) | Safety limit |
| `AUDIO_FILE_EXTENSION` | `webm` | Output file format |

### Meeting Tags

Meeting tags are defined in `src/shared/types.ts`. To add a new tag:

1. Add the value to the `MeetingTag` enum
2. Add the label to `MEETING_TAG_LABELS`

---

## Future Roadmap

### Phase 1 (Current) - POC
- [x] Tab audio capture
- [x] Start/stop recording UI
- [x] Consent banner
- [x] Local download as .webm

### Phase 2 - Cloud Upload
- [ ] User authentication (AWS Cognito)
- [ ] Direct upload to S3 via pre-signed URLs
- [ ] Upload progress indicator
- [ ] Recording history in popup

### Phase 3 - Web Application
- [ ] Dashboard showing all recordings
- [ ] Whisper transcription (OpenAI API or self-hosted)
- [ ] AI extraction of requirements, topics, updates (Claude/GPT)
- [ ] Human validation UI
- [ ] Jira/Azure DevOps ticket creation

### Phase 4 - Team Features
- [ ] Organization/team management
- [ ] Shared meeting library
- [ ] Role-based access control
- [ ] Meeting analytics dashboard

---

## Troubleshooting

### Extension doesn't appear in toolbar
- Make sure Developer Mode is enabled
- Check for errors on `chrome://extensions/`
- Try removing and re-loading the unpacked extension

### "No active tab found" error
- Make sure you're on the meeting tab when clicking Start
- The extension needs an active browser tab with audio

### Recording is silent / no audio
- Make sure the meeting has started and people are talking
- Check that the tab is not muted (look for speaker icon on tab)
- Some pages block tab capture — try the meeting in a fresh tab

### Large file sizes
- 1 hour of recording ≈ 15-20 MB (WebM/Opus)
- This is normal — Opus is already well-compressed
- The web application will handle large files via chunked upload

### Consent banner doesn't appear
- Refresh the meeting tab and try again
- Check the browser console for content script errors
- Some pages with strict CSP may block content scripts

---

## License

[MIT](LICENSE)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request
