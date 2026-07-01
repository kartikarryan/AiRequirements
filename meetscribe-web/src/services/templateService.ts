/**
 * Template Service — fetches template configuration for rendering.
 */

import { API_BASE_URL, ApiError } from './apiClient';

let cachedConfig: any = null;

/**
 * Fetches template config (section types + display rules).
 * GET /api/templates/config
 * Cached after first successful call.
 */
export async function getTemplatesConfig(): Promise<any> {
  if (cachedConfig) return cachedConfig;

  const response = await fetch(`${API_BASE_URL}/api/templates/config`);
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to load templates config.');
  }

  cachedConfig = await response.json();
  return cachedConfig;
}
