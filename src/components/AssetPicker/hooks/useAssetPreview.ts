import { useState } from 'react';

/**
 * Asset from useAssets hook (local interface)
 */
export interface Asset {
  name: string;
  path: string;
  category: string;
  type?: string;
  size?: number;
  [key: string]: unknown;
}

/**
 * Return type for useAssetPreview hook
 */
export interface UseAssetPreviewReturn {
  previewAsset: Asset | null;
  setPreviewAsset: React.Dispatch<React.SetStateAction<Asset | null>>;
}

/**
 * useAssetPreview - Manage asset preview state
 *
 * This hook provides simple state management for the asset preview panel.
 * When a user hovers over an asset thumbnail, this hook tracks which asset
 * should be displayed in the preview panel.
 *
 * @returns Preview state and setter
 *
 * @example
 * ```tsx
 * const { previewAsset, setPreviewAsset } = useAssetPreview();
 *
 * // In thumbnail hover handler
 * <AssetThumbnail
 *   onHover={() => setPreviewAsset(asset)}
 * />
 *
 * // In preview panel
 * {previewAsset && <AssetPreviewPanel asset={previewAsset} />}
 * ```
 */
export function useAssetPreview(): UseAssetPreviewReturn {
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  return {
    previewAsset,
    setPreviewAsset
  };
}
