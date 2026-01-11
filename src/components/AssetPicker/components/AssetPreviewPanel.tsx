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
    <div className="px-4 pb-4 pt-0 border-t border-slate-700">
      <p className="text-xs font-semibold text-slate-400 mb-2 mt-3">Aperçu</p>
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <LazyImage
          src={previewAsset?.path || selectedValue}
          alt="Preview"
          className="w-full h-40 object-contain rounded"
        />
        {previewAsset && (
          <div className="mt-2 text-xs text-slate-400 space-y-1">
            <p>
              <strong className="text-slate-300">Nom :</strong> {previewAsset.name}
            </p>
            {previewAsset.type && (
              <p>
                <strong className="text-slate-300">Type :</strong>{' '}
                {previewAsset.type.toUpperCase()}
              </p>
            )}
            {previewAsset.size && (
              <p>
                <strong className="text-slate-300">Taille :</strong>{' '}
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
      {!loaded && !failed && <div className={`${className} bg-slate-700 animate-pulse`} />}
      {failed && (
        <div
          className={`${className} bg-slate-800 flex items-center justify-center text-xs text-slate-500 border border-slate-700`}
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
