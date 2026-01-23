import React, { useState } from 'react';

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
 * Props for AssetPreviewPanel component
 */
export interface AssetPreviewPanelProps {
  /** Asset to preview (null = show selected value) */
  previewAsset: Asset | null;
  /** Currently selected asset value/path */
  selectedValue: string;
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
 * AssetPreviewPanel - Display asset preview with metadata
 *
 * Shows either:
 * - Hovered asset with full metadata (name, type, size)
 * - Currently selected asset (fallback)
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <AssetPreviewPanel
 *   previewAsset={previewAsset}
 *   selectedValue={value}
 * />
 * ```
 */
export function AssetPreviewPanel({
  previewAsset,
  selectedValue
}: AssetPreviewPanelProps): React.JSX.Element | null {
  if (!previewAsset && !selectedValue) return null;

  return (
    <div className="px-4 pb-4 pt-0 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground mb-2 mt-3">Aperçu</p>
      <div className="bg-card rounded-lg p-3 border border-border">
        <LazyImage
          src={previewAsset?.path || selectedValue}
          alt="Preview"
          className="w-full h-40 object-contain rounded"
        />
        {previewAsset && (
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p>
              <strong className="text-foreground">Nom :</strong> {previewAsset.name}
            </p>
            {previewAsset.type && (
              <p>
                <strong className="text-foreground">Type :</strong>{' '}
                {previewAsset.type.toUpperCase()}
              </p>
            )}
            {previewAsset.size && (
              <p>
                <strong className="text-foreground">Taille :</strong>{' '}
                {(previewAsset.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        )}
      </div>
    </div>
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
