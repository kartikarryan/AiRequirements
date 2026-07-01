/**
 * =============================================================================
 * MeetScribe - Download Manager
 * =============================================================================
 *
 * Routes download/discard commands to the offscreen document.
 * The offscreen document retrieves the audio blob from IndexedDB and
 * triggers the actual file download via <a> tag click.
 *
 * Flow:
 *  1. User clicks "Download" in popup
 *  2. Popup sends DOWNLOAD_RECORDING to background
 *  3. Background calls downloadRecording() (this module)
 *  4. This sends OFFSCREEN_DOWNLOAD to offscreen with sessionId + filename
 *  5. Offscreen reads blob from IndexedDB → triggers browser download
 *  6. Offscreen removes blob from IndexedDB after download
 * =============================================================================
 */

import { RecordingSession, MessageType } from '@shared/types';
import { generateFileName } from '@shared/constants';

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Tells the offscreen document to download the audio for this session.
 * Offscreen will read from IndexedDB and trigger a file download.
 *
 * @param session - The recording session (provides ID and metadata for filename)
 */
export async function downloadRecording(session: RecordingSession): Promise<void> {
  const filename = generateFileName(
    session.meetingTag,
    session.startedAt ?? new Date().toISOString()
  );

  await chrome.runtime.sendMessage({
    type: MessageType.OFFSCREEN_DOWNLOAD,
    sessionId: session.id,
    filename,
  });
}

/**
 * Tells the offscreen document to discard the audio for this session.
 * Removes the blob from IndexedDB without downloading.
 *
 * @param sessionId - The session ID whose audio should be deleted
 */
export async function discardRecording(sessionId: string): Promise<void> {
  await chrome.runtime.sendMessage({
    type: MessageType.OFFSCREEN_DISCARD,
    sessionId,
  });
}
