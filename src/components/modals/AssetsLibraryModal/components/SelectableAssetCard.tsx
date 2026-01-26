import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageIcon, Users as UsersIcon, Palette } from 'lucide-react';
import type { Asset } from '@/types';

export interface SelectableAssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onToggle: () => void;
}

/**
 * SelectableAssetCard - Carte d'asset avec checkbox pour l'onglet Gestion
 *
 * Utilise un <label> wrapper pour que tout clic sur la carte
 * déclenche le checkbox sans conflit de propagation d'événements.
 */
export function SelectableAssetCard({
  asset,
  isSelected,
  onToggle
}: SelectableAssetCardProps) {
  const getCategoryIcon = () => {
    switch (asset.category) {
      case 'backgrounds': return <ImageIcon className="h-3 w-3" />;
      case 'characters': return <UsersIcon className="h-3 w-3" />;
      case 'illustrations': return <Palette className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <Card className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:ring-1 hover:ring-border'}`}>
      <label
        htmlFor={`select-asset-${asset.id}`}
        className="block cursor-pointer"
      >
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={asset.path}
            alt={asset.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23374151" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="14"%3EImage%3C/text%3E%3C/svg%3E';
            }}
          />

          {/* Checkbox - Position absolue en haut à gauche */}
          <div className="absolute top-2 left-2 bg-white rounded p-0.5 shadow">
            <Checkbox
              id={`select-asset-${asset.id}`}
              checked={isSelected}
              onCheckedChange={onToggle}
              className="h-5 w-5"
            />
          </div>

          {/* Category Badge - WCAG AA contrast compliant */}
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 backdrop-blur-md bg-black/80 text-white border-0 text-xs font-medium shadow-sm"
          >
            {getCategoryIcon()}
            <span className="ml-1">{asset.category}</span>
          </Badge>

          {/* Selection overlay */}
          {isSelected && (
            <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
          )}
        </div>

        <div className="p-2">
          <p className="text-xs font-semibold truncate text-foreground" title={asset.name}>
            {asset.name}
          </p>
        </div>
      </label>
    </Card>
  );
}
