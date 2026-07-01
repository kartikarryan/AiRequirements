/**
 * =============================================================================
 * MeetScribe - Record Page
 * =============================================================================
 *
 * The initial page shown when no recording is active.
 * User selects a meeting tag (category) and clicks "Start Recording".
 *
 * Use Case:
 *  - User opens extension popup before/during a meeting
 *  - Selects the type of meeting (standup, planning, client call, etc.)
 *  - Clicks start → audio capture begins
 *  - Popup transitions to RecordingPage
 *
 * The meeting tag selection helps the AI extraction model later understand
 * the context of the meeting and extract more relevant information.
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  RecordingSession,
  MeetingTag,
  MEETING_TAG_LABELS,
  MessageType,
} from '@shared/types';

interface RecordPageProps {
  /** Callback when recording starts successfully (updates parent state) */
  onSessionStart: (session: RecordingSession) => void;
  /** Callback when an error occurs */
  onError: (error: string) => void;
}

export function RecordPage({ onSessionStart, onError }: RecordPageProps) {
  const [selectedTag, setSelectedTag] = useState<MeetingTag>(MeetingTag.GENERAL);
  const [isStarting, setIsStarting] = useState(false);

  /**
   * Sends a START_RECORDING message to the background service worker.
   * The background will handle tab capture and offscreen document creation.
   */
  async function handleStartRecording() {
    setIsStarting(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.START_RECORDING,
        meetingTag: selectedTag,
      });

      if (response?.success && response.session) {
        onSessionStart(response.session);
      } else {
        onError(response?.error ?? 'Failed to start recording');
      }
    } catch (err) {
      onError('Could not start recording. Make sure you are on a meeting tab.');
      console.error('[MeetScribe:Popup] Start recording error:', err);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="record-page">
      {/* Meeting tag selector */}
      <section className="tag-section">
        <label className="tag-label" htmlFor="meeting-tag">
          Meeting Type
        </label>
        <select
          id="meeting-tag"
          className="tag-select"
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value as MeetingTag)}
          disabled={isStarting}
        >
          {Object.entries(MEETING_TAG_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </section>

      {/* Instructions */}
      <section className="instructions">
        <p className="instruction-text">
          Navigate to your meeting tab and click Start Recording.
          A consent banner will appear on the page to notify participants.
        </p>
      </section>

      {/* Start button */}
      <button
        className="btn btn-primary btn-start"
        onClick={handleStartRecording}
        disabled={isStarting}
      >
        {isStarting ? 'Starting...' : 'Start Recording'}
      </button>
    </div>
  );
}
