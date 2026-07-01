/**
 * Project Service — CRUD for project folders.
 */

import { API_BASE_URL, ApiError } from './apiClient';

export interface Project {
  id: number;
  name: string;
  linkedProvider: string | null;
  createdAt: string;
  meetingCount: number;
  lastActivityAt: string | null;
}

export async function getAllProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects`);
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to load projects.');
  }
  const body = await response.json();
  return body?.data || [];
}

export async function createProject(name: string, linkedProvider?: string): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, linkedProvider: linkedProvider || null }),
  });

  if (response.status === 409) {
    const body = await response.json();
    return body.data;
  }

  if (!response.ok) {
    const body = await response.json();
    throw new ApiError(response.status, body?.message || 'Failed to create project.');
  }

  const body = await response.json();
  return body.data;
}

export async function deleteProject(projectId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    method: 'DELETE',
  });

  if (response.status === 409) {
    const body = await response.json();
    throw new ApiError(409, body.message, []);
  }

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to delete project.');
  }
}
