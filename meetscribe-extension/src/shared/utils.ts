/**
 * =============================================================================
 * MeetScribe - Utility Functions
 * =============================================================================
 *
 * General-purpose helper functions used across the extension.
 * Each function is pure (no side effects) and independently testable.
 * =============================================================================
 */

/**
 * Generates a unique identifier for recording sessions.
 * Uses crypto.randomUUID() which is available in all modern browsers
 * and extension contexts (including service workers).
 *
 * @returns A UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Formats seconds into a human-readable timer string.
 * Used by the popup UI to display recording duration.
 *
 * @param totalSeconds - The number of seconds to format
 * @returns Formatted string like "00:05:30" (hours:minutes:seconds)
 *
 * @example
 *   formatDuration(0)    → "00:00:00"
 *   formatDuration(65)   → "00:01:05"
 *   formatDuration(3661) → "01:01:01"
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return [hours, minutes, seconds]
    .map((unit) => unit.toString().padStart(2, '0'))
    .join(':');
}

/**
 * Converts a Blob (audio data) to a base64 data URL string.
 * This allows audio data to be passed through chrome.runtime.sendMessage(),
 * which only supports JSON-serializable values (not Blobs).
 *
 * @param blob - The audio Blob to convert
 * @returns A data URL string (e.g., "data:audio/webm;base64,...")
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a base64 data URL string back to a Blob.
 * Used when the background service worker receives audio data
 * from the offscreen document and needs to create a downloadable file.
 *
 * @param dataUrl - The data URL string to convert back to a Blob
 * @returns A Blob containing the decoded binary data
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'audio/webm';
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

/**
 * Returns the current timestamp as an ISO string.
 * Centralized so it's easy to mock in tests.
 *
 * @returns ISO 8601 timestamp (e.g., "2024-01-15T14:30:00.000Z")
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
