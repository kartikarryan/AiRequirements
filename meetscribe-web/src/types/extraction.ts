/**
 * =============================================================================
 * MeetScribe Web — Extraction Response Types
 * =============================================================================
 *
 * Types for the config-driven extraction API response.
 * These match the .NET ExtractionResponse model.
 *
 * The response is dynamic — sections change based on which template was used.
 * Frontend renders sections generically by their "type" field.
 * =============================================================================
 */

/** Top-level API response for extraction */
export interface ExtractionResult {
  templateId: string;
  templateName: string;
  sections: ExtractedSection[];
}

/** A single section in the extraction result */
export interface ExtractedSection {
  key: string;
  type: string;
  label: string;
  data: any;
}

/** Template definition (from GET /api/templates) */
export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  sectionCount: number;
}
