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
  AlertCircle,
  MapPin,
  Sparkles,
  Star,
  X,
  Tag,
  Eye
} from 'lucide-react';

/**
 * AssetCard - Individual asset card for grid view
 *
 * Displays an asset with:
 * - Image preview with hover zoom
 * - Checkbox for selection
 * - Favorite star toggle
 * - Usage badge
 * - Category badge
 * - Tags management
 * - Click to open lightbox or select background
 *
 * @param {Object} props
 * @param {Object} props.asset - Asset object
 * @param {boolean} props.isSelected - Whether asset is selected
 * @param {Function} props.onToggleSelection - Toggle selection callback
 * @param {Function} props.onClick - Click asset callback (lightbox)
 * @param {boolean} props.isFavorite - Whether asset is favorite
 * @param {Function} props.onToggleFavorite - Toggle favorite callback
 * @param {Object} props.usage - Usage info { total, scenes, characters, sceneCount, characterCount }
 * @param {Set} props.tags - Set of tags for this asset
 * @param {Function} props.onAddTag - Add tag callback
 * @param {Function} props.onRemoveTag - Remove tag callback
 * @param {boolean} props.isSelectionMode - Whether in selection mode
 * @param {Function} props.onSelectBackground - Select background callback (selection mode only)
 */
export function AssetCard({
  asset,
  isSelected,
  onToggleSelection,
  onClick,
  isFavorite,
  onToggleFavorite,
  usage,
  tags,
  onAddTag,
  onRemoveTag,
  isSelectionMode,
  onSelectBackground
}) {
  const isUsed = usage !== null;

  return (
    <Card
      className={`group cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={(e) => {
        if (!e.target.closest('.checkbox-wrapper') && !e.target.closest('.tag-input-wrapper')) {
          onClick(asset);
        }
      }}
    >
      {/* Image Preview */}
      <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
        <img
          src={asset.path}
          alt={asset.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e2e8f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="16"%3EImage%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Checkbox */}
        <div className="absolute top-2 left-2 checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="bg-white border-2"
          />
        </div>

        {/* Favorite Star Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isFavorite
              ? 'bg-amber-500 text-white scale-110'
              : 'bg-slate-800/80 text-slate-300 hover:bg-amber-500 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Overlay - Always visible in selection mode */}
        <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center ${
          isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className="flex gap-2">
            {isSelectionMode && asset.category === 'backgrounds' ? (
              <Button
                size={isSelectionMode ? "default" : "sm"}
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBackground(asset.path);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Utiliser
              </Button>
            ) : (
              <Button size="sm" variant="secondary">
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </Button>
            )}
          </div>
        </div>

        {/* Usage Badge */}
        {isUsed && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="backdrop-blur-sm bg-green-600">
              <Sparkles className="h-3 w-3 mr-1" />
              Utilisé ({usage.total})
            </Badge>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="backdrop-blur-sm">
            {asset.category === 'backgrounds' && <ImageIcon className="h-3 w-3 mr-1" />}
            {asset.category === 'characters' && <UsersIcon className="h-3 w-3 mr-1" />}
            {asset.category === 'illustrations' && <Palette className="h-3 w-3 mr-1" />}
            {asset.category}
          </Badge>
        </div>
      </div>

      {/* Info Section */}
      <CardContent className="p-4">
        <p className="font-semibold text-sm truncate mb-2" title={asset.name}>
          {asset.name}
        </p>

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
                  onRemoveTag(tag);
                }}
              >
                <Tag className="h-2 w-2 mr-1" />
                {tag}
                <X className="h-2 w-2 ml-1" />
              </Badge>
            ))}
          </div>
        )}

        {/* Add Tag Input */}
        <div className="tag-input-wrapper mb-2" onClick={(e) => e.stopPropagation()}>
          <Input
            type="text"
            placeholder="+ tag"
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                onAddTag(e.target.value);
                e.target.value = '';
              }
            }}
          />
        </div>

        {/* Usage Details */}
        {isUsed && (
          <div className="space-y-1">
            {usage.sceneCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{usage.sceneCount} scène{usage.sceneCount > 1 ? 's' : ''}</span>
              </div>
            )}
            {usage.characterCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UsersIcon className="h-3 w-3" />
                <span>{usage.characterCount} personnage{usage.characterCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}

        {!isUsed && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Non utilisé
          </p>
        )}
      </CardContent>
    </Card>
  );
}

AssetCard.propTypes = {
  asset: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggleSelection: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  usage: PropTypes.shape({
    total: PropTypes.number.isRequired,
    scenes: PropTypes.array.isRequired,
    characters: PropTypes.array.isRequired,
    sceneCount: PropTypes.number.isRequired,
    characterCount: PropTypes.number.isRequired
  }),
  tags: PropTypes.instanceOf(Set).isRequired,
  onAddTag: PropTypes.func.isRequired,
  onRemoveTag: PropTypes.func.isRequired,
  isSelectionMode: PropTypes.bool.isRequired,
  onSelectBackground: PropTypes.func
};
