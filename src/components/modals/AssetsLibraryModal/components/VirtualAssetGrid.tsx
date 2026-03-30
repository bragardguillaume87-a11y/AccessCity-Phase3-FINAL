import { useRef, useMemo, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleAssetCard } from './SimpleAssetCard';
import { AudioAssetCard } from './AudioAssetCard';
import type { Asset } from '@/types';

const COLUMNS = 5;
/** Hauteur estimée par rangée — AudioAssetCard est plus haute que SimpleAssetCard */
const ROW_HEIGHT_PX = 220;
const GAP_PX = 16;
const PADDING_PX = 24; // p-6

const AUDIO_CATEGORIES = ['music', 'sfx', 'voices', 'atmosphere'];

interface VirtualAssetGridProps {
  assets: Asset[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAssetClick: (asset: Asset) => void;
  onAssetDelete?: (path: string, name?: string) => void;
  onRenameAsset?: (assetPath: string, displayName: string) => void;
  isSelectionMode: boolean;
  onSelectBackground?: (url: string) => void;
}

/**
 * VirtualAssetGrid — Grille virtualisée via TanStack Virtual v3.
 *
 * Regroupe les assets en rangées de COLUMNS éléments et ne rend
 * que les rangées visibles dans le viewport. Supporte 500+ assets
 * sans dégradation des performances.
 *
 * ⚠️ Scroll container natif (pas ScrollArea) — requis pour useVirtualizer.
 */
export function VirtualAssetGrid({
  assets,
  loading,
  searchQuery,
  onSearchChange,
  onAssetClick,
  onAssetDelete,
  onRenameAsset,
  isSelectionMode,
  onSelectBackground,
}: VirtualAssetGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Grouper les assets en rangées de COLUMNS éléments
  const rows = useMemo(() => {
    const result: Asset[][] = [];
    for (let i = 0; i < assets.length; i += COLUMNS) {
      result.push(assets.slice(i, i + COLUMNS));
    }
    return result;
  }, [assets]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX + GAP_PX,
    overscan: 3,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 flex-1">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground flex-1">
        <Package className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">
          {searchQuery ? 'Aucun résultat' : 'Aucun asset dans cette catégorie'}
        </p>
        {searchQuery && (
          <Button variant="link" size="sm" onClick={() => onSearchChange('')}>
            Effacer la recherche
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 min-h-0 overflow-y-auto"
      style={{ willChange: 'transform' }}
    >
      {/* Conteneur total — hauteur calculée par le virtualizer */}
      <div
        style={{
          height: rowVirtualizer.getTotalSize() + PADDING_PX * 2,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: PADDING_PX + virtualRow.start,
              left: PADDING_PX,
              right: PADDING_PX,
              display: 'grid',
              gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
              gap: `${GAP_PX}px`,
            }}
          >
            {rows[virtualRow.index].map((asset) => {
              if (AUDIO_CATEGORIES.includes(asset.category)) {
                return (
                  <AudioAssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={() => onAssetClick(asset)}
                    onDelete={onAssetDelete && !isSelectionMode
                      ? () => onAssetDelete(asset.path, asset.name)
                      : undefined}
                    onRename={onRenameAsset
                      ? (name) => onRenameAsset(asset.path, name)
                      : undefined}
                    isSelectionMode={isSelectionMode}
                    onSelectAudio={onSelectBackground
                      ? () => onSelectBackground(asset.url)
                      : undefined}
                  />
                );
              }

              return (
                <SimpleAssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => onAssetClick(asset)}
                  onDelete={onAssetDelete && !isSelectionMode
                    ? () => onAssetDelete(asset.path, asset.name)
                    : undefined}
                  onRename={onRenameAsset
                    ? (name) => onRenameAsset(asset.path, name)
                    : undefined}
                  isSelectionMode={isSelectionMode}
                  onSelectBackground={onSelectBackground
                    ? () => onSelectBackground(asset.url)
                    : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(VirtualAssetGrid);
