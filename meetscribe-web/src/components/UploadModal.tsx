/**
 * =============================================================================
 * MeetScribe Web — Upload Modal (Revamped)
 * =============================================================================
 *
 * Form-style upload modal with:
 *   - Meeting Name (required, max 50 chars)
 *   - Meeting Template dropdown (required, single selection)
 *   - Description (optional, max 100 chars)
 *   - Audio File upload (required, .webm only, max 200 MB)
 *
 * Validation:
 *   Required: Meeting Name, Template, Audio File
 *   Optional: Description
 *
 * Loader stays until RabbitMQ integration replaces it with async processing.
 * =============================================================================
 */

import { useState, useRef } from 'react';

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 100;

/** Hardcoded template list — future: fetched from GET /api/templates */
const TEMPLATES = [
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes',
    description: 'Summary, attendees, key topics, decisions, action items, and next steps',
  },
  {
    id: 'requirements-doc',
    name: 'Requirements Document',
    description: 'User stories, requirements with acceptance criteria, scope, constraints, and risks',
  },
  {
    id: 'action-items',
    name: 'Action Items Only',
    description: 'Tasks with dependencies, follow-ups, blockers, and assignments',
  },
  {
    id: 'sprint-grooming',
    name: 'Sprint / Backlog Grooming',
    description: 'Sprint goal, user stories, estimates, dependencies, and decisions',
  },
  {
    id: 'stakeholder-interview',
    name: 'Stakeholder Interview',
    description: 'Pain points, current workflows, desired outcomes, and who said what',
  },
  {
    id: 'uat-demo-feedback',
    name: 'UAT / Demo Feedback',
    description: 'Feedback received, change requests, bugs found, and approvals',
  },
];

interface UploadModalProps {
  onClose: () => void;
  onUpload: (file: File, templateId: string, meetingName: string, description: string, projectId?: number, meetingDate?: string) => Promise<void>;
  preSelectedProjectId?: number;
}

export function UploadModal({ onClose, onUpload, preSelectedProjectId }: UploadModalProps) {
  const [meetingName, setMeetingName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validates all required fields before submission.
   * Returns true if valid, false if errors found.
   */
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!meetingName.trim()) {
      newErrors.meetingName = 'Meeting name is required.';
    } else if (meetingName.trim().length > MAX_NAME_LENGTH) {
      newErrors.meetingName = `Maximum ${MAX_NAME_LENGTH} characters allowed.`;
    }

    if (!selectedTemplate) {
      newErrors.template = 'Please select a template.';
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Maximum ${MAX_DESCRIPTION_LENGTH} characters allowed.`;
    }

    if (!file) {
      newErrors.file = 'Audio file is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateFile(selectedFile: File): string | null {
    const allowedExtensions = ['.webm', '.mp3', '.wav'];
    const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return 'Only .webm, .mp3, and .wav files are supported.';
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      return 'File size exceeds 200 MB limit.';
    }
    return null;
  }

  function handleFileSelect(selectedFile: File) {
    const fileError = validateFile(selectedFile);
    if (fileError) {
      setErrors((prev) => ({ ...prev, file: fileError }));
      setFile(null);
      return;
    }
    setErrors((prev) => {
      const { file: _, ...rest } = prev;
      return rest;
    });
    setFile(selectedFile);
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsProcessing(true);
    await onUpload(file!, selectedTemplate, meetingName.trim(), description.trim(), preSelectedProjectId || undefined, meetingDate);
    setIsProcessing(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={isProcessing ? undefined : onClose} />

      <div className="relative card shadow-modal w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">New Meeting</h2>
            <p className="text-xs text-slate-400 mt-0.5">Upload audio to extract structured information</p>
          </div>
          {!isProcessing && (
            <button onClick={onClose} className="btn-ghost">✕</button>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Template Selection */}
          <div className="space-y-2">
            <p className="section-label">Template <span className="text-red-400">*</span></p>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={isProcessing}
              className={`select-field ${errors.template ? 'border-red-300' : ''}`}
            >
              <option value="">What type of meeting is this?</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.template && <p className="text-xs text-red-500 mt-1">{errors.template}</p>}
            {selectedTemplate && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5">
                {TEMPLATES.find((t) => t.id === selectedTemplate)?.description}
              </p>
            )}
          </div>

          {/* Meeting Details */}
          <div className="space-y-2">
            <p className="section-label">Meeting Details</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="e.g., Sprint Planning, Client Call"
                  disabled={isProcessing}
                  className={`input-field ${errors.meetingName ? 'input-error' : ''}`}
                />
                {errors.meetingName && <p className="text-xs text-red-500 mt-1">{errors.meetingName}</p>}
              </div>
              <div>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  disabled={isProcessing}
                  className="input-field"
                  title="When did this meeting happen?"
                />
              </div>
            </div>

            {description || showDescription ? (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={MAX_DESCRIPTION_LENGTH}
                placeholder="Brief description (optional)"
                disabled={isProcessing}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            ) : (
              <button
                onClick={() => setShowDescription(true)}
                className="text-xs text-primary hover:text-primary-hover font-medium"
              >
                + Add description
              </button>
            )}
          </div>

          {/* Section 3: Audio Upload */}
          <div className="space-y-2">
            <p className="section-label">Audio File <span className="text-red-400">*</span></p>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`
                rounded-xl p-5 text-center transition-all cursor-pointer
                ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}
                ${isDragging ? 'bg-indigo-50 border-2 border-primary' : errors.file ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100'}
                ${file ? 'bg-green-50 border-2 border-green-300' : ''}
              `}
            >
              {file ? (
                <div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 text-lg">&#10003;</span>
                  </div>
                  <p className="text-sm font-medium text-green-800">{file.name}</p>
                  <p className="text-xs text-green-600 mt-0.5">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-gray-500 text-lg">&#9835;</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Drop your audio file here</p>
                  <p className="text-xs text-gray-500 mt-1">or <span className="text-primary font-medium">click to browse</span></p>
                  <p className="text-xs text-gray-400 mt-2">.webm, .mp3, .wav up to 200 MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".webm,.mp3,.wav"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                disabled={isProcessing}
              />
            </div>
            {errors.file && <p className="text-xs text-red-500">{errors.file}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          {isProcessing ? (
            <p className="text-xs text-slate-500">Transcribing and extracting... This may take 30-90 seconds.</p>
          ) : (
            <p className="text-xs text-slate-400">* Required fields</p>
          )}
          <div className="flex gap-2">
            {!isProcessing && (
              <button onClick={onClose} className="btn-secondary">Cancel</button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="btn-primary flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Spinner />
                  Processing...
                </>
              ) : (
                'Upload & Extract'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
