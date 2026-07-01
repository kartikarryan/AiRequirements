/**
 * =============================================================================
 * MeetScribe - Offscreen Document (Audio Recorder)
 * =============================================================================
 *
 * This script runs inside a hidden offscreen HTML page. It exists because
 * Manifest V3 service workers don't have access to DOM APIs like MediaRecorder.
 *
 * Responsibilities:
 *  - Receives a stream ID from the background service worker
 *  - Creates a MediaStream using navigator.mediaDevices.getUserMedia()
 *  - Records audio using the MediaRecorder API
 *  - Saves audio blob to IndexedDB (persistent, crash-safe)
 *  - Downloads the file via <a> tag click when requested
 *
 * Storage Strategy:
 *  - Audio blob is saved to IndexedDB immediately when recording stops
 *  - Survives browser crashes, offscreen document being killed, restarts
 *  - Blob stored as raw binary — no base64 conversion, no size bloat
 *  - Cleaned up after download or discard
 * =============================================================================
 */

import { MessageType } from '@shared/types';
import { AUDIO_MIME_TYPE, AUDIO_CHUNK_INTERVAL_MS } from '@shared/constants';
import { audioStorage } from '@shared/audioStorage';

// -----------------------------------------------------------------------------
// Module State
// -----------------------------------------------------------------------------

/** The active MediaRecorder instance (null when not recording) */
let mediaRecorder: MediaRecorder | null = null;

/** Collected audio data chunks during recording */
let audioChunks: Blob[] = [];

/** Audio playback element (so user can still hear meeting while recording) */
let audioPlayback: HTMLAudioElement | null = null;

/** Current session ID for storing/retrieving the recording */
let currentSessionId: string | null = null;

// -----------------------------------------------------------------------------
// Message Listener
// -----------------------------------------------------------------------------

/**
 * Listens for commands from the background service worker.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MessageType.OFFSCREEN_START) {
    currentSessionId = message.sessionId;
    handleStartRecording(message.streamId)
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => {
        console.error('[MeetScribe:Offscreen] Start error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === MessageType.OFFSCREEN_STOP) {
    handleStopRecording()
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => {
        console.error('[MeetScribe:Offscreen] Stop error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === MessageType.OFFSCREEN_DOWNLOAD) {
    handleDownload(message.sessionId, message.filename)
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => {
        console.error('[MeetScribe:Offscreen] Download error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === MessageType.OFFSCREEN_DISCARD) {
    handleDiscard(message.sessionId)
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => {
        console.error('[MeetScribe:Offscreen] Discard error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  return false;
});

// -----------------------------------------------------------------------------
// Recording Handlers
// -----------------------------------------------------------------------------

/**
 * Starts recording audio from the given stream ID.
 *
 * @param streamId - The chrome.tabCapture stream ID from the background
 */
async function handleStartRecording(streamId: string): Promise<void> {
  // Reset any previous state
  audioChunks = [];

  // Get the actual audio stream from the stream ID
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    } as any,
    video: false,
  });

  // Play the audio back so the user can still hear the meeting.
  // tabCapture mutes the tab — without this, audio goes silent during recording.
  audioPlayback = new Audio();
  audioPlayback.srcObject = mediaStream;
  audioPlayback.play();

  // Create MediaRecorder with our preferred codec
  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType: AUDIO_MIME_TYPE,
  });

  // Collect audio data chunks as they become available
  mediaRecorder.ondataavailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  // Handle unexpected errors during recording
  mediaRecorder.onerror = (event: Event) => {
    const error = (event as any).error?.message ?? 'Unknown recording error';
    console.error('[MeetScribe:Offscreen] MediaRecorder error:', error);
    chrome.runtime.sendMessage({ type: MessageType.RECORDING_ERROR, error });
  };

  // Start recording with periodic data emission
  mediaRecorder.start(AUDIO_CHUNK_INTERVAL_MS);
  console.log('[MeetScribe:Offscreen] Recording started');
}

/**
 * Stops the active MediaRecorder, assembles the audio blob,
 * and saves it to IndexedDB for persistence.
 *
 * The audio is safe in IndexedDB even if:
 *  - Chrome kills this offscreen document
 *  - Browser crashes after this completes
 *  - User closes and reopens the browser
 */
async function handleStopRecording(): Promise<void> {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') {
    return;
  }

  const stream = mediaRecorder.stream;

  // Wait for MediaRecorder to finish
  const audioBlob = await new Promise<Blob>((resolve) => {
    if (!mediaRecorder) { resolve(new Blob()); return; }

    mediaRecorder.onstop = () => {
      // Stop all media tracks
      stream.getTracks().forEach((track) => track.stop());

      // Stop audio playback
      if (audioPlayback) {
        audioPlayback.pause();
        audioPlayback.srcObject = null;
        audioPlayback = null;
      }

      // Assemble final audio blob
      const blob = new Blob(audioChunks, { type: AUDIO_MIME_TYPE });
      audioChunks = [];
      resolve(blob);
    };

    mediaRecorder.stop();
  });

  mediaRecorder = null;

  // Save to IndexedDB — persistent, crash-safe storage
  if (currentSessionId && audioBlob.size > 0) {
    await audioStorage.save(currentSessionId, audioBlob);
    console.log(
      `[MeetScribe:Offscreen] Audio saved to IndexedDB: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`
    );
  }
}

/**
 * Downloads the audio from IndexedDB as a file.
 * Uses <a> tag click — available because offscreen has DOM access.
 *
 * @param sessionId - The session ID to retrieve from IndexedDB
 * @param filename - The filename for the downloaded file
 */
async function handleDownload(sessionId: string, filename: string): Promise<void> {
  const blob = await audioStorage.get(sessionId);

  if (!blob) {
    throw new Error('No audio found in storage for this session');
  }

  // Create a temporary download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Remove from IndexedDB after successful download
  await audioStorage.remove(sessionId);

  console.log('[MeetScribe:Offscreen] Download triggered:', filename);
}

/**
 * Discards the audio recording without saving.
 *
 * @param sessionId - The session ID to remove from IndexedDB
 */
async function handleDiscard(sessionId: string): Promise<void> {
  await audioStorage.remove(sessionId);
  console.log('[MeetScribe:Offscreen] Audio discarded:', sessionId);
}
