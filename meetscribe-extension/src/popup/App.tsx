/**
 * =============================================================================
 * MeetScribe - Main Popup Application
 * =============================================================================
 *
 * The root React component for the extension popup. Manages the overall
 * application state and renders the appropriate page based on recording status.
 *
 * Pages:
 *  - RecordPage: Shown when idle (select tag → start recording)
 *  - RecordingPage: Shown during active recording (timer, stop button)
 *  - CompletePage: Shown after recording stops (download or discard)
 *
 * State Management:
 *  - On mount, fetches current session from background service worker
 *  - Renders the correct page based on session.status
 *  - Updates in real-time via message passing from background
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { RecordingSession, RecordingStatus, MessageType } from '@shared/types';
import { RecordPage } from './pages/RecordPage';
import { RecordingPage } from './pages/RecordingPage';
import { CompletePage } from './pages/CompletePage';

export function App() {
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * On mount: ask the background worker for the current session state.
   * This handles the case where user closes and reopens the popup mid-recording.
   */
  useEffect(() => {
    fetchCurrentStatus();
  }, []);

  /**
   * Listen for real-time status updates from the background worker.
   * This keeps the popup UI in sync without polling.
   */
  useEffect(() => {
    const listener = (message: { type: string; session?: RecordingSession }) => {
      if (message.type === MessageType.STATUS_UPDATE && message.session) {
        setSession(message.session);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  /**
   * Fetches the current recording session from the background service worker.
   * Determines which page to show when the popup first opens.
   */
  async function fetchCurrentStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.GET_STATUS,
      });

      if (response?.session) {
        setSession(response.session);
      }
    } catch (err) {
      setError('Failed to connect to extension background.');
      console.error('[MeetScribe:Popup] Status fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading spinner while fetching initial state
  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Show error state if background connection failed
  if (error) {
    return (
      <div className="popup-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  // Render the appropriate page based on current recording state
  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1 className="popup-title">MeetScribe</h1>
        <span className="popup-subtitle">Meeting Audio Capture</span>
      </header>

      <main className="popup-content">
        {renderCurrentPage()}
      </main>
    </div>
  );

  /**
   * Determines which page component to render based on session status.
   * Returns the idle/record page if no session exists.
   */
  function renderCurrentPage() {
    if (!session || session.status === RecordingStatus.IDLE) {
      return <RecordPage onSessionStart={setSession} onError={setError} />;
    }

    if (session.status === RecordingStatus.RECORDING) {
      return <RecordingPage session={session} onSessionUpdate={setSession} />;
    }

    if (session.status === RecordingStatus.STOPPED) {
      return <CompletePage session={session} onReset={() => setSession(null)} />;
    }

    return <RecordPage onSessionStart={setSession} onError={setError} />;
  }
}
