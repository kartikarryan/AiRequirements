/**
 * Template Service — fetches template configuration for rendering.
 */

import { ApiError, api } from './apiClient';

let cachedConfig: any = null;

export async function getTemplatesConfig(): Promise<any> {
  if (cachedConfig) return cachedConfig;

  const response = await api.get('/api/templates/config');
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to load templates config.');
  }

  cachedConfig = await response.json();
  return cachedConfig;
}
