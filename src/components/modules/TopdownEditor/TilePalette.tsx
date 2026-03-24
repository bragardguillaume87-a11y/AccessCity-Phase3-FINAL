/**
 * TilePalette — Palette de sélection de tuiles pour l'éditeur 2D
 *
 * Fonctionnalités :
 * - Liste compacte des tilesets + sheet view inline (style Tiled)
 * - Zoom molette + boutons +/- dans la SheetView
 * - Sélection multi-tuiles par glisser (rectangle brush, style Unity/Tiled)
 * - Preview du brush sélectionné (bandeau bas : "Brush 3×2")
 * - Upload inline drag-drop → catégorie tilesets
 * - Tri par catégorie (dropdown custom portal) + recherche par nom d'affichage
 *
 * @module components/modules/TopdownEditor/TilePalette
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
// createPortal supprimé — remplacé par DropdownMenu.Portal de Radix
import { Upload, Settings, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { useAssetUpload } from '@/components/modals/AssetsLibraryModal/hooks/useAssetUpload';
import { useSettingsStore } from '@/stores/settingsStore';
import TilesetImportDialog from './TilesetImportDialog';
import { SheetView } from './SheetView';
import { TILESET_CATEGORIES } from '@/types/tileset';
import type { Asset } from '@/types/assets';
import type { SelectedTile, TilesetConfig } from '@/types/tileset';
import type { LayerType } from '@/types/map';
import { Z_INDEX } from '@/utils/zIndexLayers';

// ── Constants ─────────────────────────────────────────────────────────────────

// ── Category colors — bande colorée Mario Maker style ────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  terrain: '#4ade80', // vert nature
  structures: '#fb923c', // orange brique
  vegetation: '#86efac', // vert clair
  mobilier: '#fbbf24', // jaune bois
  water: '#60a5fa', // bleu eau
  effects: '#c084fc', // violet magie
  divers: '#94a3b8', // gris neutre
};

// ── Symbol tiles (collision / triggers) ──────────────────────────────────────

const SYMBOL_TILES = {
  collision: {
    emoji: '🟥',
    label: 'Solide',
    description: 'Zone de collision — le joueur ne peut pas passer',
  },
  triggers: {
    emoji: '🟩',
    label: 'Zone trigger',
    description: 'Déclenche un dialogue ou une transition de carte',
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface TilePaletteProps {
  activeLayer: LayerType;
  selectedTile: SelectedTile | null;
  onSelectTile: (tile: SelectedTile | null) => void;
  mapGridSize?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TilePalette({
  activeLayer,
  selectedTile,
  onSelectTile,
  mapGridSize = 32,
}: TilePaletteProps) {
  const { assets, loading, reloadManifest } = useAssets();
  const tilesetConfigs = useSettingsStore((s) => s.tilesetConfigs);
  const setTilesetConfig = useSettingsStore((s) => s.setTilesetConfig);
  const hiddenAssetPaths = useSettingsStore((s) => s.hiddenAssetPaths);
  const hideAsset = useSettingsStore((s) => s.hideAsset);

  // Reload manifest automatiquement après chaque upload (sans changer d'onglet)
  useEffect(() => {
    const handler = () => reloadManifest();
    window.addEventListener('asset-manifest-updated', handler);
    return () => window.removeEventListener('asset-manifest-updated', handler);
  }, [reloadManifest]);

  const [activeTilesetIds, setActiveTilesetIds] = useState<Set<string>>(new Set());
  const anchorRef = useRef<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [importDialog, setImportDialog] = useState<{
    imageSrc: string;
    imagePath: string;
    imageName: string;
    initialConfig?: TilesetConfig;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Tile preview zoom (S/M/L) — persisted in localStorage ─────────────────
  type TileZoomLevel = 'sm' | 'md' | 'lg';
  const TILE_ZOOM_VALUES: Record<TileZoomLevel, number> = { sm: 0.75, md: 1.5, lg: 2.5 };
  const [tileZoomLevel, setTileZoomLevel] = useState<TileZoomLevel>(
    () => (localStorage.getItem('ac-tile-zoom') as TileZoomLevel) ?? 'md'
  );

  // ── Category dropdown — @radix-ui/react-dropdown-menu (remplace le portal custom) ──

  const dropRef = useRef<HTMLDivElement>(null);
  const { uploadFiles, isUploading, progress } = useAssetUpload({ category: 'tilesets' });

  // Catégorie tilesets uniquement — exclut les assets masqués par l'utilisateur
  const tileAssets = assets.filter(
    (a) =>
      a.category === 'tilesets' &&
      !hiddenAssetPaths.includes(a.url ?? a.path) &&
      !hiddenAssetPaths.includes(a.path)
  );

  // Auto-ouvre le premier tileset au chargement initial
  useEffect(() => {
    if (activeTilesetIds.size === 0 && tileAssets.length > 0) {
      setActiveTilesetIds(new Set([tileAssets[0].id]));
      anchorRef.current = tileAssets[0].id;
    }
  }, [tileAssets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Efface la sélection fantôme si l'asset du brush sélectionné est masqué
  useEffect(() => {
    if (!selectedTile) return;
    const assetUrl = selectedTile.asset.url ?? selectedTile.asset.path;
    const isHidden =
      hiddenAssetPaths.includes(assetUrl) || hiddenAssetPaths.includes(selectedTile.asset.path);
    if (isHidden) onSelectTile(null);
  }, [hiddenAssetPaths, selectedTile, onSelectTile]);

  // ── Config lookup ────────────────────────────────────────────────────────────
  const getConfig = useCallback(
    (asset: Asset): TilesetConfig | null => {
      const url = asset.url ?? asset.path;
      return tilesetConfigs[url] ?? tilesetConfigs[asset.path] ?? null;
    },
    [tilesetConfigs]
  );

  const hasConfig = useCallback(
    (asset: Asset): boolean => {
      const url = asset.url ?? asset.path;
      return !!(tilesetConfigs[url] ?? tilesetConfigs[asset.path]);
    },
    [tilesetConfigs]
  );

  const getDisplayName = useCallback(
    (asset: Asset): string => {
      const configured = getConfig(asset)?.displayName;
      if (configured) return configured;
      // Hash-like auto-generated names (e.g. "sheet-1773081504531") → friendly fallback
      const nameNoExt = asset.name.replace(/\.[^.]+$/, '');
      if (nameNoExt.length > 18 && !/\s/.test(nameNoExt)) return '📦 Tileset (sans nom)';
      return nameNoExt.replace(/[-_]/g, ' ');
    },
    [getConfig]
  );

  const getAssetCategory = useCallback(
    (asset: Asset): string => {
      return getConfig(asset)?.category ?? 'divers';
    },
    [getConfig]
  );

  // ── Filtering + grouping ──────────────────────────────────────────────────────
  const searchedAssets = searchQuery.trim()
    ? tileAssets.filter((a) => getDisplayName(a).toLowerCase().includes(searchQuery.toLowerCase()))
    : tileAssets;

  const displayedAssets = filterCategory
    ? searchedAssets.filter((a) => getAssetCategory(a) === filterCategory)
    : searchedAssets;

  // Group by category only when no category filter is active
  const grouped =
    filterCategory === null
      ? TILESET_CATEGORIES.map((cat) => ({
          ...cat,
          assets: displayedAssets.filter((a) => getAssetCategory(a) === cat.id),
        })).filter((g) => g.assets.length > 0)
      : null;

  // Current category info
  const currentCat = filterCategory
    ? TILESET_CATEGORIES.find((c) => c.id === filterCategory)
    : null;

  // ── Multi-select handler ──────────────────────────────────────────────────────
  const handleTilesetClick = useCallback(
    (asset: Asset, e: React.MouseEvent) => {
      e.preventDefault(); // évite la sélection de texte sur Shift+click
      const id = asset.id;

      if (e.shiftKey && anchorRef.current) {
        // Plage — ouvre tous les tilesets entre l'ancre et la cible
        const allIds = displayedAssets.map((a) => a.id);
        const anchorIdx = allIds.indexOf(anchorRef.current);
        const targetIdx = allIds.indexOf(id);
        if (anchorIdx >= 0 && targetIdx >= 0) {
          const [lo, hi] = [Math.min(anchorIdx, targetIdx), Math.max(anchorIdx, targetIdx)];
          setActiveTilesetIds((prev) => {
            const next = new Set(prev);
            allIds.slice(lo, hi + 1).forEach((rid) => next.add(rid));
            return next;
          });
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle individuel sans toucher aux autres
        setActiveTilesetIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        anchorRef.current = id;
      } else {
        // Click simple : ouvre seul / ferme si déjà seul ouvert
        setActiveTilesetIds((prev) =>
          prev.size === 1 && prev.has(id) ? new Set() : new Set([id])
        );
        anchorRef.current = id;
      }
    },
    [displayedAssets]
  );

  // ── Upload handling ───────────────────────────────────────────────────────────
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (fileArray.length === 0) return;
      await uploadFiles(fileArray);
      const f = fileArray[0];
      const objUrl = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        if (img.naturalWidth > mapGridSize || img.naturalHeight > mapGridSize) {
          setImportDialog({ imageSrc: objUrl, imagePath: f.name, imageName: f.name });
        }
      };
      img.src = objUrl;
    },
    [uploadFiles, mapGridSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
      e.target.value = '';
    },
    [handleFiles]
  );

  const openConfigDialog = useCallback(
    (asset: Asset) => {
      const url = asset.url ?? asset.path;
      const existing = tilesetConfigs[url] ?? tilesetConfigs[asset.path];
      setImportDialog({
        imageSrc: url,
        imagePath: url,
        imageName: asset.name,
        initialConfig: existing,
      });
    },
    [tilesetConfigs]
  );

  const handleConfigConfirm = useCallback(
    (imagePath: string, config: TilesetConfig) => {
      setTilesetConfig(imagePath, config);
      setImportDialog(null);
    },
    [setTilesetConfig]
  );

  // ── Tile selection ────────────────────────────────────────────────────────────
  const selectSheetRegion = useCallback(
    (
      asset: Asset,
      config: TilesetConfig,
      colStart: number,
      rowStart: number,
      colEnd: number,
      rowEnd: number
    ) => {
      const c0 = Math.min(colStart, colEnd);
      const c1 = Math.max(colStart, colEnd);
      const r0 = Math.min(rowStart, rowEnd);
      const r1 = Math.max(rowStart, rowEnd);
      const tileX = config.margin + c0 * (config.tileW + config.spacing);
      const tileY = config.margin + r0 * (config.tileH + config.spacing);
      const tile: SelectedTile = {
        asset,
        tileX,
        tileY,
        tileW: config.tileW,
        tileH: config.tileH,
        regionCols: c1 - c0 + 1,
        regionRows: r1 - r0 + 1,
        tileStepX: config.tileW + config.spacing,
        tileStepY: config.tileH + config.spacing,
      };
      onSelectTile(tile);
    },
    [onSelectTile]
  );

  const selectWholeTile = useCallback(
    (asset: Asset) => {
      onSelectTile({ asset, tileX: 0, tileY: 0, tileW: 0, tileH: 0 });
    },
    [onSelectTile]
  );

  // ── Brush preview label ───────────────────────────────────────────────────────
  const brushLabel = selectedTile
    ? selectedTile.tileW === 0
      ? getDisplayName(selectedTile.asset)
      : `${getDisplayName(selectedTile.asset)} — ${selectedTile.regionCols ?? 1}×${selectedTile.regionRows ?? 1}`
    : null;

  // ── Tileset row renderer ──────────────────────────────────────────────────────
  const renderTilesetRow = (asset: Asset) => {
    const isActive = activeTilesetIds.has(asset.id);
    const configured = hasConfig(asset);
    const name = getDisplayName(asset);
    return (
      <div key={asset.id}>
        {/* div instead of button — HTML spec forbids <button> inside <button> */}
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => handleTilesetClick(asset, e)}
          onMouseEnter={() => setHoveredRowId(asset.id)}
          onMouseLeave={() => setHoveredRowId(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTilesetIds((prev) => {
                const next = new Set(prev);
                if (next.has(asset.id)) {
                  next.delete(asset.id);
                } else {
                  next.add(asset.id);
                }
                return next;
              });
              anchorRef.current = asset.id;
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            width: '100%',
            padding: '10px 12px',
            background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.08s',
            outline: 'none',
          }}
        >
          {isActive ? (
            <ChevronDown size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          ) : (
            <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          )}
          <img
            src={asset.url ?? asset.path}
            alt=""
            style={{
              width: 36,
              height: 36,
              objectFit: 'cover',
              imageRendering: 'pixelated',
              borderRadius: 4,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-text-base)' : 'var(--color-text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfigDialog(asset);
            }}
            title={configured ? 'Reconfigurer / renommer' : 'Configurer la grille de tuiles'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 4,
              border: configured
                ? '1px solid var(--color-border-base)'
                : '1px solid var(--color-primary)',
              background: configured ? 'transparent' : 'var(--color-primary-muted)',
              color: configured ? 'var(--color-text-muted)' : 'var(--color-primary)',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: hoveredRowId === asset.id ? 1 : 0,
              transition: 'opacity 0.12s',
            }}
          >
            <Settings size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              hideAsset(asset.url ?? asset.path);
            }}
            title="Retirer de la palette (ne supprime pas le fichier)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 4,
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--color-danger-55)',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: hoveredRowId === asset.id ? 1 : 0,
              transition: 'opacity 0.12s',
            }}
          >
            <X size={11} />
          </button>
        </div>
        {/* Inline SheetView — accordion multi-open (key remonte au changement de zoom S/M/L) */}
        {isActive && (
          <SheetView
            key={`${tileZoomLevel}-${asset.id}`}
            asset={asset}
            config={getConfig(asset)}
            selectedTile={selectedTile}
            onSelectTile={onSelectTile}
            onSelectWhole={selectWholeTile}
            onSelectSheetRegion={selectSheetRegion}
            onOpenConfig={() => openConfigDialog(asset)}
            defaultZoom={TILE_ZOOM_VALUES[tileZoomLevel]}
          />
        )}
      </div>
    );
  };

  // ── Collision / Trigger layers — symbol palette ───────────────────────────────
  if (activeLayer !== 'tiles') {
    const info = SYMBOL_TILES[activeLayer as 'collision' | 'triggers'];
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 border-b border-border flex-shrink-0">
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                width: 3,
                height: 10,
                borderRadius: 2,
                background: 'var(--color-primary)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            Palette
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-3 text-center">
          <span style={{ fontSize: 40 }}>{info.emoji}</span>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>
            {info.label}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {info.description}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Cliquez sur la carte pour peindre
          </p>
        </div>
      </div>
    );
  }

  // ── Tiles layer ───────────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={dropRef}
        className="flex flex-col h-full"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          outline: isDragOver ? '2px dashed var(--color-primary)' : 'none',
          outlineOffset: -2,
          borderRadius: 4,
          transition: 'outline 0.1s',
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border-base)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px' }}>
            <p
              style={{
                margin: 0,
                flex: 1,
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>🗺️</span>
              <span>Tuiles</span>
              {tileAssets.length > 0 && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-overlay-06)',
                    borderRadius: 4,
                    padding: '1px 5px',
                  }}
                >
                  {tileAssets.length}
                </span>
              )}
            </p>
            <span
              title="Ctrl+clic sur un tileset pour en ouvrir plusieurs simultanément"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '1px solid var(--color-border-base)',
                color: 'var(--color-text-muted)',
                fontSize: 11,
                cursor: 'help',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              ℹ
            </span>
            {/* Loading spinner — manifest en cours de rechargement */}
            {loading && (
              <span
                title="Chargement…"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  animation: 'spin 1s linear infinite',
                  color: 'var(--color-primary)',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </span>
            )}
            {/* Tile preview size — S/M/L */}
            {(['sm', 'md', 'lg'] as TileZoomLevel[]).map((z) => (
              <button
                key={z}
                onClick={() => {
                  setTileZoomLevel(z);
                  localStorage.setItem('ac-tile-zoom', z);
                }}
                title={
                  z === 'sm' ? 'Petites tuiles' : z === 'md' ? 'Tuiles moyennes' : 'Grandes tuiles'
                }
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor:
                    tileZoomLevel === z ? 'rgba(139,92,246,0.6)' : 'var(--color-border-base)',
                  background: tileZoomLevel === z ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: tileZoomLevel === z ? '#8b5cf6' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {z === 'sm' ? 'S' : z === 'md' ? 'M' : 'L'}
              </button>
            ))}
            <label
              title="Importer un tileset (ou glissez un PNG)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                borderRadius: 5,
                cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: isUploading ? 'var(--color-primary-20)' : 'transparent',
                color: isUploading ? 'var(--color-primary)' : 'var(--color-text-muted)',
                flexShrink: 0,
                transition: 'background 0.1s',
              }}
            >
              <Upload size={13} />
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
            </label>
          </div>
          {/* Progress bar — visible uniquement pendant un upload actif */}
          {isUploading && (
            <div
              style={{
                height: 3,
                background: 'var(--color-primary-15)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: progress > 0 ? `${progress}%` : '40%',
                  background: 'var(--color-primary)',
                  borderRadius: 2,
                  transition: progress > 0 ? 'width 0.2s ease' : 'none',
                  animation: progress === 0 ? 'indeterminate 1.4s ease-in-out infinite' : 'none',
                }}
              />
            </div>
          )}
        </div>

        {/* Search + category filter */}
        {tileAssets.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '8px 10px',
              borderBottom: '1px solid var(--color-border-base)',
              flexShrink: 0,
            }}
          >
            {/* Search input */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--color-dark-25)',
                borderRadius: 6,
                padding: '4px 8px',
                border: '1px solid var(--color-border-base)',
                minHeight: 34,
              }}
            >
              <Search size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer..."
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  color: 'var(--color-text-base)',
                  minWidth: 0,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Category dropdown — @radix-ui/react-dropdown-menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: currentCat
                      ? '1.5px solid var(--color-primary)'
                      : '1px solid var(--color-border-base)',
                    background: currentCat ? 'var(--color-primary-15)' : 'var(--color-dark-25)',
                    color: currentCat ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontSize: 14,
                    fontWeight: currentCat ? 600 : 400,
                    maxWidth: 110,
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>
                    {currentCat ? currentCat.emoji : '⊞'}
                  </span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {currentCat ? currentCat.label : 'Toutes'}
                  </span>
                  {currentCat ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterCategory(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          setFilterCategory(null);
                        }
                      }}
                      style={{ display: 'flex', flexShrink: 0 }}
                    >
                      <X size={10} />
                    </span>
                  ) : (
                    <ChevronDown size={11} style={{ flexShrink: 0 }} />
                  )}
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  sideOffset={4}
                  style={{
                    zIndex: Z_INDEX.TOPDOWN_DIALOG,
                    minWidth: 190,
                    background: 'var(--color-surface-elevated, #1e1e2e)',
                    border: '1px solid var(--color-border-base)',
                    borderRadius: 10,
                    boxShadow: '0 12px 32px var(--color-dark-65)',
                    overflow: 'hidden',
                    animation: 'tilepalette-dropdown-in 0.12s ease',
                  }}
                >
                  <style>{`@keyframes tilepalette-dropdown-in { from { opacity:0; transform:scale(0.96) translateY(-4px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
                  <DropdownMenu.Item
                    onSelect={() => setFilterCategory(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background:
                        filterCategory === null ? 'var(--color-primary-15)' : 'transparent',
                      borderBottom: '1px solid var(--color-border-base)',
                      outline: 'none',
                      color:
                        filterCategory === null ? 'var(--color-primary)' : 'var(--color-text-base)',
                      fontSize: 14,
                      fontWeight: filterCategory === null ? 600 : 400,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>⊞</span> Toutes les catégories
                  </DropdownMenu.Item>
                  {TILESET_CATEGORIES.map((cat) => {
                    const count = tileAssets.filter((a) => getAssetCategory(a) === cat.id).length;
                    const isActive = filterCategory === cat.id;
                    return (
                      <DropdownMenu.Item
                        key={cat.id}
                        onSelect={() => setFilterCategory(cat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 12px',
                          cursor: 'pointer',
                          background: isActive ? 'var(--color-primary-15)' : 'transparent',
                          outline: 'none',
                          fontSize: 14,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-base)',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                        <span style={{ flex: 1 }}>{cat.label}</span>
                        {count > 0 && (
                          <span
                            style={{
                              fontSize: 14,
                              color: 'var(--color-text-secondary)',
                              background: 'var(--color-overlay-06)',
                              borderRadius: 4,
                              padding: '1px 5px',
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </DropdownMenu.Item>
                    );
                  })}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}

        {loading && tileAssets.length === 0 ? (
          /* Skeleton — chargement initial du manifest */
          <div
            className="flex-1"
            style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}
          >
            {[72, 55, 65, 50, 60].map((w, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px' }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 3,
                    background: 'var(--color-border-base)',
                    animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
                <div
                  style={{
                    height: 11,
                    borderRadius: 4,
                    background: 'var(--color-border-base)',
                    width: `${w}%`,
                    animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
              </div>
            ))}
          </div>
        ) : tileAssets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3 text-center">
            <span style={{ fontSize: 28 }}>🖼️</span>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
              Glissez un PNG ici
              <br />
              ou cliquez sur ⊕
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {displayedAssets.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  padding: '10px',
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                }}
              >
                Aucun tileset trouvé
              </p>
            ) : grouped ? (
              // Vue groupée par catégorie — SheetViews inline après chaque ligne active
              grouped.map((group) => {
                const bandColor = CATEGORY_COLORS[group.id] ?? '#94a3b8';
                return (
                  <div key={group.id}>
                    <div
                      style={{
                        padding: '6px 10px 5px 8px',
                        background: `${bandColor}10`,
                        borderTop: '1px solid var(--color-border-base)',
                        borderLeft: `3px solid ${bandColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 15, lineHeight: 1 }}>{group.emoji}</span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: bandColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {group.label}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: bandColor,
                          marginLeft: 'auto',
                          background: `${bandColor}20`,
                          borderRadius: 4,
                          padding: '1px 5px',
                        }}
                      >
                        {group.assets.length}
                      </span>
                    </div>
                    {group.assets.map((asset) => renderTilesetRow(asset))}
                  </div>
                );
              })
            ) : (
              // Vue plate (filtre catégorie actif)
              displayedAssets.map((asset) => renderTilesetRow(asset))
            )}
          </div>
        )}

        {/* Brush preview strip */}
        {brushLabel && (
          <div
            style={{
              flexShrink: 0,
              padding: '5px 10px',
              borderTop: '1px solid var(--color-border-base)',
              background: 'var(--color-primary-08)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: 'var(--color-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Brush : {brushLabel}
            </p>
          </div>
        )}
      </div>

      {importDialog && (
        <TilesetImportDialog
          isOpen={true}
          imageSrc={importDialog.imageSrc}
          imagePath={importDialog.imagePath}
          imageName={importDialog.imageName}
          initialConfig={importDialog.initialConfig}
          onConfirm={handleConfigConfirm}
          onCancel={() => setImportDialog(null)}
        />
      )}
    </>
  );
}

// (SheetView → SheetView.tsx)
