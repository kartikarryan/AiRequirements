/**
 * =============================================================================
 * MeetScribe - Audio Storage (IndexedDB)
 * =============================================================================
 *
 * Persistent storage for audio recordings using IndexedDB.
 *
 * Why IndexedDB over other options:
 *  - chrome.storage.local: Limited to ~10MB, fails silently for large files
 *  - Memory (Blob in RAM): Lost on crash, browser restart, or offscreen kill
 *  - IndexedDB: Handles hundreds of MBs, persists across restarts, crash-safe
 *
 * Design Decisions:
 *  - Single database "meetscribe" with one object store "recordings"
 *  - Each recording stored by session ID as key
 *  - Blob stored directly (IndexedDB supports binary data natively — no base64)
 *  - Version-based migrations for future schema changes
 *  - All methods are async and handle errors gracefully
 *
 * Usage:
 *   import { audioStorage } from '@shared/audioStorage';
 *   await audioStorage.save('session-123', blob);
 *   const blob = await audioStorage.get('session-123');
 *   await audioStorage.remove('session-123');
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Database name — unique to our extension */
const DB_NAME = 'meetscribe_audio';

/** Current database version — increment when changing schema */
const DB_VERSION = 1;

/** Object store that holds audio blobs */
const STORE_NAME = 'recordings';

// -----------------------------------------------------------------------------
// Database Connection
// -----------------------------------------------------------------------------

/**
 * Opens (or creates) the IndexedDB database.
 * Handles version upgrades by creating/modifying object stores.
 *
 * IndexedDB uses a version-based migration system:
 *  - First time: creates the database and object store
 *  - Version bump: runs onupgradeneeded to modify schema
 *
 * @returns A ready-to-use IDBDatabase instance
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Called when database is created or version is bumped
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create the recordings store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject(new Error(
        `Failed to open IndexedDB: ${(event.target as IDBOpenDBRequest).error?.message}`
      ));
    };
  });
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export const audioStorage = {
  /**
   * Saves an audio blob to IndexedDB.
   *
   * The blob is stored as-is (binary) — no base64 encoding needed.
   * IndexedDB handles Blob objects natively, which is more efficient
   * than converting to a string.
   *
   * @param sessionId - Unique key for this recording (UUID)
   * @param blob - The audio Blob to store
   */
  async save(sessionId: string, blob: Blob): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put(blob, sessionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(
        new Error(`Failed to save audio: ${request.error?.message}`)
      );

      // Close database connection when transaction completes
      transaction.oncomplete = () => db.close();
    });
  },

  /**
   * Retrieves an audio blob from IndexedDB.
   *
   * @param sessionId - The key of the recording to retrieve
   * @returns The audio Blob, or null if not found
   */
  async get(sessionId: string): Promise<Blob | null> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(sessionId);

      request.onsuccess = () => {
        resolve(request.result as Blob ?? null);
      };
      request.onerror = () => reject(
        new Error(`Failed to get audio: ${request.error?.message}`)
      );

      transaction.oncomplete = () => db.close();
    });
  },

  /**
   * Removes an audio blob from IndexedDB.
   * Call this after successful download or when user discards.
   *
   * @param sessionId - The key of the recording to remove
   */
  async remove(sessionId: string): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.delete(sessionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(
        new Error(`Failed to remove audio: ${request.error?.message}`)
      );

      transaction.oncomplete = () => db.close();
    });
  },

  /**
   * Removes all stored recordings.
   * Use for cleanup or when user logs out.
   */
  async clear(): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(
        new Error(`Failed to clear audio storage: ${request.error?.message}`)
      );

      transaction.oncomplete = () => db.close();
    });
  },

  /**
   * Checks if a recording exists in storage.
   *
   * @param sessionId - The key to check
   * @returns true if a recording exists with this key
   */
  async exists(sessionId: string): Promise<boolean> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.count(sessionId);

      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => reject(
        new Error(`Failed to check audio existence: ${request.error?.message}`)
      );

      transaction.oncomplete = () => db.close();
    });
  },
};
