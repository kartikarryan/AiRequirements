/**
 * =============================================================================
 * MeetScribe - Complete Page
 * =============================================================================
 *
 * Shown after a recording has been stopped.
 * Gives the user the choice to download or discard the recording.
 *
 * Use Case:
 *  - Recording just finished
 *  - User sees session details (duration, meeting type)
 *  - User clicks "Download" → .webm file saves to Downloads folder
 *  - User clicks "Discard" → audio is deleted from memory
 *  - After either action, popup resets to the RecordPage
 *
 * Future Enhancement:
 *  - "Upload to MeetScribe" button (sends to backend for transcription)
 *  - Preview/playback before deciding
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  RecordingSession,
  MessageType,
  MEETING_TAG_LABELS,
} from '@shared/types';
import { formatDuration } from '@shared/utils';

interface CompletePageProps {
  /** The completed recording session */
  session: RecordingSession;
  /** Callback to reset the popup back to RecordPage */
  onReset: () => void;
}

export function CompletePage({ session, onReset }: CompletePageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  /**
   * Requests the background to download the recording as a .webm file.
   * After successful download, resets the popup to the initial state.
   */
  async function handleDownload() {
    setIsDownloading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.DOWNLOAD_RECORDING,
      });

      if (response?.success) {
        onReset();
      }
    } catch (err) {
      console.error('[MeetScribe:Popup] Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  }

  /**
   * Requests the background to discard the recorded audio.
   * Cleans up stored audio data and resets popup to initial state.
   */
  async function handleDiscard() {
    setIsDiscarding(true);

    try {
      await chrome.runtime.sendMessage({
        type: MessageType.DISCARD_RECORDING,
      });
      onReset();
    } catch (err) {
      console.error('[MeetScribe:Popup] Discard error:', err);
    } finally {
      setIsDiscarding(false);
    }
  }

  /** Calculate recording duration from start/stop timestamps */
  function getRecordingDuration(): number {
    if (!session.startedAt || !session.stoppedAt) return 0;

    const start = new Date(session.startedAt).getTime();
    const stop = new Date(session.stoppedAt).getTime();
    return Math.floor((stop - start) / 1000);
  }

  const duration = getRecordingDuration();

  return (
    <div className="complete-page">
      {/* Success indicator */}
      <div className="complete-icon">✓</div>
      <h2 className="complete-title">Recording Complete</h2>

      {/* Session summary */}
      <div className="session-summary">
        <div className="summary-row">
          <span className="summary-label">Duration:</span>
          <span className="summary-value">{formatDuration(duration)}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Meeting:</span>
          <span className="summary-value">
            {MEETING_TAG_LABELS[session.meetingTag]}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="complete-actions">
        <button
          className="btn btn-primary btn-download"
          onClick={handleDownload}
          disabled={isDownloading || isDiscarding}
        >
          {isDownloading ? 'Downloading...' : 'Download Recording'}
        </button>

        <button
          className="btn btn-secondary btn-discard"
          onClick={handleDiscard}
          disabled={isDownloading || isDiscarding}
        >
          {isDiscarding ? 'Discarding...' : 'Discard'}
        </button>
      </div>
    </div>
  );
}
