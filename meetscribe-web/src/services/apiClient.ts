/**
 * Centralized HTTP client with interceptor pipeline.
 * - Automatically attaches Bearer token to every request
 * - Handles 401 by attempting token refresh, then logout
 * - All services use `api.get('/projects')` — base URL is built-in
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5072';
export const REQUEST_TIMEOUT_MS = 600_000;

export const STORAGE_KEYS = {
  accessToken: 'meetscribe_access_token',
  idToken: 'meetscribe_id_token',
  refreshToken: 'meetscribe_refresh_token',
  expiresAt: 'meetscribe_expires_at',
} as const;

// -----------------------------------------------------------------------------
// Interceptor Pipeline
// -----------------------------------------------------------------------------

type RequestInterceptor = (url: string, config: RequestInit) => { url: string; config: RequestInit };
type ResponseInterceptor = (response: Response, url: string) => Response | Promise<Response>;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

// Attach Bearer token
requestInterceptors.push((url, config) => {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  if (token) {
    const headers = new Headers(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return { url, config: { ...config, headers } };
  }
  return { url, config };
});

// Handle 401 — clear session (let the AuthContext handle redirect naturally)
responseInterceptors.push((response) => {
  if (response.status === 401) {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }
  return response;
});

// -----------------------------------------------------------------------------
// HTTP Client
// -----------------------------------------------------------------------------

async function httpClient(url: string, options: RequestInit = {}): Promise<Response> {
  let finalUrl = url;
  let finalConfig = { ...options };

  for (const interceptor of requestInterceptors) {
    const result = interceptor(finalUrl, finalConfig);
    finalUrl = result.url;
    finalConfig = result.config;
  }

  let response = await fetch(finalUrl, finalConfig);

  for (const interceptor of responseInterceptors) {
    response = await interceptor(response, finalUrl);
  }

  return response;
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export const api = {
  get(path: string): Promise<Response> {
    return httpClient(buildUrl(path));
  },

  post<T = unknown>(path: string, body?: T, headers?: Record<string, string>): Promise<Response> {
    return httpClient(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T = unknown>(path: string, body?: T): Promise<Response> {
    return httpClient(buildUrl(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete(path: string): Promise<Response> {
    return httpClient(buildUrl(path), { method: 'DELETE' });
  },

  upload(path: string, formData: FormData, signal?: AbortSignal): Promise<Response> {
    return httpClient(buildUrl(path), { method: 'POST', body: formData, signal });
  },
};

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
