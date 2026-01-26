import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, Image as ImageIcon, Sparkles, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssetUpload } from '../hooks/useAssetUpload';

// Audio categories for conditional icon rendering
const AUDIO_CATEGORIES = ['music', 'sfx', 'voices'];

/**
 * Props for UploadZone component
 */
export interface UploadZoneProps {
  /** Asset category for upload */
  category?: string;
  /** Compact mode (small button) vs full mode (large drop zone) */
  compact?: boolean;
}

/**
 * UploadZone - Drag & drop upload zone with gaming aesthetics
 *
 * Two display modes:
 * 1. **Compact mode** (for selection mode):
 *    - Small upload button
 *    - Minimal space usage
 *    - File input only (no drag & drop)
 *
 * 2. **Full mode** (for library mode):
 *    - Large drop zone with gradient border
 *    - Drag & drop support
 *    - Animated icon transitions
 *    - Progress indicator
 *    - Format hints
 *
 * Features:
 * - Multi-file support
 * - Image type filtering
 * - Visual drag feedback
 * - Upload progress tracking
 * - Automatic manifest reload on completion
 *
 * @example
 * ```tsx
 * // Compact mode
 * <UploadZone category="backgrounds" compact={true} />
 *
 * // Full mode
 * <UploadZone category="backgrounds" compact={false} />
 * ```
 */
export function UploadZone({ category = 'background', compact = false }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const { uploadFiles, isUploading, progress } = useAssetUpload({ category });

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    // Accept both images and audio files
    const validFiles = files.filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('audio/')
    );

    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  }, [uploadFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, [uploadFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragActive(false);
    }
  }, []);

  // Compact mode: Mini upload button (for selection mode)
  if (compact) {
    return (
      <div className="relative">
        <input
          type="file"
          multiple
          accept="image/*,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/flac"
          onChange={handleFileInput}
          className="hidden"
          id={`upload-input-${category}`}
        />
        <label htmlFor={`upload-input-${category}`}>
          <Button
            variant="gaming-accent"
            size="sm"
            className="cursor-pointer"
            asChild
          >
            <span>
              <Upload className="h-3 w-3" />
              Upload
            </span>
          </Button>
        </label>
      </div>
    );
  }

  // Full mode: Large drop zone (for library mode)
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-8 transition-all",
        "flex flex-col items-center justify-center gap-4",
        "hover:border-purple-500 hover:bg-purple-500/5",
        isDragActive && "border-cyan-400 bg-cyan-400/10 scale-[1.02]",
        isUploading && "opacity-50 pointer-events-none"
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {/* Icon with animation */}
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-purple-500 to-cyan-500",
          "transition-transform",
          isDragActive && "scale-110 rotate-6"
        )}
      >
        {isDragActive ? (
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        ) : AUDIO_CATEGORIES.includes(category) ? (
          <Music className="w-8 h-8 text-white" />
        ) : (
          <ImageIcon className="w-8 h-8 text-white" />
        )}
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-base font-semibold text-white">
          {isDragActive
            ? "Déposez vos fichiers ici !"
            : AUDIO_CATEGORIES.includes(category)
              ? "Glissez-déposez vos fichiers audio"
              : "Glissez-déposez vos images"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          ou cliquez pour parcourir
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2">
          {AUDIO_CATEGORIES.includes(category)
            ? "MP3, WAV, OGG, FLAC • Max 50MB par fichier"
            : "PNG, JPG, SVG, GIF, WebP • Max 10MB par fichier"}
        </p>
      </div>

      {/* Browse button */}
      <input
        type="file"
        multiple
        accept="image/*,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/flac"
        onChange={handleFileInput}
        className="hidden"
        id={`upload-input-full-${category}`}
      />
      <label htmlFor={`upload-input-full-${category}`}>
        <Button variant="gaming-primary" asChild className="cursor-pointer">
          <span>
            <Upload className="h-4 w-4" />
            Parcourir mes fichiers
          </span>
        </Button>
      </label>

      {/* Progress indicator if upload in progress */}
      {isUploading && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Upload en cours... {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
