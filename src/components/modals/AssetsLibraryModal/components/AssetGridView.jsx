import PropTypes from 'prop-types';
import { AssetCard } from './AssetCard.jsx';

/**
 * AssetGridView - Grid layout for assets
 *
 * Displays assets in a 5-column grid using AssetCard components
 *
 * @param {Object} props
 * @param {Array} props.assets - Array of assets to display
 * @param {Set} props.selectedAssets - Set of selected asset IDs
 * @param {Function} props.onToggleSelection - Toggle asset selection
 * @param {Function} props.onAssetClick - Asset click handler (lightbox)
 * @param {Function} props.isFavorite - Check if asset is favorite
 * @param {Function} props.onToggleFavorite - Toggle favorite
 * @param {Function} props.getAssetUsage - Get usage info for asset
 * @param {Map} props.assetTags - Map of asset IDs to tag sets
 * @param {Function} props.onAddTag - Add tag to asset
 * @param {Function} props.onRemoveTag - Remove tag from asset
 * @param {boolean} props.isSelectionMode - Whether in selection mode
 * @param {Function} props.onSelectBackground - Select background callback
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
}) {
  return (
    <div className="grid grid-cols-5 gap-6">
      {assets.map(asset => {
        const usage = getAssetUsage(asset.path);
        const tags = assetTags.get(asset.id) || new Set();
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

AssetGridView.propTypes = {
  assets: PropTypes.array.isRequired,
  selectedAssets: PropTypes.instanceOf(Set).isRequired,
  onToggleSelection: PropTypes.func.isRequired,
  onAssetClick: PropTypes.func.isRequired,
  isFavorite: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  getAssetUsage: PropTypes.func.isRequired,
  assetTags: PropTypes.instanceOf(Map).isRequired,
  onAddTag: PropTypes.func.isRequired,
  onRemoveTag: PropTypes.func.isRequired,
  isSelectionMode: PropTypes.bool.isRequired,
  onSelectBackground: PropTypes.func
};
