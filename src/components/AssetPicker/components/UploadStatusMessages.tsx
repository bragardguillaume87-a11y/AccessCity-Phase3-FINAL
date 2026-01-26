import React from 'react';
import type { UploadStatus } from '../hooks/useAssetUpload';

/**
 * Props for UploadStatusMessages component
 */
export interface UploadStatusMessagesProps {
  /** Current upload status */
  uploadStatus: UploadStatus;
  /** Upload error message (if status is 'error') */
  uploadError: string | null;
}

/**
 * UploadStatusMessages - Display upload status feedback
 *
 * Shows different messages based on upload status:
 * - uploading: Blue banner with spinner
 * - success: Green success banner
 * - error: Red error banner with error message
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <UploadStatusMessages
 *   uploadStatus={uploadStatus}
 *   uploadError={uploadError}
 * />
 * ```
 */
export function UploadStatusMessages({
  uploadStatus,
  uploadError
}: UploadStatusMessagesProps): React.JSX.Element | null {
  if (!uploadStatus) return null;

  return (
    <>
      {/* Uploading Status */}
      {uploadStatus === 'uploading' && (
        <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-700 font-semibold">Uploading...</p>
        </div>
      )}

      {/* Success Status */}
      {uploadStatus === 'success' && (
        <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-700 font-semibold">✅ Upload successful!</p>
          <p className="text-sm text-green-600 mt-1">Asset added to library</p>
        </div>
      )}

      {/* Error Status */}
      {uploadStatus === 'error' && (
        <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 font-semibold">❌ Upload failed</p>
          <p className="text-sm text-red-600 mt-1">{uploadError}</p>
        </div>
      )}
    </>
  );
}
