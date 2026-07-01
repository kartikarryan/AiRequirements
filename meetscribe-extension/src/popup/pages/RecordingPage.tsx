/**
 * =============================================================================
 * MeetScribe - Recording Page
 * =============================================================================
 *
 * Shown while audio is actively being recorded.
 * Displays a live timer and a "Stop Recording" button.
 *
 * Use Case:
 *  - Recording is in progress
 *  - User sees a visual timer counting up (HH:MM:SS)
 *  - User sees the meeting tag they selected
 *  - User can stop the recording at any time
 *  - After stopping, popup transitions to CompletePage
 *
 * Timer Logic:
 *  - Uses the session.startedAt timestamp as the reference point
 *  - Updates every second via setInterval
 *  - Survives popup close/reopen (recalculates from startedAt)
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  RecordingSession,
  MessageType,
  MEETING_TAG_LABELS,
} from '@shared/types';
import { formatDuration } from '@shared/utils';
import { TIMER_UPDATE_INTERVAL_MS } from '@shared/constants';

interface RecordingPageProps {
  /** The active recording session */
  session: RecordingSession;
  /** Callback when session state changes (e.g., stopped) */
  onSessionUpdate: (session: RecordingSession) => void;
}

export function RecordingPage({ session, onSessionUpdate }: RecordingPageProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStopping, setIsStopping] = useState(false);

  /**
   * Timer effect: calculates elapsed time from session.startedAt.
   * Runs every second and updates the displayed duration.
   * Self-corrects if popup was closed and reopened mid-recording.
   */
  useEffect(() => {
    function updateTimer() {
      if (session.startedAt) {
        const startTime = new Date(session.startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }
    }

    // Calculate immediately on mount (handles popup reopen case)
    updateTimer();

    // Then update every second
    const intervalId = setInterval(updateTimer, TIMER_UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [session.startedAt]);

  /**
   * Sends a STOP_RECORDING message to the background service worker.
   * Background will stop the offscreen MediaRecorder and update session state.
   */
  async function handleStopRecording() {
    setIsStopping(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.STOP_RECORDING,
      });

      if (response?.success && response.session) {
        onSessionUpdate(response.session);
      }
    } catch (err) {
      console.error('[MeetScribe:Popup] Stop recording error:', err);
    } finally {
      setIsStopping(false);
    }
  }

  return (
    <div className="recording-page">
      {/* Recording indicator */}
      <div className="recording-indicator">
        <span className="recording-dot"></span>
        <span className="recording-text">Recording</span>
      </div>

      {/* Live timer display */}
      <div className="timer-display">
        {formatDuration(elapsedSeconds)}
      </div>

      {/* Meeting tag badge */}
      <div className="meeting-tag-badge">
        {MEETING_TAG_LABELS[session.meetingTag]}
      </div>

      {/* Stop button */}
      <button
        className="btn btn-danger btn-stop"
        onClick={handleStopRecording}
        disabled={isStopping}
      >
        {isStopping ? 'Stopping...' : 'Stop Recording'}
      </button>
    </div>
  );
}
