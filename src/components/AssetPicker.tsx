import React, { useState, useCallback } from 'react';
import { useAssets, getRecentAssets, addToRecentAssets } from '@/hooks/useAssets';
import { toAbsoluteAssetPath } from '@/utils/pathUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Upload as UploadIcon, Link as LinkIcon } from 'lucide-react';

// Hooks
import { useAssetUpload } from './AssetPicker/hooks/useAssetUpload';
import { useDragAndDrop } from './AssetPicker/hooks/useDragAndDrop';
import { useAssetPreview } from './AssetPicker/hooks/useAssetPreview';

// Components
import { UploadStatusBanners } from './AssetPicker/components/UploadStatusBanners';
import { UploadStatusMessages } from './AssetPicker/components/UploadStatusMessages';
import { UploadDropZone } from './AssetPicker/components/UploadDropZone';
import { AssetLibraryGrid } from './AssetPicker/components/AssetLibraryGrid';
import { AssetPreviewPanel } from './AssetPicker/components/AssetPreviewPanel';

/**
 * Asset type for picker
 */
type AssetType = 'background' | 'character' | 'illustration' | 'prop';

/**
 * Props for AssetPicker component
 */
interface AssetPickerProps {
  /** Type of asset to pick (backgrounds, characters, etc.) */
  type?: AssetType;
  /** Current asset value/path */
  value?: string;
  /** Callback when asset is selected */
  onChange: (assetPath: string) => void;
  /** Allow file upload functionality */
  allowUpload?: boolean;
  /** Allow URL input functionality */
  allowUrl?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AssetPicker - Component for selecting assets with 3 modes
 * - Library: Grid of assets from manifest
 * - Upload: Drag & drop + file picker
 * - URL: Manual URL input
 *
 * Refactored to use custom hooks and sub-components for better maintainability.
 */
export default function AssetPicker({
  type = 'background',
  value = '',
  onChange,
  allowUpload = true,
  allowUrl = true,
  className = ''
}: AssetPickerProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState('library');

  // Asset library hook
  const { assets, loading, error, reloadManifest } = useAssets({
    category: type + 's'
  });
  const recentAssets = getRecentAssets(type);

  /**
   * Handle asset selection - Convert to absolute path and add to recent
   */
  const handleSelect = useCallback(
    (assetPath: string): void => {
      const absPath = toAbsoluteAssetPath(assetPath);
      onChange(absPath);
      addToRecentAssets(type, absPath);
    },
    [onChange, type]
  );

  // Upload hook (server health + file upload logic)
  const upload = useAssetUpload({
    assetType: type,
    activeTab,
    onAssetSelect: handleSelect,
    onReloadManifest: reloadManifest
  });

  // Drag & Drop hook
  const dragDrop = useDragAndDrop({
    onFileDrop: upload.handleFileUpload
  });

  // Preview hook
  const { previewAsset, setPreviewAsset } = useAssetPreview();

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs Header */}
        <TabsList className="w-full bg-slate-800 border-b border-slate-700 rounded-none justify-start p-2">
          <TabsTrigger
            value="library"
            className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Package className="h-4 w-4" />
            Bibliothèque
          </TabsTrigger>
          {allowUpload && (
            <TabsTrigger
              value="upload"
              className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <UploadIcon className="h-4 w-4" />
              Upload
            </TabsTrigger>
          )}
          {allowUrl && (
            <TabsTrigger
              value="url"
              className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
          )}
        </TabsList>

        {/* Library Tab */}
        <TabsContent value="library" className="p-4 m-0 min-h-[300px]">
          <AssetLibraryGrid
            assets={assets}
            loading={loading}
            error={error}
            selectedValue={value}
            recentAssets={recentAssets}
            assetType={type}
            onSelect={handleSelect}
            onHover={setPreviewAsset}
          />
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="p-4 m-0 min-h-[300px]">
          {/* Server Status Banners */}
          <UploadStatusBanners
            serverStatus={upload.serverStatus}
            onRetry={upload.checkServerHealth}
          />

          {/* Upload Status Messages */}
          <UploadStatusMessages
            uploadStatus={upload.uploadStatus}
            uploadError={upload.uploadError}
          />

          {/* Upload Drop Zone */}
          <UploadDropZone
            dragActive={dragDrop.dragActive}
            uploadStatus={upload.uploadStatus}
            serverStatus={upload.serverStatus}
            onDragEnter={dragDrop.handleDragEnter}
            onDragLeave={dragDrop.handleDragLeave}
            onDragOver={dragDrop.handleDragOver}
            onDrop={dragDrop.handleDrop}
            onFileSelect={upload.handleFileUpload}
          />
        </TabsContent>

        {/* URL Tab */}
        <TabsContent value="url" className="p-4 m-0 min-h-[300px]">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            URL de l'image
          </label>
          <Input
            type="url"
            className="w-full bg-slate-800 border-slate-700 text-slate-100"
            placeholder="https://example.com/image.jpg"
            defaultValue={value}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleSelect(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-2">
            Entrez l'URL complète d'une image hébergée en ligne
          </p>
          <Alert className="mt-4 bg-blue-900/20 border-blue-800">
            <AlertDescription className="text-sm text-blue-200">
              💡 <strong>Astuce :</strong> Vous pouvez aussi utiliser des chemins relatifs comme
              <code className="bg-slate-800 px-2 py-1 rounded ml-1 text-slate-300 border border-slate-700">
                /assets/backgrounds/custom.jpg
              </code>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Preview Panel */}
      <AssetPreviewPanel previewAsset={previewAsset} selectedValue={value} />
    </div>
  );
}
