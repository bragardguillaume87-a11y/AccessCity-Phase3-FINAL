import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '../../../../utils/logger';
import { isTauriEditor, convertFileSrcIfNeeded } from '../../../../utils/tauri';
import { API } from '@/config/constants';
import { TIMING } from '@/config/timing';

/**
 * Uploaded file result
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
  /** Asset category (backgrounds, characters, illustrations) */
  category?: string;
  /** Callback after upload completes successfully */
  onUploadComplete?: (files: UploadedFile[]) => void;
}

/**
 * Return value of useAssetUpload hook
 */
export interface UseAssetUploadReturn {
  /** Upload files */
  uploadFiles: (files: File[]) => Promise<void>;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Upload progress (0-100) */
  progress: number;
  /** Array of successfully uploaded files */
  uploadedAssets: UploadedFile[];
}

/**
 * Hook for managing asset uploads with progress tracking and celebrations.
 *
 * Supports two backends :
 *  - Web  : POST to Express server (localhost:3001/api/assets/upload)
 *  - Tauri: invoke('upload_asset_editor') with raw bytes
 */
export function useAssetUpload({
  category = 'backgrounds',
  onUploadComplete,
}: UseAssetUploadOptions = {}): UseAssetUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedFile[]>([]);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    try {
      let uploaded: UploadedFile[];

      if (isTauriEditor()) {
        // ── Tauri mode : invoke Rust command per file ─────────────────────
        uploaded = [];
        const total = files.length;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Read file as bytes
          const buffer = await file.arrayBuffer();
          const data = Array.from(new Uint8Array(buffer));

          setProgress(Math.round(((i + 0.5) / total) * 100));

          const absolutePath = await invoke<string>('upload_asset_editor', {
            filename: file.name,
            category,
            data,
          });

          uploaded.push({
            filename: file.name,
            // convertFileSrcIfNeeded pour l'affichage, path absolu pour les ops
            path: convertFileSrcIfNeeded(absolutePath),
            size: file.size,
            category,
          });

          setProgress(Math.round(((i + 1) / total) * 100));
        }
      } else {
        // ── Web mode : FormData POST to Express server ────────────────────
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) { clearInterval(progressInterval); return 90; }
            return prev + 10;
          });
        }, 200);

        const formData = new FormData();
        formData.append('category', category);
        files.forEach(file => formData.append('files', file));

        const response = await fetch(`${API.BASE_URL}/api/assets/upload`, {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);

        const result = await response.json();
        uploaded = result.files || [];
      }

      setUploadedAssets(uploaded);

      // Success toast
      toast.success(`${uploaded.length} fichier(s) uploadé(s) !`, {
        description: uploaded.map(f => f.filename).join(', '),
        duration: TIMING.TOAST_DURATION_LONG,
        action: {
          label: 'Annuler',
          onClick: () => toast.info('Undo non implémenté'),
        },
      });

      // Celebration animation
      const isFirstUpload = localStorage.getItem('hasUploadedAsset') !== 'true';
      if (isFirstUpload || uploaded.length >= 5) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#06b6d4', '#ec4899'],
        });
        if (isFirstUpload) localStorage.setItem('hasUploadedAsset', 'true');
      }

      if (onUploadComplete) onUploadComplete(uploaded);

      // Reload manifest
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('asset-manifest-updated'));
      }, TIMING.LOADING_MIN_DISPLAY);

    } catch (error) {
      logger.error('Upload error:', error);
      toast.error("Erreur lors de l'upload", {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), TIMING.DEBOUNCE_AUTOSAVE);
    }
  }, [category, onUploadComplete]);

  return { uploadFiles, isUploading, progress, uploadedAssets };
}
