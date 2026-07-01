/**
 * =============================================================================
 * MeetScribe - Consent Banner
 * =============================================================================
 *
 * Creates and manages a floating consent notification on the meeting page.
 * This banner informs meeting participants that audio is being recorded.
 *
 * Why Consent Banner?
 *  - Legal requirement in many jurisdictions (GDPR, CCPA, etc.)
 *  - Professional courtesy to meeting participants
 *  - Reminds the user that recording is active
 *
 * Technical Approach:
 *  - Uses Shadow DOM to isolate styles from the host page
 *  - Prevents the host page's CSS from breaking our banner
 *  - Prevents our CSS from affecting the host page
 *  - Positioned fixed at the top of the viewport
 *  - Auto-dismisses when recording stops
 *
 * Visual Design:
 *  - Small, non-intrusive bar at the top of the page
 *  - Red recording dot + clear message
 *  - Semi-transparent so it doesn't block important content
 * =============================================================================
 */

/** Unique ID for the banner container element */
const BANNER_CONTAINER_ID = 'meetscribe-consent-banner';

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Creates and displays the consent banner on the current page.
 * Uses Shadow DOM for style isolation from the host page.
 *
 * Safe to call multiple times — won't create duplicate banners.
 */
export function createConsentBanner(): void {
  // Prevent duplicate banners
  if (document.getElementById(BANNER_CONTAINER_ID)) {
    return;
  }

  // Create a host element for the Shadow DOM
  const hostElement = document.createElement('div');
  hostElement.id = BANNER_CONTAINER_ID;
  hostElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;

  // Attach Shadow DOM for style isolation
  const shadow = hostElement.attachShadow({ mode: 'closed' });

  // Inject banner HTML and styles into the shadow root
  shadow.innerHTML = `
    <style>
      ${getBannerStyles()}
    </style>
    ${getBannerHTML()}
  `;

  // Append to page
  document.body.appendChild(hostElement);
}

/**
 * Removes the consent banner from the page.
 * Safe to call even if banner doesn't exist.
 */
export function removeConsentBanner(): void {
  const banner = document.getElementById(BANNER_CONTAINER_ID);
  if (banner) {
    banner.remove();
  }
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

/**
 * Returns the HTML structure for the consent banner.
 * Kept as a function for readability and potential future parameterization.
 */
function getBannerHTML(): string {
  return `
    <div class="consent-banner">
      <div class="consent-banner-content">
        <span class="recording-dot"></span>
        <span class="consent-text">
          MeetScribe is recording this meeting
        </span>
      </div>
    </div>
  `;
}

/**
 * Returns the CSS styles for the consent banner.
 * These styles are scoped within the Shadow DOM and won't leak
 * to the host page or be affected by the host page's styles.
 */
function getBannerStyles(): string {
  return `
    .consent-banner {
      display: flex;
      justify-content: center;
      padding: 8px 16px;
      background: rgba(220, 38, 38, 0.95);
      backdrop-filter: blur(4px);
      pointer-events: auto;
      animation: slideDown 0.3s ease-out;
    }

    .consent-banner-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .recording-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .consent-text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: white;
      letter-spacing: 0.01em;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
}
