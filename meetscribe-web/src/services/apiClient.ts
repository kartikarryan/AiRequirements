/**
 * Shared API client — base URL, error class, and helper utilities.
 * All service files import from here.
 */

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5072';

export const REQUEST_TIMEOUT_MS = 600_000; // 10 min (1-hour audio can take 2-3 min to process)

// -----------------------------------------------------------------------------
// Auth Header
// -----------------------------------------------------------------------------

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('meetscribe_access_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// -----------------------------------------------------------------------------
// Error Class
// -----------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public errors: string[] = []
  ) {
    super(userMessage);
    this.name = 'ApiError';
  }
}

// -----------------------------------------------------------------------------
// Response Envelope
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  statusCode: number;
  message: string | null;
  data: T | null;
  errors: string[] | null;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export async function parseResponseBody<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    const text = await response.text();
    if (!text || text.trim().length === 0) return null;
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export function getDefaultErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400: return 'Invalid request. Please check the file and try again.';
    case 401: return 'Not authorized. Please log in.';
    case 403: return 'Access denied.';
    case 404: return 'API endpoint not found. Please check server configuration.';
    case 413: return 'File is too large. Maximum size is 200 MB.';
    case 415: return 'Unsupported file type.';
    case 429: return 'Too many requests. Please wait a moment and try again.';
    case 500: return 'Server error. Please try again later.';
    case 502: return 'Server is temporarily unavailable.';
    case 503: return 'Service is under maintenance. Please try again later.';
    default: return `Request failed with status ${statusCode}.`;
  }
}
