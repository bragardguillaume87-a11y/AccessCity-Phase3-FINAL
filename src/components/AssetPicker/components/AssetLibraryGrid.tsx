import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';

/**
 * Asset interface
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
 * Props for AssetLibraryGrid component
 */
export interface AssetLibraryGridProps {
  /** Assets to display */
  assets: Asset[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Currently selected asset path */
  selectedValue: string;
  /** Recent assets paths */
  recentAssets: string[];
  /** Asset type (for empty state message) */
  assetType: string;
  /** Asset select handler */
  onSelect: (assetPath: string) => void;
  /** Preview hover handler */
  onHover: (asset: Asset) => void;
}

/**
 * Props for AssetThumbnail sub-component
 */
interface AssetThumbnailProps {
  asset: Asset;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}

/**
 * Props for LazyImage sub-component
 */
interface LazyImageProps {
  src: string;
  alt: string;
  className: string;
}

/**
 * AssetLibraryGrid - Display grid of assets with loading/error/empty states
 *
 * Features:
 * - Loading spinner during asset fetch
 * - Error message display
 * - Empty state when no assets available
 * - Grid of asset thumbnails
 * - Recent assets section
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <AssetLibraryGrid
 *   assets={assets}
 *   loading={loading}
 *   error={error}
 *   selectedValue={value}
 *   recentAssets={recentAssets}
 *   assetType="background"
 *   onSelect={handleSelect}
 *   onHover={setPreviewAsset}
 * />
 * ```
 */
export function AssetLibraryGrid({
  assets,
  loading,
  error,
  selectedValue,
  recentAssets,
  assetType,
  onSelect,
  onHover
}: AssetLibraryGridProps): React.JSX.Element {
  return (
    <>
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Chargement des assets...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            <p className="font-semibold mb-1">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Le manifeste n'a pas pu être chargé. Vérifiez que le script de génération est lancé.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && assets.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-medium mb-2">Aucun asset disponible</p>
          <p className="text-sm text-muted-foreground">
            Ajoutez des images dans{' '}
            <code className="bg-card px-2 py-1 rounded text-xs text-foreground border border-border">
              /public/assets/{assetType}s/
            </code>
          </p>
        </div>
      )}

      {/* Assets Grid */}
      {!loading && !error && assets.length > 0 && (
        <>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {assets.map((asset, idx) => (
                <AssetThumbnail
                  key={`${asset.path}-${idx}`}
                  asset={asset}
                  selected={selectedValue === asset.path}
                  onSelect={() => onSelect(asset.path)}
                  onHover={() => onHover(asset)}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Recent Assets Section */}
          {recentAssets.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Récemment utilisés</p>
              <div className="flex gap-2 flex-wrap">
                {recentAssets.map((assetPath, idx) => (
                  <Badge
                    key={idx}
                    variant={selectedValue === assetPath ? 'default' : 'outline'}
                    className={`cursor-pointer text-xs px-3 py-1.5 ${
                      selectedValue === assetPath
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-card hover:bg-muted border-border text-foreground'
                    }`}
                    onClick={() => onSelect(assetPath)}
                  >
                    {assetPath.split('/').pop()?.slice(0, 20)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

/**
 * AssetThumbnail - Thumbnail with lazy loading
 */
function AssetThumbnail({
  asset,
  selected,
  onSelect,
  onHover
}: AssetThumbnailProps): React.JSX.Element {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`relative rounded-lg overflow-hidden border-2 transition-all group ${
        selected
          ? 'border-blue-500 shadow-md ring-2 ring-blue-500/50'
          : 'border-border hover:border-blue-500 hover:shadow-md'
      }`}
    >
      <LazyImage
        src={asset.path}
        alt={asset.name}
        className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
      />
      <div
        className={`text-[10px] px-2 py-1 text-center font-medium transition-colors truncate ${
          selected
            ? 'bg-blue-600 text-white'
            : 'bg-card text-foreground group-hover:bg-blue-600/20'
        }`}
      >
        {asset.name}
      </div>
    </button>
  );
}

/**
 * LazyImage - Image with lazy loading and skeleton
 */
function LazyImage({ src, alt, className }: LazyImageProps): React.JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative">
      {!loaded && !failed && <div className={`${className} bg-muted animate-pulse`} />}
      {failed && (
        <div
          className={`${className} bg-card flex items-center justify-center text-xs text-muted-foreground border border-border`}
        >
          Image non disponible
        </div>
      )}
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
