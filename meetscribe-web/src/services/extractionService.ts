/**
 * Extraction Service — handles audio upload + AI extraction.
 */

import { ExtractionResult } from '../types/extraction';
import { REQUEST_TIMEOUT_MS, ApiError, parseResponseBody, getDefaultErrorMessage, api } from './apiClient';

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
    const response = await api.upload('/api/requirements', formData, controller.signal);

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

export async function retryExtraction(meetingId: number, templateId?: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await api.post(`/api/meetings/${meetingId}/retry`, { templateId: templateId || null });

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
