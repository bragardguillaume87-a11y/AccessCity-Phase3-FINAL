import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';
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
 * useAssetUpload - Manage asset upload and server health checking
 *
 * This hook centralizes all upload-related logic:
 * - Server health checking (checks if backend is running)
 * - File upload with FormData
 * - Upload status tracking (uploading/success/error)
 * - Automatic manifest reload after successful upload
 *
 * @param props - Configuration and callbacks
 * @returns Upload state and handlers
 *
 * @example
 * ```tsx
 * const { uploadStatus, serverStatus, handleFileUpload, checkServerHealth } = useAssetUpload({
 *   assetType: 'background',
 *   activeTab: 'upload',
 *   onAssetSelect: handleSelect,
 *   onReloadManifest: reloadManifest
 * });
 * ```
 */
export function useAssetUpload({
  assetType,
  activeTab,
  onAssetSelect,
  onReloadManifest
}: UseAssetUploadProps): UseAssetUploadReturn {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>(null);

  /**
   * Check if backend upload server is running
   */
  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    setServerStatus('checking');
    try {
      const response = await fetch(`${API.BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
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
   * Check server health when Upload tab is activated
   */
  useEffect(() => {
    if (activeTab === 'upload' && serverStatus === null) {
      checkServerHealth();
    }
  }, [activeTab, serverStatus, checkServerHealth]);

  /**
   * Upload file to backend server
   *
   * Flow:
   * 1. Validate file type (must be image)
   * 2. Check server health
   * 3. Upload via FormData POST request
   * 4. Select uploaded asset
   * 5. Reload manifest to refresh library
   *
   * @param file - File to upload
   */
  const handleFileUpload = useCallback(
    async (file: File): Promise<void> => {
      // Validate file type
      if (!file || !file.type.startsWith('image/')) {
        logger.warn('[useAssetUpload] Invalid file type:', file?.type);
        setUploadError('Invalid file type. Only images allowed.');
        setUploadStatus('error');
        return;
      }

      // Check server health before upload
      setUploadStatus('uploading');
      const isServerOnline = await checkServerHealth();

      if (!isServerOnline) {
        setUploadError(
          "Upload server is not running. Please start the server with 'npm run dev' (not 'npm run dev:vite')."
        );
        setUploadStatus('error');
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', assetType + 's'); // 'backgrounds', 'characters', 'illustrations'

      setUploadError(null);

      try {
        // Upload file
        const response = await fetch(`${API.BASE_URL}/api/assets/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();

        // Select the newly uploaded asset
        onAssetSelect(data.path);

        // Reload manifest to update library
        if (onReloadManifest) {
          setTimeout(() => onReloadManifest(), TIMING.DEBOUNCE_AUTOSAVE); // Small delay for manifest generation
        } else {
          // Fallback: reload page
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

  return {
    uploadStatus,
    uploadError,
    serverStatus,
    handleFileUpload,
    checkServerHealth
  };
}
