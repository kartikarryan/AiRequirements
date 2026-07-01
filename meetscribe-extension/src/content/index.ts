/**
 * =============================================================================
 * MeetScribe - Content Script (Entry Point)
 * =============================================================================
 *
 * This script is injected into every web page the user visits.
 * Its sole responsibility is to show/hide the consent banner when
 * the background service worker tells it to.
 *
 * Use Case:
 *  - User starts recording on a meeting tab (Teams, Meet, Zoom, etc.)
 *  - This script receives a SHOW_CONSENT_BANNER message
 *  - Displays a floating banner: "This meeting is being recorded"
 *  - When recording stops, receives HIDE_CONSENT_BANNER and removes it
 *
 * Design Decisions:
 *  - Injects a Shadow DOM element to avoid style conflicts with the host page
 *  - Banner is non-intrusive (small, top of page, semi-transparent)
 *  - Self-cleans when the content script is unloaded
 *
 * Permissions:
 *  - This script runs in the page's context but can communicate with
 *    the extension's background via chrome.runtime.onMessage
 * =============================================================================
 */

import { MessageType } from '@shared/types';
import { createConsentBanner, removeConsentBanner } from './consentBanner';

// -----------------------------------------------------------------------------
// Message Listener
// -----------------------------------------------------------------------------

/**
 * Listens for messages from the background service worker.
 * Shows or hides the consent banner based on the recording state.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case MessageType.SHOW_CONSENT_BANNER:
      createConsentBanner();
      sendResponse({ success: true });
      break;

    case MessageType.HIDE_CONSENT_BANNER:
      removeConsentBanner();
      sendResponse({ success: true });
      break;
  }
});
