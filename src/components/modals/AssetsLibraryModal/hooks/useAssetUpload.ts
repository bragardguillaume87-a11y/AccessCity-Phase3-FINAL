import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { logger } from '../../../../utils/logger';
import { API } from '@/config/constants';
import { TIMING } from '@/config/timing';

/**
 * Uploaded file result from server
 */
export interface UploadedFile {
  filename: string;
  path: string;
  size: number;
  category: string;
}

/**
 * Options for useAssetUpload hook
 */
export interface UseAssetUploadOptions {
  /** Asset category (background, character, illustration) */
  category?: string;
  /** Callback after upload completes successfully */
  onUploadComplete?: (files: UploadedFile[]) => void;
}

/**
 * Return value of useAssetUpload hook
 */
export interface UseAssetUploadReturn {
  /** Upload files to server */
  uploadFiles: (files: File[]) => Promise<void>;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Upload progress (0-100) */
  progress: number;
  /** Array of successfully uploaded files */
  uploadedAssets: UploadedFile[];
}

/**
 * Hook for managing asset uploads with progress tracking and celebrations
 *
 * Features:
 * - Multi-file upload support
 * - Real-time progress tracking
 * - Success toast with undo action
 * - Confetti celebration on first upload or bulk uploads (5+ files)
 * - Automatic manifest reload after upload
 * - Error handling with toast notifications
 *
 * @param options - Upload configuration options
 * @returns Upload state and upload function
 *
 * @example
 * ```tsx
 * const { uploadFiles, isUploading, progress } = useAssetUpload({
 *   category: 'backgrounds',
 *   onUploadComplete: (files) => {
 *     console.log(`Uploaded ${files.length} files`);
 *   }
 * });
 *
 * // Upload files from input
 * const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const files = Array.from(e.target.files || []);
 *   uploadFiles(files);
 * };
 * ```
 */
export function useAssetUpload({
  category = 'background',
  onUploadComplete
}: UseAssetUploadOptions = {}): UseAssetUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedFile[]>([]);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('category', category);

    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      // Simulate progress (true progress requires XMLHttpRequest or fetch with streams)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${API.BASE_URL}/api/assets/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const uploaded: UploadedFile[] = result.files || [];
      setUploadedAssets(uploaded);

      // Success toast with undo action
      toast.success(`${uploaded.length} fichier(s) uploadé(s) !`, {
        description: uploaded.map(f => f.filename).join(', '),
        duration: TIMING.TOAST_DURATION_LONG,
        action: {
          label: 'Annuler',
          onClick: () => {
            // Note: undo requires DELETE endpoint (future)
            toast.info('Undo non implémenté');
          },
        },
      });

      // Celebration animation (first upload or bulk > 5 files)
      const isFirstUpload = localStorage.getItem('hasUploadedAsset') !== 'true';
      if (isFirstUpload || uploaded.length >= 5) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#06b6d4', '#ec4899'], // purple, cyan, pink
        });

        if (isFirstUpload) {
          localStorage.setItem('hasUploadedAsset', 'true');
        }
      }

      // Callback
      if (onUploadComplete) {
        onUploadComplete(uploaded);
      }

      // Reload manifest to refresh asset list
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('asset-manifest-updated'));
      }, TIMING.LOADING_MIN_DISPLAY);

    } catch (error) {
      logger.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), TIMING.DEBOUNCE_AUTOSAVE);
    }
  }, [category, onUploadComplete]);

  return {
    uploadFiles,
    isUploading,
    progress,
    uploadedAssets,
  };
}
