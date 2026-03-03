import { memo, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageIcon, Users as UsersIcon, Palette, MapPin, Trash2, Eye, Pencil } from 'lucide-react';
import type { Asset } from '@/types';

export interface SimpleAssetCardProps {
  asset: Asset;
  onClick: () => void;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
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
  onRename,
  isSelectionMode = false,
  onSelectBackground
}: SimpleAssetCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameDraft(asset.name);
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const confirmRename = () => {
    if (renameDraft.trim() && renameDraft.trim() !== asset.name) {
      onRename?.(renameDraft.trim());
    }
    setIsRenaming(false);
  };

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
          src={asset.url ?? asset.path}
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
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameDraft}
            onChange={e => setRenameDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            onBlur={confirmRename}
            onClick={e => e.stopPropagation()}
            className="w-full text-xs bg-slate-700 border border-primary rounded px-1.5 py-0.5 text-white outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1 min-w-0 group/name">
            <p className="text-xs font-semibold truncate text-foreground flex-1" title={asset.name}>
              {asset.name}
            </p>
            {onRename && !isSelectionMode && (
              <button
                onClick={startRename}
                className="opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0 text-slate-500 hover:text-slate-200 p-0.5 rounded"
                title="Renommer"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

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

export default memo(SimpleAssetCard);
