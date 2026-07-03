/**
 * Meeting Service — CRUD operations for meeting records.
 */

import { ApiError, parseResponseBody, api } from './apiClient';

export { ApiError } from './apiClient';
export { uploadAndExtract, retryExtraction } from './extractionService';
export { getTemplatesConfig } from './templateService';

export async function getMeetingsByProject(projectId: number): Promise<any[]> {
  const response = await api.get(`/api/meetings?projectId=${projectId}`);
  const body = await parseResponseBody<any[]>(response);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message || 'Failed to load meetings.');
  }

  return body?.data || [];
}

export async function searchMeetings(query: string, projectId: number): Promise<any[]> {
  const params = new URLSearchParams({ query, projectId: projectId.toString() });

  const response = await api.get(`/api/meetings/search?${params}`);
  const body = await parseResponseBody<any[]>(response);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message || 'Search failed.');
  }

  return body?.data || [];
}

export async function getAllMeetings(): Promise<any[]> {
  const response = await api.get('/api/meetings');
  const body = await parseResponseBody<any[]>(response);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message || 'Failed to load meetings.');
  }

  return body?.data || [];
}

export async function getMeetingById(meetingId: number): Promise<any> {
  const response = await api.get(`/api/meetings/${meetingId}`);
  const body = await parseResponseBody<any>(response);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message || 'Failed to load meeting details.');
  }

  return body?.data || null;
}

export async function saveEditedExtraction(meetingId: number, editedResultJson: string): Promise<void> {
  const response = await api.put(`/api/meetings/${meetingId}/extraction`, { editedResultJson });

  if (!response.ok) {
    const body = await parseResponseBody<any>(response);
    throw new ApiError(response.status, body?.message || 'Failed to save changes.');
  }
}

export async function deleteMeeting(meetingId: number): Promise<void> {
  const response = await api.delete(`/api/meetings/${meetingId}`);

  if (!response.ok) {
    const body = await parseResponseBody<any>(response);
    throw new ApiError(response.status, body?.message || 'Failed to delete meeting.');
  }
}

export async function deleteAccount(): Promise<void> {
  const response = await api.delete('/api/account');

  if (!response.ok) {
    const body = await parseResponseBody<any>(response);
    throw new ApiError(response.status, body?.message || 'Failed to delete account.');
  }
}

export async function bulkDeleteMeetings(ids: number[]): Promise<void> {
  const response = await api.post('/api/meetings/bulk-delete', { ids });

  if (!response.ok) {
    const body = await parseResponseBody<any>(response);
    throw new ApiError(response.status, body?.message || 'Failed to delete meetings.');
  }
}
