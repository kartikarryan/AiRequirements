/**
 * Extraction Service — handles audio upload + AI extraction.
 */

import { ExtractionResult } from '../types/extraction';
import { API_BASE_URL, REQUEST_TIMEOUT_MS, ApiError, parseResponseBody, getDefaultErrorMessage } from './apiClient';

/**
 * Uploads audio file and waits for extraction to complete.
 */
export async function uploadAndExtract(
  file: File,
  templateId: string,
  meetingName: string = '',
  description: string = '',
  projectId?: number,
  meetingDate?: string
): Promise<any> {
  const formData = new FormData();
  formData.append('AudioFile', file);
  formData.append('TemplateId', templateId);
  formData.append('Name', meetingName);
  if (description) formData.append('Description', description);
  if (projectId) formData.append('ProjectId', projectId.toString());
  if (meetingDate) formData.append('MeetingDate', meetingDate);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/requirements`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const body = await parseResponseBody<ExtractionResult>(response);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        body?.message || getDefaultErrorMessage(response.status),
        body?.errors || []
      );
    }

    if (!body?.data) {
      throw new ApiError(500, 'Server returned empty response.');
    }

    return body.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. The file may be too large. Try a shorter recording.');
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(0, 'Cannot reach the server. Please check if the backend is running.');
    }

    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    );
  }
}

/**
 * Re-runs AI extraction on existing transcript (optionally with different template).
 * POST /api/meetings/{id}/retry
 */
export async function retryExtraction(meetingId: number, templateId?: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: templateId || null }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await parseResponseBody<any>(response);
      throw new ApiError(response.status, body?.message || 'Failed to regenerate extraction.');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Retry timed out. Please try again.');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'An unexpected error occurred.');
  }
}
