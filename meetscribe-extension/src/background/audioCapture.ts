/**
 * =============================================================================
 * MeetScribe - Audio Capture Module
 * =============================================================================
 *
 * Handles the tab audio capture flow using chrome.tabCapture API.
 * This module manages the offscreen document lifecycle, which is required
 * in Manifest V3 because service workers don't have DOM/MediaRecorder access.
 *
 * Capture Flow:
 *  1. Get a media stream ID from chrome.tabCapture
 *  2. Create an offscreen document (if not already active)
 *  3. Pass the stream ID to offscreen document via message
 *  4. Offscreen document starts MediaRecorder with the stream
 *
 * Why Offscreen?
 *  - MV3 service workers have no DOM → no MediaRecorder, no Audio, no Canvas
 *  - Offscreen documents are hidden pages with full DOM access
 *  - Chrome requires a declared reason ("USER_MEDIA") to create one
 * =============================================================================
 */

import { MessageType } from '@shared/types';
import { OFFSCREEN_DOCUMENT_PATH } from '@shared/constants';

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Starts capturing audio from the specified browser tab.
 *
 * This initiates the full capture pipeline:
 *  tabCapture → stream ID → offscreen document → MediaRecorder
 *
 * @param tabId - The ID of the tab to capture audio from
 * @throws Error if tab capture fails or offscreen document can't be created
 */
export async function startAudioCapture(tabId: number, sessionId: string): Promise<void> {
  // Step 1: Get a media stream ID from the tab
  const streamId = await getTabMediaStreamId(tabId);

  // Step 2: Ensure offscreen document exists and is ready
  await ensureOffscreenDocument();

  // Step 3: Tell offscreen document to start recording with this stream
  // Retry a few times in case the offscreen script hasn't loaded yet
  await sendMessageToOffscreen({
    type: MessageType.OFFSCREEN_START,
    streamId,
    sessionId,
  });
}

/**
 * Stops the active audio capture.
 * Tells the offscreen document to stop its MediaRecorder.
 * Waits for offscreen to fully save audio before returning.
 */
export async function stopAudioCapture(): Promise<void> {
  await sendMessageToOffscreen({
    type: MessageType.OFFSCREEN_STOP,
  });
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

/**
 * Sends a message to the offscreen document with retry logic.
 * The offscreen document script may not be loaded immediately after
 * createDocument() resolves, so we retry a few times with a short delay.
 *
 * @param message - The message to send
 * @param maxRetries - Number of retries before giving up
 */
async function sendMessageToOffscreen(message: object, maxRetries = 5): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage(message);
      if (response?.success) {
        return;
      }
      if (response?.error) {
        throw new Error(response.error);
      }
    } catch (error: any) {
      // "Receiving end does not exist" means offscreen script hasn't loaded yet
      if (attempt < maxRetries - 1 && error?.message?.includes('Receiving end')) {
        await sleep(200);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to communicate with offscreen document after retries');
}

/**
 * Simple sleep utility for retry delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Obtains a media stream ID for the given tab using chrome.tabCapture.
 * The stream ID is a token that can be passed to getUserMedia() in
 * the offscreen document to access the tab's audio.
 *
 * @param tabId - The tab to capture audio from
 * @returns A stream ID string that can be used with getUserMedia()
 */
async function getTabMediaStreamId(tabId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId(
      { targetTabId: tabId },
      (streamId: string) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!streamId) {
          reject(new Error('Failed to get media stream ID from tab'));
          return;
        }

        resolve(streamId);
      }
    );
  });
}

/**
 * Creates the offscreen document if it doesn't already exist.
 * Chrome only allows one offscreen document per extension at a time.
 *
 * The offscreen document is a hidden page that provides DOM context
 * for APIs not available in service workers (like MediaRecorder).
 */
async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
  });

  // Don't create if already exists
  if (existingContexts.length > 0) {
    return;
  }

  // Create the offscreen document with USER_MEDIA reason
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: 'Recording tab audio using MediaRecorder API',
  });
}
