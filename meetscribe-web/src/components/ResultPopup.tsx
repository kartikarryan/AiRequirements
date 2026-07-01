/**
 * =============================================================================
 * MeetScribe Web — Result Popup
 * =============================================================================
 *
 * Shows a popup notification after API responds:
 *   - Success (green): extraction returned items
 *   - Error (red): server error, transcription failed, network error
 *   - No Data (yellow): API succeeded but no requirements found in audio
 *
 * Auto-closes after 5 seconds, or user can click X to dismiss.
 * =============================================================================
 */

import { useEffect } from 'react';

interface ResultPopupProps {
  type: 'success' | 'error' | 'nodata';
  message: string;
  onClose: () => void;
}

const POPUP_STYLES: Record<string, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  nodata: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const POPUP_ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  nodata: '⚠',
};

const POPUP_TITLES: Record<string, string> = {
  success: 'Extraction Complete',
  error: 'Error',
  nodata: 'No Data Found',
};

export function ResultPopup({ type, message, onClose }: ResultPopupProps) {
  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm animate-slide-in">
      <div className={`rounded-lg border p-4 shadow-lg ${POPUP_STYLES[type]}`}>
        <div className="flex items-start gap-3">
          <span className="text-lg font-bold">{POPUP_ICONS[type]}</span>
          <div className="flex-1">
            <p className="font-semibold text-sm">{POPUP_TITLES[type]}</p>
            <p className="text-sm mt-0.5">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
