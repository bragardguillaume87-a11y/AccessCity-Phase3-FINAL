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
import { Upload, Settings, ChevronDown, ChevronRight, ZoomIn, ZoomOut, Search, X } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { useAssetUpload } from '@/components/modals/AssetsLibraryModal/hooks/useAssetUpload';
import { useSettingsStore } from '@/stores/settingsStore';
import TilesetImportDialog from './TilesetImportDialog';
import { TILESET_CATEGORIES } from '@/types/tileset';
import type { Asset } from '@/types/assets';
import type { SelectedTile, TilesetConfig } from '@/types/tileset';
import type { LayerType } from '@/types/map';

// ── Constants ─────────────────────────────────────────────────────────────────

const SHEET_MIN_ZOOM = 0.5;
const SHEET_MAX_ZOOM = 4;
const SHEET_ZOOM_FACTOR = 1.2;

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
  const tilesetConfigs = useSettingsStore(s => s.tilesetConfigs);
  const setTilesetConfig = useSettingsStore(s => s.setTilesetConfig);
  const hiddenAssetPaths = useSettingsStore(s => s.hiddenAssetPaths);
  const hideAsset = useSettingsStore(s => s.hideAsset);

  // Reload manifest automatiquement après chaque upload (sans changer d'onglet)
  useEffect(() => {
    const handler = () => reloadManifest();
    window.addEventListener('asset-manifest-updated', handler);
    return () => window.removeEventListener('asset-manifest-updated', handler);
  }, [reloadManifest]);

  const [activeTilesetId, setActiveTilesetId] = useState<string | null>(null);
  const [importDialog, setImportDialog] = useState<{
    imageSrc: string;
    imagePath: string;
    imageName: string;
    initialConfig?: TilesetConfig;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Category dropdown — @radix-ui/react-dropdown-menu (remplace le portal custom) ──

  const dropRef = useRef<HTMLDivElement>(null);
  const { uploadFiles, isUploading, progress } = useAssetUpload({ category: 'tilesets' });

  // Catégorie tilesets uniquement — exclut les assets masqués par l'utilisateur
  const tileAssets = assets.filter(a =>
    a.category === 'tilesets' &&
    !hiddenAssetPaths.includes(a.url ?? a.path) &&
    !hiddenAssetPaths.includes(a.path)
  );

  // Auto-select first tileset on initial load
  useEffect(() => {
    if (activeTilesetId === null && tileAssets.length > 0) {
      setActiveTilesetId(tileAssets[0].id);
    }
  }, [tileAssets, activeTilesetId]);

  // ── Config lookup ────────────────────────────────────────────────────────────
  const getConfig = useCallback((asset: Asset): TilesetConfig | null => {
    const url = asset.url ?? asset.path;
    return tilesetConfigs[url] ?? tilesetConfigs[asset.path] ?? null;
  }, [tilesetConfigs]);

  const hasConfig = useCallback((asset: Asset): boolean => {
    const url = asset.url ?? asset.path;
    return !!(tilesetConfigs[url] ?? tilesetConfigs[asset.path]);
  }, [tilesetConfigs]);

  const getDisplayName = useCallback((asset: Asset): string => {
    return getConfig(asset)?.displayName ?? asset.name;
  }, [getConfig]);

  const getAssetCategory = useCallback((asset: Asset): string => {
    return getConfig(asset)?.category ?? 'divers';
  }, [getConfig]);

  // ── Filtering + grouping ──────────────────────────────────────────────────────
  const searchedAssets = searchQuery.trim()
    ? tileAssets.filter(a => getDisplayName(a).toLowerCase().includes(searchQuery.toLowerCase()))
    : tileAssets;

  const displayedAssets = filterCategory
    ? searchedAssets.filter(a => getAssetCategory(a) === filterCategory)
    : searchedAssets;

  // Group by category only when no category filter is active
  const grouped = filterCategory === null
    ? TILESET_CATEGORIES
        .map(cat => ({ ...cat, assets: displayedAssets.filter(a => getAssetCategory(a) === cat.id) }))
        .filter(g => g.assets.length > 0)
    : null;

  // Active asset must be in displayed list — otherwise SheetView is hidden
  const activeAsset = displayedAssets.find(a => a.id === activeTilesetId) ?? null;

  // Current category info
  const currentCat = filterCategory ? TILESET_CATEGORIES.find(c => c.id === filterCategory) : null;

  // ── Upload handling ───────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
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
  }, [uploadFiles, mapGridSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
    e.target.value = '';
  }, [handleFiles]);

  const openConfigDialog = useCallback((asset: Asset) => {
    const url = asset.url ?? asset.path;
    const existing = tilesetConfigs[url] ?? tilesetConfigs[asset.path];
    setImportDialog({ imageSrc: url, imagePath: url, imageName: asset.name, initialConfig: existing });
  }, [tilesetConfigs]);

  const handleConfigConfirm = useCallback((imagePath: string, config: TilesetConfig) => {
    setTilesetConfig(imagePath, config);
    setImportDialog(null);
  }, [setTilesetConfig]);

  // ── Tile selection ────────────────────────────────────────────────────────────
  const selectSheetRegion = useCallback((
    asset: Asset,
    config: TilesetConfig,
    colStart: number,
    rowStart: number,
    colEnd: number,
    rowEnd: number,
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
  }, [onSelectTile]);

  const selectWholeTile = useCallback((asset: Asset) => {
    onSelectTile({ asset, tileX: 0, tileY: 0, tileW: 0, tileH: 0 });
  }, [onSelectTile]);

  // ── Brush preview label ───────────────────────────────────────────────────────
  const brushLabel = selectedTile
    ? selectedTile.tileW === 0
      ? getDisplayName(selectedTile.asset)
      : `${getDisplayName(selectedTile.asset)} — ${selectedTile.regionCols ?? 1}×${selectedTile.regionRows ?? 1}`
    : null;

  // ── Tileset row renderer ──────────────────────────────────────────────────────
  const renderTilesetRow = (asset: Asset) => {
    const isActive = asset.id === activeTilesetId;
    const configured = hasConfig(asset);
    const name = getDisplayName(asset);
    return (
      <button
        key={asset.id}
        onClick={() => setActiveTilesetId(isActive ? null : asset.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          width: '100%', padding: '6px 10px',
          background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
          border: 'none',
          borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
          cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.08s',
        }}
      >
        {isActive
          ? <ChevronDown size={12} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          : <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        }
        <img
          src={asset.url ?? asset.path}
          alt=""
          style={{ width: 22, height: 22, objectFit: 'cover', imageRendering: 'pixelated', borderRadius: 3, flexShrink: 0 }}
        />
        <span style={{
          flex: 1, fontSize: 12, fontWeight: isActive ? 600 : 400,
          color: isActive ? 'var(--color-text-base)' : 'var(--color-text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </span>
        <button
          onClick={e => { e.stopPropagation(); openConfigDialog(asset); }}
          title={configured ? 'Reconfigurer / renommer' : 'Configurer la grille de tuiles'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, borderRadius: 4,
            border: configured ? '1px solid var(--color-border-base)' : '1px solid var(--color-primary)',
            background: configured ? 'transparent' : 'rgba(139,92,246,0.18)',
            color: configured ? 'var(--color-text-muted)' : 'var(--color-primary)',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Settings size={11} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); hideAsset(asset.url ?? asset.path); }}
          title="Retirer de la palette (ne supprime pas le fichier)"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, borderRadius: 4,
            border: '1px solid transparent',
            background: 'transparent',
            color: 'rgba(239,68,68,0.55)',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <X size={11} />
        </button>
      </button>
    );
  };

  // ── Collision / Trigger layers — symbol palette ───────────────────────────────
  if (activeLayer !== 'tiles') {
    const info = SYMBOL_TILES[activeLayer as 'collision' | 'triggers'];
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 border-b border-border flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Palette
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-3 text-center">
          <span style={{ fontSize: 40 }}>{info.emoji}</span>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>{info.label}</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{info.description}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Cliquez sur la carte pour peindre</p>
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
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
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
        <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border-base)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px' }}>
            <p style={{ margin: 0, flex: 1, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)' }}>
              Tuiles ({tileAssets.length})
            </p>
            {/* Loading spinner — manifest en cours de rechargement */}
            {loading && (
              <span title="Chargement…" style={{ display: 'flex', alignItems: 'center', animation: 'spin 1s linear infinite', color: 'var(--color-primary)', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </span>
            )}
            <label
              title="Importer un tileset (ou glissez un PNG)"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 5, cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: isUploading ? 'rgba(139,92,246,0.2)' : 'transparent',
                color: isUploading ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0,
                transition: 'background 0.1s',
              }}
            >
              <Upload size={13} />
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileInput} />
            </label>
          </div>
          {/* Progress bar — visible uniquement pendant un upload actif */}
          {isUploading && (
            <div style={{ height: 3, background: 'rgba(139,92,246,0.15)', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: progress > 0 ? `${progress}%` : '40%',
                background: 'var(--color-primary)',
                borderRadius: 2,
                transition: progress > 0 ? 'width 0.2s ease' : 'none',
                animation: progress === 0 ? 'indeterminate 1.4s ease-in-out infinite' : 'none',
              }} />
            </div>
          )}
        </div>

        {/* Search + category filter */}
        {tileAssets.length > 0 && (
          <div style={{ display: 'flex', gap: 6, padding: '6px 8px', borderBottom: '1px solid var(--color-border-base)', flexShrink: 0 }}>
            {/* Search input */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '4px 8px',
              border: '1px solid var(--color-border-base)',
            }}>
              <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filtrer..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 12, color: 'var(--color-text-base)', minWidth: 0,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Category dropdown — @radix-ui/react-dropdown-menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
                  border: currentCat ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border-base)',
                  background: currentCat ? 'rgba(139,92,246,0.15)' : 'rgba(0,0,0,0.25)',
                  color: currentCat ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontSize: 12, fontWeight: currentCat ? 600 : 400, maxWidth: 110, overflow: 'hidden',
                }}>
                  <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{currentCat ? currentCat.emoji : '⊞'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                    {currentCat ? currentCat.label : 'Toutes'}
                  </span>
                  {currentCat
                    ? <span onClick={e => { e.stopPropagation(); setFilterCategory(null); }} style={{ display: 'flex', flexShrink: 0 }}><X size={10} /></span>
                    : <ChevronDown size={11} style={{ flexShrink: 0 }} />
                  }
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  side="bottom" align="end" sideOffset={4}
                  style={{
                    zIndex: 9999, minWidth: 190,
                    background: 'var(--color-surface-elevated, #1e1e2e)',
                    border: '1px solid var(--color-border-base)',
                    borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.65)',
                    overflow: 'hidden',
                    animation: 'tilepalette-dropdown-in 0.12s ease',
                  }}
                >
                  <style>{`@keyframes tilepalette-dropdown-in { from { opacity:0; transform:scale(0.96) translateY(-4px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
                  <DropdownMenu.Item
                    onSelect={() => setFilterCategory(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer',
                      background: filterCategory === null ? 'rgba(139,92,246,0.15)' : 'transparent',
                      borderBottom: '1px solid var(--color-border-base)', outline: 'none',
                      color: filterCategory === null ? 'var(--color-primary)' : 'var(--color-text-base)',
                      fontSize: 13, fontWeight: filterCategory === null ? 600 : 400,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>⊞</span> Toutes les catégories
                  </DropdownMenu.Item>
                  {TILESET_CATEGORIES.map(cat => {
                    const count = tileAssets.filter(a => getAssetCategory(a) === cat.id).length;
                    const isActive = filterCategory === cat.id;
                    return (
                      <DropdownMenu.Item
                        key={cat.id}
                        onSelect={() => setFilterCategory(cat.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer',
                          background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
                          outline: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-base)',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                        <span style={{ flex: 1 }}>{cat.label}</span>
                        {count > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 5px' }}>
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
          <div className="flex-1" style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[72, 55, 65, 50, 60].map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px' }}>
                <div style={{ width: 22, height: 22, borderRadius: 3, background: 'rgba(255,255,255,0.08)', animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
                <div style={{ height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.08)', width: `${w}%`, animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
              </div>
            ))}
          </div>
        ) : tileAssets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3 text-center">
            <span style={{ fontSize: 28 }}>🖼️</span>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
              Glissez un PNG ici<br />ou cliquez sur ⊕
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tileset list */}
            <div style={{ flexShrink: 0, borderBottom: '1px solid var(--color-border-base)', overflowY: 'auto', maxHeight: 240 }}>
              {displayedAssets.length === 0 ? (
                <p style={{ margin: 0, padding: '10px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  Aucun tileset trouvé
                </p>
              ) : grouped ? (
                // Vue groupée par catégorie
                grouped.map(group => (
                  <div key={group.id}>
                    <div style={{
                      padding: '5px 10px 3px',
                      background: 'rgba(255,255,255,0.04)',
                      borderTop: '1px solid var(--color-border-base)',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{ fontSize: 13, lineHeight: 1 }}>{group.emoji}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: 'var(--color-text-base)',
                        textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7,
                      }}>
                        {group.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                        {group.assets.length}
                      </span>
                    </div>
                    {group.assets.map(asset => renderTilesetRow(asset))}
                  </div>
                ))
              ) : (
                // Vue plate (filtre catégorie actif)
                displayedAssets.map(asset => renderTilesetRow(asset))
              )}
            </div>

            {/* Sheet view */}
            {activeAsset && (
              <SheetView
                asset={activeAsset}
                config={getConfig(activeAsset)}
                selectedTile={selectedTile}
                onSelectTile={onSelectTile}
                onSelectWhole={selectWholeTile}
                onSelectSheetRegion={selectSheetRegion}
                onOpenConfig={() => openConfigDialog(activeAsset)}
              />
            )}
          </div>
        )}

        {/* Brush preview strip */}
        {brushLabel && (
          <div style={{
            flexShrink: 0, padding: '5px 10px', borderTop: '1px solid var(--color-border-base)',
            background: 'rgba(139,92,246,0.08)',
          }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

// ── SheetView ──────────────────────────────────────────────────────────────────

interface SheetViewProps {
  asset: Asset;
  config: TilesetConfig | null;
  selectedTile: SelectedTile | null;
  onSelectTile: (tile: SelectedTile | null) => void;
  onSelectWhole: (asset: Asset) => void;
  onSelectSheetRegion: (asset: Asset, config: TilesetConfig, c0: number, r0: number, c1: number, r1: number) => void;
  onOpenConfig: () => void;
}

function SheetView({
  asset,
  config,
  selectedTile,
  onSelectWhole,
  onSelectSheetRegion,
  onOpenConfig,
}: SheetViewProps) {
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [sheetZoom, setSheetZoom] = useState(1.0);
  const [dragStart, setDragStart] = useState<{ col: number; row: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ col: number; row: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const url = asset.url ?? asset.path;

  useEffect(() => {
    setImgSize(null);
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, [url]);

  // Zoom initial adaptatif : remplit la largeur du conteneur, tiles visibles à min 2× leur taille native
  useEffect(() => {
    if (!imgSize) { setSheetZoom(2.0); return; }
    const containerW = containerRef.current?.clientWidth ?? 0;
    const fitZoom = containerW > 0 ? (containerW - 12) / imgSize.w : 2.0;
    // Au moins 2x la taille native pour que les tiles 16px soient lisibles (≥ 32px)
    const autoZoom = Math.min(SHEET_MAX_ZOOM, Math.max(2.0, fitZoom));
    setSheetZoom(autoZoom);
  }, [asset.id, imgSize]);

  const zoomIn = () => setSheetZoom(z => Math.min(SHEET_MAX_ZOOM, z * SHEET_ZOOM_FACTOR));
  const zoomOut = () => setSheetZoom(z => Math.max(SHEET_MIN_ZOOM, z / SHEET_ZOOM_FACTOR));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const direction = e.deltaY < 0 ? 1 : -1;
    setSheetZoom(z => {
      const next = direction > 0 ? z * SHEET_ZOOM_FACTOR : z / SHEET_ZOOM_FACTOR;
      return Math.min(SHEET_MAX_ZOOM, Math.max(SHEET_MIN_ZOOM, next));
    });
  };

  const isWholeTileSelected = selectedTile?.asset.id === asset.id && selectedTile.tileW === 0;

  if (!config) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
        <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--color-text-muted)' }}>
          Image entière (pas de grille configurée)
        </p>
        <button
          onClick={() => onSelectWhole(asset)}
          style={{
            display: 'block', width: '100%', padding: 0,
            border: isWholeTileSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
            borderRadius: 4, cursor: 'pointer', background: 'transparent',
          }}
        >
          <img src={url} alt={asset.name} style={{ width: '100%', imageRendering: 'pixelated', display: 'block' }} draggable={false} />
        </button>
        <button
          onClick={onOpenConfig}
          style={{
            marginTop: 8, width: '100%', padding: '5px 0', fontSize: 12,
            border: '1px dashed var(--color-primary)', borderRadius: 5,
            background: 'rgba(139,92,246,0.08)', color: 'var(--color-primary)', cursor: 'pointer',
          }}
        >
          ⚙ Configurer la grille
        </button>
      </div>
    );
  }

  const innerW = imgSize ? imgSize.w - config.margin * 2 : 0;
  const innerH = imgSize ? imgSize.h - config.margin * 2 : 0;
  const cols = Math.max(0, Math.floor((innerW + config.spacing) / (config.tileW + config.spacing)));
  const rows = Math.max(0, Math.floor((innerH + config.spacing) / (config.tileH + config.spacing)));

  const selC0 = dragStart && dragCurrent ? Math.min(dragStart.col, dragCurrent.col) : -1;
  const selC1 = dragStart && dragCurrent ? Math.max(dragStart.col, dragCurrent.col) : -1;
  const selR0 = dragStart && dragCurrent ? Math.min(dragStart.row, dragCurrent.row) : -1;
  const selR1 = dragStart && dragCurrent ? Math.max(dragStart.row, dragCurrent.row) : -1;

  const isCellInDrag = (c: number, r: number) =>
    dragStart !== null && c >= selC0 && c <= selC1 && r >= selR0 && r <= selR1;

  const isCellSelected = (c: number, r: number) => {
    if (!selectedTile || selectedTile.asset.id !== asset.id || selectedTile.tileW === 0) return false;
    const c0 = (selectedTile.tileX - config.margin) / (config.tileW + config.spacing);
    const r0 = (selectedTile.tileY - config.margin) / (config.tileH + config.spacing);
    const rc = selectedTile.regionCols ?? 1;
    const rr = selectedTile.regionRows ?? 1;
    const inRegion = c >= c0 && c < c0 + rc && r >= r0 && r < r0 + rr;
    const expectedX = config.margin + c * (config.tileW + config.spacing);
    const expectedY = config.margin + r * (config.tileH + config.spacing);
    const matchExact = selectedTile.tileX === expectedX && selectedTile.tileY === expectedY;
    return inRegion || matchExact;
  };

  const handleCellMouseDown = (c: number, r: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDragStart({ col: c, row: r });
    setDragCurrent({ col: c, row: r });
  };

  const handleCellMouseEnter = (c: number, r: number) => {
    if (dragStart !== null) setDragCurrent({ col: c, row: r });
  };

  const handleCellMouseUp = (c: number, r: number) => {
    if (dragStart) {
      onSelectSheetRegion(asset, config, dragStart.col, dragStart.row, c, r);
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Zoom toolbar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderBottom: '1px solid var(--color-border-base)' }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flex: 1 }}>
          {imgSize && cols > 0 ? `${cols}×${rows} (${config.tileW}×${config.tileH}px)` : ''}
        </span>
        <button onClick={zoomOut} title="Zoom -" style={zoomBtnStyle} disabled={sheetZoom <= SHEET_MIN_ZOOM}>
          <ZoomOut size={12} />
        </button>
        <button
          onClick={() => setSheetZoom(1)}
          title="Zoom 100%"
          style={{ ...zoomBtnStyle, minWidth: 38, fontSize: 11 }}
        >
          {Math.round(sheetZoom * 100)}%
        </button>
        <button onClick={zoomIn} title="Zoom +" style={zoomBtnStyle} disabled={sheetZoom >= SHEET_MAX_ZOOM}>
          <ZoomIn size={12} />
        </button>
      </div>

      {/* Scrollable sheet container */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'auto', padding: 6 }}
        onWheel={handleWheel}
      >
        {imgSize && cols > 0 && rows > 0 ? (
          /* Outer div: reserves the correct zoomed space for scrolling */
          <div style={{ width: Math.round(imgSize.w * sheetZoom), height: Math.round(imgSize.h * sheetZoom), position: 'relative', flexShrink: 0 }}>
            {/* Inner div: natural-pixel size, scaled uniformly by CSS transform.
                This eliminates accumulated floating-point drift between grid cells
                because the browser applies one uniform scale to the whole subtree. */}
            <div
              style={{
                position: 'absolute', top: 0, left: 0,
                width: imgSize.w, height: imgSize.h,
                transformOrigin: '0 0',
                transform: `scale(${sheetZoom})`,
                userSelect: 'none',
              }}
              onMouseLeave={() => { if (dragStart) { setDragStart(null); setDragCurrent(null); } }}
            >
              <img
                src={url}
                alt={asset.name}
                style={{ display: 'block', imageRendering: 'pixelated', width: imgSize.w, height: imgSize.h }}
                draggable={false}
              />
              {/* Grid overlays at natural pixel coordinates — no zoom multiplication */}
              <div style={{ position: 'absolute', top: config.margin, left: config.margin, pointerEvents: 'none' }}>
                {Array.from({ length: rows }).map((_, r) =>
                  Array.from({ length: cols }).map((_, c) => {
                    const inDrag = isCellInDrag(c, r);
                    const selected = !inDrag && isCellSelected(c, r);
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseDown={e => handleCellMouseDown(c, r, e)}
                        onMouseEnter={() => handleCellMouseEnter(c, r)}
                        onMouseUp={() => handleCellMouseUp(c, r)}
                        style={{
                          position: 'absolute',
                          left: c * (config.tileW + config.spacing),
                          top: r * (config.tileH + config.spacing),
                          width: config.tileW,
                          height: config.tileH,
                          boxSizing: 'border-box',
                          border: selected
                            ? `${2 / sheetZoom}px solid var(--color-primary)`
                            : inDrag
                              ? `${2 / sheetZoom}px solid rgba(139,92,246,0.9)`
                              : `${1 / sheetZoom}px solid rgba(139,92,246,0.3)`,
                          background: selected
                            ? 'rgba(139,92,246,0.28)'
                            : inDrag
                              ? 'rgba(139,92,246,0.22)'
                              : 'transparent',
                          cursor: 'crosshair',
                          pointerEvents: 'auto',
                          transition: inDrag ? 'none' : 'background 0.08s',
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>Chargement...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────────

const zoomBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: 4,
  border: '1px solid var(--color-border-base)',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  padding: 0,
};
