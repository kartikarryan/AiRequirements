/**
 * =============================================================================
 * MeetScribe - Chrome Storage Helper
 * =============================================================================
 *
 * Wraps chrome.storage.local with typed, Promise-based methods.
 * This abstraction provides:
 *  - Type safety for stored values
 *  - Consistent async/await interface
 *  - Single place to change if we switch storage backends later
 *
 * Usage:
 *   import { storage } from '@shared/storage';
 *   const session = await storage.get<RecordingSession>(STORAGE_KEYS.CURRENT_SESSION);
 *   await storage.set(STORAGE_KEYS.CURRENT_SESSION, updatedSession);
 * =============================================================================
 */

/**
 * Type-safe wrapper around chrome.storage.local.
 * All extension contexts (popup, background, content) share the same storage.
 */
export const storage = {
  /**
   * Retrieves a value from chrome.storage.local.
   *
   * @param key - The storage key to look up
   * @returns The stored value, or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? null;
  },

  /**
   * Saves a value to chrome.storage.local.
   *
   * @param key - The storage key to write to
   * @param value - The value to store (must be JSON-serializable)
   */
  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },

  /**
   * Removes a value from chrome.storage.local.
   *
   * @param key - The storage key to remove
   */
  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },

  /**
   * Clears all MeetScribe data from chrome.storage.local.
   * Use with caution — this removes all extension state.
   */
  async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
  },
};
