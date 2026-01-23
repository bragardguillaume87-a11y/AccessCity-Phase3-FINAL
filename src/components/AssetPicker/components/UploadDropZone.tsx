import React, { useRef } from 'react';
import type { UploadStatus, ServerStatus } from '../hooks/useAssetUpload';

/**
 * Props for UploadDropZone component
 */
export interface UploadDropZoneProps {
  /** Whether drag is currently active */
  dragActive: boolean;
  /** Current upload status */
  uploadStatus: UploadStatus;
  /** Current server status */
  serverStatus: ServerStatus;
  /** Drag enter handler */
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Drag leave handler */
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Drag over handler */
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Drop handler */
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  /** File upload handler */
  onFileSelect: (file: File) => void;
}

/**
 * UploadDropZone - Drag & drop zone for file uploads
 *
 * Features:
 * - Drag and drop file upload
 * - Click to browse files
 * - Visual feedback during drag
 * - Disabled state during upload or when server is offline
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <UploadDropZone
 *   dragActive={dragActive}
 *   uploadStatus={uploadStatus}
 *   serverStatus={serverStatus}
 *   onDragEnter={handleDragEnter}
 *   onDragLeave={handleDragLeave}
 *   onDragOver={handleDragOver}
 *   onDrop={handleDrop}
 *   onFileSelect={handleFileUpload}
 * />
 * ```
 */
export function UploadDropZone({
  dragActive,
  uploadStatus,
  serverStatus,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect
}: UploadDropZoneProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = uploadStatus === 'uploading' || serverStatus === 'offline';

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        dragActive
          ? 'border-blue-500 bg-blue-50 scale-[1.02]'
          : 'border-border bg-card hover:border-border'
      } ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <svg
        className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="font-semibold text-foreground mb-2">Glissez une image ici</p>
      <p className="text-sm text-muted-foreground mb-4">ou cliquez pour parcourir</p>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isDisabled}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Choisir un fichier
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          e.target.files?.[0] && onFileSelect(e.target.files[0])
        }
        className="hidden"
      />
      <p className="text-xs text-muted-foreground mt-4">Formats supportes : JPG, PNG, SVG, GIF, WebP</p>
      <p className="text-xs text-green-600 mt-1 font-medium">
        ✨ Uploaded to /public/assets - Max 10MB
      </p>
    </div>
  );
}
