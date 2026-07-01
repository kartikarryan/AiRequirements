/**
 * =============================================================================
 * MeetScribe - Background Service Worker (Entry Point)
 * =============================================================================
 *
 * This is the main background script for the extension. In Manifest V3,
 * it runs as a service worker (not a persistent page). It:
 *
 *  1. Listens for messages from the popup UI
 *  2. Manages the recording lifecycle (start → record → stop → download)
 *  3. Coordinates between popup, offscreen document, and content script
 *  4. Persists state to chrome.storage so it survives popup close/reopen
 *
 * Important MV3 Constraints:
 *  - Service worker can be terminated by Chrome when idle
 *  - No DOM access (use offscreen document for MediaRecorder)
 *  - Must re-initialize state from storage on wake-up
 *
 * Message Flow:
 *  Popup → Background → Offscreen (start/stop recording)
 *  Offscreen → Background (audio data ready)
 *  Background → Content Script (show/hide consent banner)
 *  Background → Popup (status updates)
 * =============================================================================
 */

import { RecordingSession, RecordingStatus, MessageType, MeetingTag } from '@shared/types';
import type { ExtensionMessage } from '@shared/types';
import { STORAGE_KEYS } from '@shared/constants';
import { storage } from '@shared/storage';
import { generateSessionId, getCurrentTimestamp } from '@shared/utils';
import { startAudioCapture, stopAudioCapture } from './audioCapture';
import { downloadRecording, discardRecording } from './downloadManager';

// -----------------------------------------------------------------------------
// Message Listener
// -----------------------------------------------------------------------------

/**
 * Central message handler for all inter-context communication.
 * Routes incoming messages to the appropriate handler based on message type.
 *
 * Note: sendResponse must be called synchronously OR return true to indicate
 * async response. We use async/await pattern with return true.
 */
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('[MeetScribe] Message handler error:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we will respond asynchronously
    return true;
  }
);

/**
 * Routes a message to the correct handler based on its type.
 *
 * @param message - The incoming message from another extension context
 * @returns Response object sent back to the message sender
 */
async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case MessageType.START_RECORDING:
      return handleStartRecording(message.meetingTag);

    case MessageType.STOP_RECORDING:
      return handleStopRecording();

    case MessageType.GET_STATUS:
      return handleGetStatus();

    case MessageType.DOWNLOAD_RECORDING:
      return handleDownloadRecording();

    case MessageType.DISCARD_RECORDING:
      return handleDiscardRecording();

    case MessageType.RECORDING_COMPLETE:
      return handleRecordingComplete();

    case MessageType.RECORDING_ERROR:
      return handleRecordingError(message.error);

    default:
      console.warn('[MeetScribe] Unknown message type:', message);
      return { success: false, error: 'Unknown message type' };
  }
}

// -----------------------------------------------------------------------------
// Recording Lifecycle Handlers
// -----------------------------------------------------------------------------

/**
 * Starts a new recording session.
 * Called when user clicks "Start Recording" in the popup.
 *
 * Steps:
 *  1. Create a new session object
 *  2. Save session to storage (persists across popup close)
 *  3. Start audio capture via offscreen document
 *  4. Show consent banner on the active tab
 *
 * @param meetingTag - User-selected meeting category
 */
async function handleStartRecording(meetingTag: MeetingTag) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab?.id) {
    return { success: false, error: 'No active tab found' };
  }

  // Create a fresh recording session
  const session: RecordingSession = {
    id: generateSessionId(),
    status: RecordingStatus.RECORDING,
    startedAt: getCurrentTimestamp(),
    stoppedAt: null,
    durationSeconds: 0,
    meetingTag,
    tabId: activeTab.id,
  };

  // Persist session state
  await storage.set(STORAGE_KEYS.CURRENT_SESSION, session);

  // Start capturing audio from the tab (pass sessionId for IndexedDB key)
  await startAudioCapture(activeTab.id, session.id);

  // Show consent banner on the meeting tab (non-blocking — tab may not have content script)
  chrome.tabs.sendMessage(activeTab.id, { type: MessageType.SHOW_CONSENT_BANNER }).catch(() => {});

  console.log('[MeetScribe] Recording started:', session.id);
  return { success: true, session };
}

/**
 * Stops the active recording session.
 * Called when user clicks "Stop" in the popup.
 *
 * Steps:
 *  1. Stop audio capture (offscreen document will send audio data back)
 *  2. Update session status to STOPPED
 *  3. Hide consent banner from the page
 */
async function handleStopRecording() {
  const session = await storage.get<RecordingSession>(STORAGE_KEYS.CURRENT_SESSION);

  if (!session || session.status !== RecordingStatus.RECORDING) {
    return { success: false, error: 'No active recording to stop' };
  }

  // Stop the audio capture
  await stopAudioCapture();

  // Update session state
  session.status = RecordingStatus.STOPPED;
  session.stoppedAt = getCurrentTimestamp();
  await storage.set(STORAGE_KEYS.CURRENT_SESSION, session);

  // Hide consent banner (non-blocking — tab may not have content script)
  if (session.tabId) {
    chrome.tabs.sendMessage(session.tabId, { type: MessageType.HIDE_CONSENT_BANNER }).catch(() => {});
  }

  console.log('[MeetScribe] Recording stopped:', session.id);
  return { success: true, session };
}

/**
 * Returns the current recording session state.
 * Called when popup opens and needs to display current state.
 */
async function handleGetStatus() {
  const session = await storage.get<RecordingSession>(STORAGE_KEYS.CURRENT_SESSION);
  return { success: true, session };
}

/**
 * Downloads the recorded audio file to the user's machine.
 * Called when user clicks "Download" after stopping the recording.
 */
async function handleDownloadRecording() {
  const session = await storage.get<RecordingSession>(STORAGE_KEYS.CURRENT_SESSION);

  if (!session || session.status !== RecordingStatus.STOPPED) {
    return { success: false, error: 'No recording available to download' };
  }

  await downloadRecording(session);

  // Reset session after download
  await storage.remove(STORAGE_KEYS.CURRENT_SESSION);

  console.log('[MeetScribe] Recording downloaded:', session.id);
  return { success: true };
}

/**
 * Discards the recorded audio without saving.
 * Called when user clicks "Discard" after stopping the recording.
 */
async function handleDiscardRecording() {
  const session = await storage.get<RecordingSession>(STORAGE_KEYS.CURRENT_SESSION);

  if (session) {
    await discardRecording(session.id);
  }

  await storage.remove(STORAGE_KEYS.CURRENT_SESSION);

  console.log('[MeetScribe] Recording discarded');
  return { success: true };
}

// -----------------------------------------------------------------------------
// Offscreen Document Callbacks
// -----------------------------------------------------------------------------

/**
 * Handles audio data received from the offscreen document.
 * Called when the offscreen document finishes encoding the recording.
 *
 * @param audioDataUrl - Base64-encoded audio data as a data URL
 */
async function handleRecordingComplete() {
  // Audio blob is kept in memory by the offscreen document.
  // Download/discard commands are routed to offscreen when user decides.
  console.log('[MeetScribe] Recording complete, audio ready in offscreen');
  return { success: true };
}

/**
 * Handles recording errors from the offscreen document.
 *
 * @param error - Error message describing what went wrong
 */
async function handleRecordingError(error: string) {
  console.error('[MeetScribe] Recording error:', error);

  // Update session to reflect the error
  const session = await storage.get<RecordingSession>(STORAGE_KEYS.CURRENT_SESSION);
  if (session) {
    session.status = RecordingStatus.IDLE;
    await storage.set(STORAGE_KEYS.CURRENT_SESSION, session);
  }

  return { success: false, error };
}
