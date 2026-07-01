/**
 * Integration Service — config-driven, multi-provider.
 * Works with ANY provider — reads config for fields, calls provider-specific endpoints.
 */

import { API_BASE_URL, ApiError } from './apiClient';

/** Provider definition from integrations-config.json */
export interface ProviderConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  available: boolean;
  fields: ProviderField[];
}

export interface ProviderField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  helpLink?: string;
}

/** Connected provider from GET /api/integrations */
export interface ConnectedProvider {
  provider: string;
  settings: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/** Gets integrations config (provider definitions with fields) */
export async function getIntegrationsConfig(): Promise<ProviderConfig[]> {
  const response = await fetch(`${API_BASE_URL}/api/integrations/config`);
  if (!response.ok) return [];
  const body = await response.json();
  return body?.data || body?.providers || [];
}

/** Gets all connected integrations */
export async function getConnectedIntegrations(): Promise<{ configured: boolean; data: ConnectedProvider[] }> {
  const response = await fetch(`${API_BASE_URL}/api/integrations`);
  if (!response.ok) return { configured: false, data: [] };
  return await response.json();
}

/** Gets a specific provider's connection status */
export async function getProviderStatus(provider: string): Promise<{ configured: boolean; settings?: Record<string, string>; createdAt?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/integrations/${provider}`);
  if (!response.ok) return { configured: false };
  return await response.json();
}

/** Tests connection for a provider */
export async function testProviderConnection(provider: string, settings: Record<string, string>): Promise<{ success: boolean; message: string; projects?: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/integrations/${provider}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return await response.json();
}

/** Saves provider settings */
export async function saveProviderSettings(provider: string, settings: Record<string, string>): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/integrations/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const body = await response.json();
    throw new ApiError(response.status, body?.message || 'Failed to save settings.');
  }
}

/** Disconnects a provider */
export async function disconnectProvider(provider: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/integrations/${provider}`, { method: 'DELETE' });
  if (!response.ok) throw new ApiError(response.status, 'Failed to disconnect.');
}

/** Gets projects for a provider */
export async function getProviderProjects(provider: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/integrations/${provider}/projects`);
  if (!response.ok) return [];
  const body = await response.json();
  return body?.data || [];
}

/** Gets iterations for a project */
export async function getProviderIterations(provider: string, project: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/integrations/${provider}/iterations?project=${encodeURIComponent(project)}`);
  if (!response.ok) return [];
  const body = await response.json();
  return body?.data || [];
}
