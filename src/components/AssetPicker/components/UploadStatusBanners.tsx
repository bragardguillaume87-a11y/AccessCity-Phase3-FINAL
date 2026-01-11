import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ServerStatus } from '../hooks/useAssetUpload';

/**
 * Props for UploadStatusBanners component
 */
export interface UploadStatusBannersProps {
  /** Current server status */
  serverStatus: ServerStatus;
  /** Callback to retry server health check */
  onRetry: () => void;
}

/**
 * UploadStatusBanners - Display server health status alerts
 *
 * Shows different banners based on server status:
 * - checking: Blue banner with loading spinner
 * - online: Green success banner
 * - offline: Amber warning banner with retry button
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <UploadStatusBanners
 *   serverStatus={serverStatus}
 *   onRetry={checkServerHealth}
 * />
 * ```
 */
export function UploadStatusBanners({
  serverStatus,
  onRetry
}: UploadStatusBannersProps): React.JSX.Element | null {
  if (!serverStatus) return null;

  return (
    <>
      {/* Checking Status */}
      {serverStatus === 'checking' && (
        <Alert className="mb-4 bg-blue-900/20 border-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-blue-200 text-sm">
            Vérification du serveur d'upload...
          </AlertDescription>
        </Alert>
      )}

      {/* Offline Status */}
      {serverStatus === 'offline' && (
        <Alert variant="destructive" className="mb-4 bg-amber-900/20 border-amber-700">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-amber-800 font-semibold mb-1">Upload server not available</p>
              <p className="text-sm text-amber-700 mb-2">
                The upload feature requires the backend server to be running.
              </p>
              <div className="bg-amber-100 border border-amber-300 rounded p-3 mb-2">
                <p className="text-xs font-mono text-amber-900 mb-1">Please run:</p>
                <code className="text-xs bg-white px-2 py-1 rounded border border-amber-300 text-amber-900 block">
                  npm run dev
                </code>
              </div>
              <p className="text-xs text-amber-600">
                This starts Vite (port 5173) + upload server (port 3001).
              </p>
              <Button onClick={onRetry} className="mt-3 bg-amber-600 hover:bg-amber-700" size="sm">
                Réessayer
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Online Status */}
      {serverStatus === 'online' && (
        <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-green-700 font-medium">Upload server is online</p>
        </div>
      )}
    </>
  );
}
