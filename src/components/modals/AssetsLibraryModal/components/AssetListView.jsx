import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ImageIcon,
  Users as UsersIcon,
  Palette,
  MapPin,
  Sparkles,
  X,
  Tag,
  Eye
} from 'lucide-react';

/**
 * AssetListView - List layout for assets
 *
 * Displays assets in a compact list view with horizontal layout
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
export function AssetListView({
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
    <div className="space-y-2">
      {assets.map(asset => {
        const usage = getAssetUsage(asset.path);
        const isUsed = usage !== null;
        const tags = assetTags.get(asset.id) || new Set();
        const isSelected = selectedAssets.has(asset.id);

        return (
          <Card
            key={asset.id}
            className={`cursor-pointer hover:shadow-lg transition-all ${
              isSelected ? 'ring-2 ring-primary' : ''
            }`}
            onClick={(e) => {
              if (!e.target.closest('.checkbox-wrapper') && !e.target.closest('.tag-input-wrapper')) {
                onAssetClick(asset);
              }
            }}
          >
            <CardContent className="p-4 flex items-center gap-4">
              {/* Checkbox */}
              <div className="checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(asset.id)}
                />
              </div>

              {/* Thumbnail */}
              <div className="w-20 h-20 rounded overflow-hidden bg-gradient-to-br from-muted/50 to-muted flex-shrink-0">
                <img
                  src={asset.path}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e2e8f0" width="80" height="80"/%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold truncate">{asset.name}</p>

                  {/* Category Badge */}
                  <Badge variant="secondary">
                    {asset.category === 'backgrounds' && <ImageIcon className="h-3 w-3 mr-1" />}
                    {asset.category === 'characters' && <UsersIcon className="h-3 w-3 mr-1" />}
                    {asset.category === 'illustrations' && <Palette className="h-3 w-3 mr-1" />}
                    {asset.category}
                  </Badge>

                  {/* Usage Badge */}
                  {isUsed && (
                    <Badge variant="default" className="bg-green-600">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Utilisé ({usage.total})
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {tags.size > 0 && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {Array.from(tags).map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTag(asset.id, tag);
                        }}
                      >
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                        <X className="h-2 w-2 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Usage Details */}
                {isUsed && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {usage.sceneCount > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {usage.sceneCount} scène{usage.sceneCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {usage.characterCount > 0 && (
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {usage.characterCount} personnage{usage.characterCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Add Tag Input */}
              <div className="tag-input-wrapper w-32" onClick={(e) => e.stopPropagation()}>
                <Input
                  type="text"
                  placeholder="+ tag"
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      onAddTag(asset.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              {/* View/Select Button */}
              {isSelectionMode && asset.category === 'backgrounds' ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBackground(asset.path);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Utiliser
                </Button>
              ) : (
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

AssetListView.propTypes = {
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
