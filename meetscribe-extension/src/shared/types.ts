/**
 * =============================================================================
 * MeetScribe - Shared Type Definitions
 * =============================================================================
 *
 * Central type definitions used across all extension contexts (popup, background,
 * content script, offscreen). Keeping types in one place ensures consistency
 * and makes refactoring safer.
 *
 * Usage: Import from '@shared/types' in any module.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// Recording State
// -----------------------------------------------------------------------------

/**
 * Represents the current state of the audio recording session.
 * The extension transitions through these states in order:
 *
 *   IDLE → RECORDING → STOPPED → IDLE
 *         (user starts)  (user stops / downloads)
 */
export enum RecordingStatus {
  /** No active recording. Extension is ready to start. */
  IDLE = 'idle',

  /** Audio is being captured from the active tab. */
  RECORDING = 'recording',

  /** Recording has stopped. Audio is ready for download/upload. */
  STOPPED = 'stopped',
}

/**
 * Complete state of a recording session.
 * Stored in chrome.storage.local so it persists if popup closes.
 */
export interface RecordingSession {
  /** Unique session identifier (UUID) */
  id: string;

  /** Current recording status */
  status: RecordingStatus;

  /** ISO timestamp when recording started */
  startedAt: string | null;

  /** ISO timestamp when recording stopped */
  stoppedAt: string | null;

  /** Duration in seconds (updated during recording) */
  durationSeconds: number;

  /** User-selected meeting category */
  meetingTag: MeetingTag;

  /** ID of the tab being recorded */
  tabId: number | null;
}

// -----------------------------------------------------------------------------
// Meeting Tags
// -----------------------------------------------------------------------------

/**
 * Pre-defined meeting categories. Helps the AI extraction model
 * understand the context and extract relevant information.
 *
 * Example: A "standup" meeting extracts blockers/updates,
 * while "sprint_planning" extracts stories and estimates.
 */
export enum MeetingTag {
  STANDUP = 'standup',
  SPRINT_PLANNING = 'sprint_planning',
  CLIENT_CALL = 'client_call',
  ONE_ON_ONE = 'one_on_one',
  BRAINSTORM = 'brainstorm',
  GENERAL = 'general',
}

/** Human-readable labels for meeting tags (used in popup UI) */
export const MEETING_TAG_LABELS: Record<MeetingTag, string> = {
  [MeetingTag.STANDUP]: 'Standup',
  [MeetingTag.SPRINT_PLANNING]: 'Sprint Planning',
  [MeetingTag.CLIENT_CALL]: 'Client Call',
  [MeetingTag.ONE_ON_ONE]: '1:1 Meeting',
  [MeetingTag.BRAINSTORM]: 'Brainstorm',
  [MeetingTag.GENERAL]: 'General',
};

// -----------------------------------------------------------------------------
// Message Passing
// -----------------------------------------------------------------------------

/**
 * Messages sent between extension contexts using chrome.runtime.sendMessage().
 * Each message has a 'type' discriminator for type-safe handling.
 *
 * Flow: Popup → Background → Offscreen → Background → Popup
 */

/** All possible message types exchanged within the extension */
export enum MessageType {
  // Popup → Background
  START_RECORDING = 'START_RECORDING',
  STOP_RECORDING = 'STOP_RECORDING',
  GET_STATUS = 'GET_STATUS',
  DOWNLOAD_RECORDING = 'DOWNLOAD_RECORDING',
  DISCARD_RECORDING = 'DISCARD_RECORDING',

  // Background → Offscreen
  OFFSCREEN_START = 'OFFSCREEN_START',
  OFFSCREEN_STOP = 'OFFSCREEN_STOP',
  OFFSCREEN_DOWNLOAD = 'OFFSCREEN_DOWNLOAD',
  OFFSCREEN_DISCARD = 'OFFSCREEN_DISCARD',

  // Offscreen → Background
  RECORDING_COMPLETE = 'RECORDING_COMPLETE',
  RECORDING_ERROR = 'RECORDING_ERROR',

  // Background → Content Script
  SHOW_CONSENT_BANNER = 'SHOW_CONSENT_BANNER',
  HIDE_CONSENT_BANNER = 'HIDE_CONSENT_BANNER',

  // Background → Popup (status updates)
  STATUS_UPDATE = 'STATUS_UPDATE',
}

/** Base interface for all messages */
interface BaseMessage {
  type: MessageType;
}

/** Popup tells background to start recording the active tab */
export interface StartRecordingMessage extends BaseMessage {
  type: MessageType.START_RECORDING;
  meetingTag: MeetingTag;
}

/** Popup tells background to stop the active recording */
export interface StopRecordingMessage extends BaseMessage {
  type: MessageType.STOP_RECORDING;
}

/** Popup asks background for current recording state */
export interface GetStatusMessage extends BaseMessage {
  type: MessageType.GET_STATUS;
}

/** Popup tells background to download the recorded audio */
export interface DownloadRecordingMessage extends BaseMessage {
  type: MessageType.DOWNLOAD_RECORDING;
}

/** Popup tells background to discard the recorded audio */
export interface DiscardRecordingMessage extends BaseMessage {
  type: MessageType.DISCARD_RECORDING;
}

/** Background tells offscreen to start MediaRecorder */
export interface OffscreenStartMessage extends BaseMessage {
  type: MessageType.OFFSCREEN_START;
  streamId: string;
}

/** Background tells offscreen to stop MediaRecorder */
export interface OffscreenStopMessage extends BaseMessage {
  type: MessageType.OFFSCREEN_STOP;
}

/** Offscreen tells background that recording data is ready */
export interface RecordingCompleteMessage extends BaseMessage {
  type: MessageType.RECORDING_COMPLETE;
  audioDataUrl: string;
}

/** Offscreen tells background about a recording failure */
export interface RecordingErrorMessage extends BaseMessage {
  type: MessageType.RECORDING_ERROR;
  error: string;
}

/** Background tells content script to show consent banner */
export interface ShowConsentBannerMessage extends BaseMessage {
  type: MessageType.SHOW_CONSENT_BANNER;
}

/** Background tells content script to hide consent banner */
export interface HideConsentBannerMessage extends BaseMessage {
  type: MessageType.HIDE_CONSENT_BANNER;
}

/** Background sends status update to popup */
export interface StatusUpdateMessage extends BaseMessage {
  type: MessageType.STATUS_UPDATE;
  session: RecordingSession;
}

/** Union of all message types for type-safe message handling */
export type ExtensionMessage =
  | StartRecordingMessage
  | StopRecordingMessage
  | GetStatusMessage
  | DownloadRecordingMessage
  | DiscardRecordingMessage
  | OffscreenStartMessage
  | OffscreenStopMessage
  | RecordingCompleteMessage
  | RecordingErrorMessage
  | ShowConsentBannerMessage
  | HideConsentBannerMessage
  | StatusUpdateMessage;
