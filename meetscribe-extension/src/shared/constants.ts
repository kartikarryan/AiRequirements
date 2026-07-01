/**
 * =============================================================================
 * MeetScribe - Application Constants
 * =============================================================================
 *
 * Centralized configuration values used across the extension.
 * Keeping all magic numbers and strings here makes the codebase
 * easier to configure and prevents scattered hardcoded values.
 *
 * For environment-specific values (API URLs, keys), these will move
 * to a .env file when we add backend integration in a future version.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// Audio Recording Configuration
// -----------------------------------------------------------------------------

/** Audio format for MediaRecorder output */
export const AUDIO_MIME_TYPE = 'audio/webm;codecs=opus';

/**
 * How often MediaRecorder emits data chunks (in milliseconds).
 * Smaller value = more frequent saves = less data loss if browser crashes.
 * 1000ms is a good balance between safety and performance.
 */
export const AUDIO_CHUNK_INTERVAL_MS = 1000;

/**
 * Maximum recording duration in seconds (safety limit).
 * 4 hours should cover any meeting. Prevents accidental infinite recordings.
 */
export const MAX_RECORDING_DURATION_SECONDS = 4 * 60 * 60;

/**
 * Audio file extension used when saving recordings.
 * WebM with Opus codec provides good compression and quality.
 */
export const AUDIO_FILE_EXTENSION = 'webm';

// -----------------------------------------------------------------------------
// Chrome Storage Keys
// -----------------------------------------------------------------------------

/**
 * Keys used with chrome.storage.local to persist extension state.
 * Using constants prevents typos and makes refactoring straightforward.
 */
export const STORAGE_KEYS = {
  /** Current recording session data */
  CURRENT_SESSION: 'meetscribe_current_session',

  /** User preferences (meeting tag defaults, etc.) */
  USER_PREFERENCES: 'meetscribe_user_preferences',

  /** Authentication token (for future backend integration) */
  AUTH_TOKEN: 'meetscribe_auth_token',
} as const;

// -----------------------------------------------------------------------------
// Offscreen Document
// -----------------------------------------------------------------------------

/** Path to the offscreen HTML document (relative to extension root) */
export const OFFSCREEN_DOCUMENT_PATH = 'offscreen/offscreen.html';

/** Reason provided to Chrome for creating the offscreen document */
export const OFFSCREEN_REASON = 'USER_MEDIA' as chrome.offscreen.Reason;

// -----------------------------------------------------------------------------
// UI Configuration
// -----------------------------------------------------------------------------

/** Width of the extension popup window in pixels */
export const POPUP_WIDTH_PX = 360;

/** Height of the extension popup window in pixels */
export const POPUP_HEIGHT_PX = 480;

/** Timer update interval in the popup UI (in milliseconds) */
export const TIMER_UPDATE_INTERVAL_MS = 1000;

// -----------------------------------------------------------------------------
// File Naming
// -----------------------------------------------------------------------------

/**
 * Generates a filename for the downloaded recording.
 * Format: meetscribe_2024-01-15_14-30-00_standup.webm
 *
 * @param meetingTag - The category of the meeting
 * @param startedAt - ISO timestamp when recording started
 * @returns Formatted filename string
 */
export function generateFileName(meetingTag: string, startedAt: string): string {
  const date = new Date(startedAt);
  const dateStr = date.toISOString().slice(0, 10);
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '-');

  return `meetscribe_${dateStr}_${timeStr}_${meetingTag}.${AUDIO_FILE_EXTENSION}`;
}
