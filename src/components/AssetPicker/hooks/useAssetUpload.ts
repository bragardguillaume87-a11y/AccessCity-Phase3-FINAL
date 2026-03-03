import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '@/utils/logger';
import { isTauriEditor, convertFileSrcIfNeeded } from '@/utils/tauri';
import { API } from '@/config/constants';
import { TIMING } from '@/config/timing';

/**
 * Upload status states
 */
export type UploadStatus = null | 'uploading' | 'success' | 'error';

/**
 * Server health status states
 */
export type ServerStatus = null | 'checking' | 'online' | 'offline';

/**
 * Props for useAssetUpload hook
 */
export interface UseAssetUploadProps {
  /** Asset type (background, character, etc.) */
  assetType: string;
  /** Active tab name */
  activeTab: string;
  /** Callback when asset is selected */
  onAssetSelect: (assetPath: string) => void;
  /** Callback to reload asset manifest */
  onReloadManifest?: () => void;
}

/**
 * Return type for useAssetUpload hook
 */
export interface UseAssetUploadReturn {
  uploadStatus: UploadStatus;
  uploadError: string | null;
  serverStatus: ServerStatus;
  handleFileUpload: (file: File) => Promise<void>;
  checkServerHealth: () => Promise<boolean>;
}

/**
 * useAssetUpload - Manage single-file asset upload.
 *
 * Supports two backends :
 *  - Web  : FormData POST to Express server (localhost:3001)
 *  - Tauri: invoke('upload_asset_editor') with raw bytes (no server needed)
 */
export function useAssetUpload({
  assetType,
  activeTab,
  onAssetSelect,
  onReloadManifest,
}: UseAssetUploadProps): UseAssetUploadReturn {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>(null);

  /**
   * Check if backend upload server is running.
   * En mode Tauri, toujours "online" (pas de serveur requis).
   */
  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    if (isTauriEditor()) {
      setServerStatus('online');
      return true;
    }

    setServerStatus('checking');
    try {
      const response = await fetch(`${API.BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setServerStatus('online');
        return true;
      } else {
        setServerStatus('offline');
        logger.warn('[useAssetUpload] Server returned non-200 status');
        return false;
      }
    } catch (error) {
      setServerStatus('offline');
      logger.error('[useAssetUpload] Server health check failed:', error);
      return false;
    }
  }, []);

  /**
   * Check server health when Upload tab is activated.
   * En mode Tauri, marque directement online.
   */
  useEffect(() => {
    if (activeTab === 'upload' && serverStatus === null) {
      checkServerHealth();
    }
  }, [activeTab, serverStatus, checkServerHealth]);

  /**
   * Upload a single file.
   *
   * En mode Tauri : lit le fichier en bytes et invoque upload_asset_editor.
   * En mode web   : envoie le fichier via FormData POST.
   */
  const handleFileUpload = useCallback(
    async (file: File): Promise<void> => {
      if (!file || !file.type.startsWith('image/')) {
        logger.warn('[useAssetUpload] Invalid file type:', file?.type);
        setUploadError('Invalid file type. Only images allowed.');
        setUploadStatus('error');
        return;
      }

      setUploadStatus('uploading');
      setUploadError(null);

      try {
        if (isTauriEditor()) {
          // ── Tauri mode : invoke Rust command ──────────────────────────
          const buffer = await file.arrayBuffer();
          const data = Array.from(new Uint8Array(buffer));
          const category = assetType + 's'; // 'backgrounds', 'characters', etc.

          const absolutePath = await invoke<string>('upload_asset_editor', {
            filename: file.name,
            category,
            data,
          });

          // Retourner l'URL display-ready pour sélectionner l'asset
          onAssetSelect(convertFileSrcIfNeeded(absolutePath));
        } else {
          // ── Web mode : FormData POST to Express server ─────────────────
          const isServerOnline = await checkServerHealth();
          if (!isServerOnline) {
            setUploadError(
              "Upload server is not running. Please start the server with 'npm run dev' (not 'npm run dev:vite')."
            );
            setUploadStatus('error');
            return;
          }

          const formData = new FormData();
          formData.append('file', file);
          formData.append('category', assetType + 's');

          const response = await fetch(`${API.BASE_URL}/api/assets/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const data = await response.json();
          onAssetSelect(data.path);
        }

        // Reload manifest to update library
        if (onReloadManifest) {
          setTimeout(() => onReloadManifest(), TIMING.DEBOUNCE_AUTOSAVE);
        } else {
          setTimeout(() => window.location.reload(), TIMING.UPLOAD_RELOAD_DELAY);
        }

        setUploadStatus('success');
      } catch (error) {
        logger.error('[useAssetUpload] Upload error:', error);
        setUploadError((error as Error).message);
        setUploadStatus('error');
      }
    },
    [assetType, onAssetSelect, onReloadManifest, checkServerHealth]
  );

  return { uploadStatus, uploadError, serverStatus, handleFileUpload, checkServerHealth };
}
