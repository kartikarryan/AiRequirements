/**
 * Meeting Service — CRUD operations for meeting records.
 *
 * Also re-exports from other services for backward compatibility
 * with existing component imports.
 */

import { API_BASE_URL, ApiError, parseResponseBody } from './apiClient';

// Re-exports so existing imports don't break
export { ApiError } from './apiClient';
export { uploadAndExtract, retryExtraction } from './extractionService';
export { getTemplatesConfig } from './templateService';

/**
 * Fetches meetings filtered by projectId.
 * GET /api/meetings?projectId={id}
 *
 * projectId = 0 → uncategorized meetings
 * projectId > 0 → meetings for that project
 */
export async function getMeetingsByProject(projectId: number): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/meetings?projectId=${projectId}`);
  const body = await parseResponseBody<any[]>(response);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message || 'Failed to load meetings.');
  }

  return body?.data || [];
}

/**
 * Searches across meeting names, transcripts, and extraction content.
 * GET /api/meetings/search?query={query}&projectId={projectId}
 */
export async function searchMeetings(query: string, projectId: number): Promise<any[]> {
  const params = new URLSearchParams({ query, projectId: projectId.toString() });

  const response = await fetch(`${API_BASE_URL}/api/meetings/search?${params}`);
  const body = await parseResponseBody<any[]>(response);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message || 'Search failed.');
  }

  return body?.data || [];
}

/**
 * Fetches all meetings (no filter).
 * GET /api/meetings
 */
export async function getAllMeetings(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/meetings`);
  const body = await parseResponseBody<any[]>(response);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message || 'Failed to load meetings.');
  }

  return body?.data || [];
}

/**
 * Fetches full meeting details (including extraction result JSON).
 * GET /api/meetings/{id}
 */
export async function getMeetingById(meetingId: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}`);
  const body = await parseResponseBody<any>(response);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message || 'Failed to load meeting details.');
  }

  return body?.data || null;
}

/**
 * Saves user-edited extraction result.
 * PUT /api/meetings/{id}/extraction
 */
export async function saveEditedExtraction(meetingId: number, editedResultJson: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/extraction`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ editedResultJson }),
  });

  if (!response.ok) {
    const body = await parseResponseBody<any>(response);
    throw new ApiError(response.status, body?.message || 'Failed to save changes.');
  }
}

/**
 * Deletes a meeting by ID.
 * DELETE /api/meetings/{id}
 */
export async function deleteMeeting(meetingId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const body = await parseResponseBody<any>(response);
    throw new ApiError(response.status, body?.message || 'Failed to delete meeting.');
  }
}
