import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageIcon, Users as UsersIcon, Palette, MapPin, Trash2, Eye } from 'lucide-react';
import type { Asset } from '@/types';

export interface SimpleAssetCardProps {
  asset: Asset;
  onClick: () => void;
  onDelete?: () => void;
  isSelectionMode?: boolean;
  onSelectBackground?: () => void;
}

/**
 * SimpleAssetCard - Carte d'asset avec actions visibles
 *
 * Design inspiré de Figma/Canva:
 * - Actions sous l'image (pas sur overlay)
 * - Lisibilité optimale
 * - Hover subtil sur l'image
 */
export function SimpleAssetCard({
  asset,
  onClick,
  onDelete,
  isSelectionMode = false,
  onSelectBackground
}: SimpleAssetCardProps) {
  const getCategoryIcon = () => {
    switch (asset.category) {
      case 'backgrounds': return <ImageIcon className="h-3 w-3" />;
      case 'characters': return <UsersIcon className="h-3 w-3" />;
      case 'illustrations': return <Palette className="h-3 w-3" />;
      default: return null;
    }
  };

  const handlePreview = () => {
    onClick();
  };

  const handleSelect = () => {
    if (onSelectBackground) {
      onSelectBackground();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      // The confirmation with usage warning is handled by the parent component
      onDelete();
    }
  };

  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10">
      {/* Image Container */}
      <div
        className="relative aspect-[4/3] bg-muted overflow-hidden cursor-pointer"
        onClick={isSelectionMode ? handleSelect : handlePreview}
      >
        <img
          src={asset.path}
          alt={asset.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23374151" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="14"%3EImage%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Category Badge - Top left - WCAG AA contrast compliant */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white border-0 text-xs font-medium shadow-sm"
        >
          {getCategoryIcon()}
          <span className="ml-1">{asset.category}</span>
        </Badge>

        {/* Selection Mode Overlay */}
        {isSelectionMode && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-medium">
              <MapPin className="h-4 w-4 mr-1.5" />
              Utiliser
            </Button>
          </div>
        )}
      </div>

      {/* Footer - Name + Actions */}
      <div className="p-2.5 space-y-2">
        <p className="text-xs font-semibold truncate text-foreground" title={asset.name}>
          {asset.name}
        </p>

        {/* Action Buttons - Always visible, not on overlay */}
        {!isSelectionMode && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 h-7 text-xs"
              onClick={handlePreview}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Voir
            </Button>
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
