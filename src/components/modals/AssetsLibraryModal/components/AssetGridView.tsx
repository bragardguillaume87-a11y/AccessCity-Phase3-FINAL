import { AssetCard } from './AssetCard';
import type { Asset, AssetUsageInfo } from '@/types';

/**
 * Props for AssetGridView component
 */
export interface AssetGridViewProps {
  /** Array of assets to display */
  assets: Asset[];
  /** Set of selected asset IDs */
  selectedAssets: Set<string>;
  /** Toggle asset selection */
  onToggleSelection: (assetId: string) => void;
  /** Asset click handler (lightbox) */
  onAssetClick: (asset: Asset) => void;
  /** Check if asset is favorite */
  isFavorite: (assetPath: string) => boolean;
  /** Toggle favorite */
  onToggleFavorite: (assetPath: string) => void;
  /** Get usage info for asset */
  getAssetUsage: (assetPath: string) => AssetUsageInfo | null;
  /** Map of asset IDs to tag sets */
  assetTags: Map<string, Set<string>>;
  /** Add tag to asset */
  onAddTag: (assetId: string, tag: string) => void;
  /** Remove tag from asset */
  onRemoveTag: (assetId: string, tag: string) => void;
  /** Whether in selection mode */
  isSelectionMode: boolean;
  /** Select background callback */
  onSelectBackground?: (assetPath: string) => void;
}

/**
 * AssetGridView - Grid layout for assets
 *
 * Displays assets in a 5-column responsive grid using AssetCard components.
 * Each card shows preview, metadata, tags, and usage information.
 *
 * Grid automatically adjusts to available space while maintaining
 * a maximum of 5 columns for optimal visual density.
 *
 * @example
 * ```tsx
 * <AssetGridView
 *   assets={filteredAssets}
 *   selectedAssets={selectedAssets}
 *   onToggleSelection={toggleAssetSelection}
 *   onAssetClick={setLightboxAsset}
 *   isFavorite={isFavorite}
 *   onToggleFavorite={toggleFavorite}
 *   getAssetUsage={(path) => getAssetUsageInfo(path, assetUsage)}
 *   assetTags={assetTags}
 *   onAddTag={addTagToAsset}
 *   onRemoveTag={removeTagFromAsset}
 *   isSelectionMode={false}
 * />
 * ```
 */
export function AssetGridView({
  assets,
  selectedAssets,
  onToggleSelection,
  onAssetClick,
  isFavorite,
  onToggleFavorite,
  getAssetUsage,
  assetTags,
  onAddTag,
  onRemoveTag,
  isSelectionMode,
  onSelectBackground
}: AssetGridViewProps) {
  return (
    <div className="grid grid-cols-5 gap-6">
      {assets.map(asset => {
        const usage = getAssetUsage(asset.path);
        const tags = assetTags.get(asset.id) || new Set<string>();
        const isSelected = selectedAssets.has(asset.id);

        return (
          <AssetCard
            key={asset.id}
            asset={asset}
            isSelected={isSelected}
            onToggleSelection={() => onToggleSelection(asset.id)}
            onClick={onAssetClick}
            isFavorite={isFavorite(asset.path)}
            onToggleFavorite={() => onToggleFavorite(asset.path)}
            usage={usage}
            tags={tags}
            onAddTag={(tag) => onAddTag(asset.id, tag)}
            onRemoveTag={(tag) => onRemoveTag(asset.id, tag)}
            isSelectionMode={isSelectionMode}
            onSelectBackground={onSelectBackground}
          />
        );
      })}
    </div>
  );
}
