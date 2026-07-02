/**
 * Integration Service — config-driven, multi-provider.
 */

import { ApiError, api } from './apiClient';

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

export interface ConnectedProvider {
  provider: string;
  settings: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export async function getIntegrationsConfig(): Promise<ProviderConfig[]> {
  const response = await api.get('/api/integrations/config');
  if (!response.ok) return [];
  const body = await response.json();
  return body?.data || body?.providers || [];
}

export async function getConnectedIntegrations(): Promise<{ configured: boolean; data: ConnectedProvider[] }> {
  const response = await api.get('/api/integrations');
  if (!response.ok) return { configured: false, data: [] };
  return await response.json();
}

export async function getProviderStatus(provider: string): Promise<{ configured: boolean; settings?: Record<string, string>; createdAt?: string }> {
  const response = await api.get(`/api/integrations/${provider}`);
  if (!response.ok) return { configured: false };
  return await response.json();
}

export async function testProviderConnection(provider: string, settings: Record<string, string>): Promise<{ success: boolean; message: string; projects?: string[] }> {
  const response = await api.post(`/api/integrations/${provider}/test`, settings);
  return await response.json();
}

export async function saveProviderSettings(provider: string, settings: Record<string, string>): Promise<void> {
  const response = await api.post(`/api/integrations/${provider}`, settings);
  if (!response.ok) {
    const body = await response.json();
    throw new ApiError(response.status, body?.message || 'Failed to save settings.');
  }
}

export async function disconnectProvider(provider: string): Promise<void> {
  const response = await api.delete(`/api/integrations/${provider}`);
  if (!response.ok) throw new ApiError(response.status, 'Failed to disconnect.');
}

export async function getProviderProjects(provider: string): Promise<string[]> {
  const response = await api.get(`/api/integrations/${provider}/projects`);
  if (!response.ok) return [];
  const body = await response.json();
  return body?.data || [];
}

export async function getProviderIterations(provider: string, project: string): Promise<string[]> {
  const response = await api.get(`/api/integrations/${provider}/iterations?project=${encodeURIComponent(project)}`);
  if (!response.ok) return [];
  const body = await response.json();
  return body?.data || [];
}
