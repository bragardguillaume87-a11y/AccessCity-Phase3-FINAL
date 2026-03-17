/**
 * SpritesPanel — Panneau de gestion des sprites de personnages/monstres
 *
 * Fonctionnalités :
 * - Bibliothèque de sprites groupés par catégorie (Héros, PNJ, Monstre, Objet)
 * - Import inline (drag-drop ou bouton) → catégorie sprites-2d
 * - Sélection joueur (playerSpritePath sur MapMetadata)
 * - Vue détail des animations configurées pour le sprite sélectionné
 * - Placement d'entités sur la carte (comportement : statique, patrouille, dialogue)
 * - Configuration via SpriteImportDialog
 *
 * @module components/modules/TopdownEditor/SpritesPanel
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Upload, Settings, Search, X, ChevronDown, MapPin } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { useAssetUpload } from '@/components/modals/AssetsLibraryModal/hooks/useAssetUpload';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMapsStore } from '@/stores/mapsStore';
import SpriteImportDialog from './SpriteImportDialog';
import { SPRITE_CATEGORIES, SPRITE_ANIM_GROUPS } from '@/types/sprite';
import type { SpriteSheetConfig, EntityBehavior } from '@/types/sprite';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Tronque un nom technique long (UUID, timestamp) à 15 chars + '…' */
function truncateName(name: string): string {
  return name.length > 18 ? name.slice(0, 15) + '…' : name;
}

/**
 * Retourne la position (col, row) de la 1ère frame idle du spritesheet.
 * Priorité : idle_down > idle_up > walk_down > walk_up > frame 0,0
 */
function getIdleFramePos(config: SpriteSheetConfig): { col: number; row: number } {
  const PRIO = ['idle_down', 'idle_up', 'walk_down', 'walk_up'] as const;
  for (const tag of PRIO) {
    const anim = config.animations[tag as keyof typeof config.animations];
    if (anim?.frames?.length) {
      const frame = anim.frames[0];
      return { col: frame % config.cols, row: Math.floor(frame / config.cols) };
    }
  }
  return { col: 0, row: 0 };
}

/** Dessine un frame du spritesheet sur un canvas (avec flipX optionnel) */
function drawSpriteFrame(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  frameIdx: number,
  cols: number,
  frameW: number,
  frameH: number,
  flipX = false
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const col = frameIdx % Math.max(1, cols);
  const row = Math.floor(frameIdx / Math.max(1, cols));
  if (flipX) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      img,
      col * frameW,
      row * frameH,
      frameW,
      frameH,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();
  } else {
    ctx.drawImage(
      img,
      col * frameW,
      row * frameH,
      frameW,
      frameH,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }
}

/**
 * Vignette animée — canvas qui joue walk_down (ou la 1ère animation disponible).
 * Remplace la vignette statique dans la liste pour les sprites configurés.
 */
function AnimatedSpriteThumb({
  url,
  name,
  config,
  size = 36,
  border,
}: {
  url: string;
  name: string;
  config: SpriteSheetConfig | null;
  size?: number;
  border?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!config) return;
    const ANIM_PRIO = ['walk_down', 'idle_down', 'walk_up', 'idle_up'] as const;
    let pickedAnim = ANIM_PRIO.map((t) => config.animations[t]).find((a) => a?.frames?.length);
    if (!pickedAnim)
      pickedAnim = Object.values(config.animations).find(
        (a) => Array.isArray(a?.frames) && a.frames.length > 0
      );
    if (!pickedAnim) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      const { frames, fps, flipX } = pickedAnim!;
      const frameCount = Math.max(1, frames.length);
      let tick = 0;
      const draw = () =>
        drawSpriteFrame(
          canvas,
          img,
          frames[tick % frameCount] ?? 0,
          config.cols,
          config.frameW,
          config.frameH,
          flipX
        );
      draw();
      const id = setInterval(
        () => {
          if (cancelled) {
            clearInterval(id);
            return;
          }
          tick++;
          draw();
        },
        1000 / Math.max(1, fps)
      );
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url, config]);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    border: border ?? '1px solid var(--color-border-base)',
    borderRadius: 4,
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!config) {
    return (
      <div style={containerStyle}>
        <img
          src={url}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = '0';
          }}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
    </div>
  );
}

/**
 * Thumbnail ISO — affiche une seule frame du spritesheet (idle ou walk).
 * Si pas de config, affiche le spritesheet entier réduit.
 */
function SpriteFrameThumb({
  url,
  name,
  config,
  size = 36,
  border,
}: {
  url: string;
  name: string;
  config: SpriteSheetConfig | null;
  size?: number;
  border?: string;
}) {
  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    border: border ?? '1px solid var(--color-border-base)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!config) {
    return (
      <div style={containerStyle}>
        <img
          src={url}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = '0';
          }}
        />
      </div>
    );
  }

  const { col, row } = getIdleFramePos(config);
  const scale = size / config.frameW;
  const imgW = config.cols * config.frameW * scale;
  const imgH = config.rows * config.frameH * scale;
  const left = -(col * config.frameW * scale);
  const top = -(row * config.frameH * scale);

  return (
    <div style={containerStyle}>
      <img
        src={url}
        alt={name}
        style={{
          position: 'absolute',
          width: imgW,
          height: imgH,
          left,
          top,
          imageRendering: 'pixelated',
          objectFit: 'none',
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = '0';
        }}
      />
    </div>
  );
}

const ENTITY_BEHAVIORS: { id: EntityBehavior; emoji: string; label: string; hint: string }[] = [
  { id: 'static', emoji: '🗿', label: 'Statique', hint: 'Personnage immobile' },
  { id: 'patrol', emoji: '🔄', label: 'Patrouille', hint: 'Va-et-vient A→B' },
  { id: 'dialogue', emoji: '💬', label: 'Dialogue', hint: 'Parle au contact' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface SpritesPanelProps {
  mapId: string | null;
  isPlacingEntity: boolean;
  onStartPlacing: (spriteUrl: string, behavior: EntityBehavior, displayName?: string) => void;
  onCancelPlacing: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpritesPanel({
  mapId,
  isPlacingEntity,
  onStartPlacing,
  onCancelPlacing,
}: SpritesPanelProps) {
  const { assets, loading, reloadManifest } = useAssets();
  const { uploadFiles, isUploading, progress } = useAssetUpload({ category: 'sprites-2d' });

  // Reload manifest automatiquement après chaque upload (sans changer d'onglet)
  useEffect(() => {
    const handler = () => reloadManifest();
    window.addEventListener('asset-manifest-updated', handler);
    return () => window.removeEventListener('asset-manifest-updated', handler);
  }, [reloadManifest]);
  const spriteSheetConfigs = useSettingsStore((s) => s.spriteSheetConfigs);
  const setSpriteSheetConfig = useSettingsStore((s) => s.setSpriteSheetConfig);
  const hiddenAssetPaths = useSettingsStore((s) => s.hiddenAssetPaths);
  const hideAsset = useSettingsStore((s) => s.hideAsset);
  const updateMapMetadata = useMapsStore((s) => s.updateMapMetadata);
  const playerSpritePath = useMapsStore((s) =>
    mapId ? (s.getMapById(mapId)?.playerSpritePath ?? null) : null
  );

  const [selectedSpriteUrl, setSelectedSpriteUrl] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityBehavior, setEntityBehavior] = useState<EntityBehavior>('static');
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Import dialog ──────────────────────────────────────────────────────────
  const [importDialog, setImportDialog] = useState<{
    imageSrc: string;
    imagePath: string;
    imageName: string;
    initialConfig?: SpriteSheetConfig;
  } | null>(null);

  // ── Category dropdown — @radix-ui/react-dropdown-menu ────────────────────

  // ── Filtered sprite assets ─────────────────────────────────────────────────
  const spriteAssets = assets.filter(
    (a) =>
      a.category === 'sprites-2d' &&
      !hiddenAssetPaths.includes(a.url ?? a.path) &&
      !hiddenAssetPaths.includes(a.path)
  );

  const filteredAssets = spriteAssets.filter((a) => {
    const url = a.url ?? a.path;
    const cfg = spriteSheetConfigs[url] ?? spriteSheetConfigs[a.path];
    const displayName = cfg?.displayName ?? a.name ?? a.path.split('/').pop() ?? '';
    const catMatch = !filterCategory || cfg?.category === filterCategory;
    const searchMatch =
      !searchQuery || displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  // Group by category when no filter
  type GroupMap = Map<string, typeof filteredAssets>;
  const grouped: GroupMap = new Map();
  if (!filterCategory && !searchQuery) {
    for (const a of filteredAssets) {
      const url = a.url ?? a.path;
      const cfg = spriteSheetConfigs[url] ?? spriteSheetConfigs[a.path];
      const cat = cfg?.category ?? 'hero';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(a);
    }
  }

  const getDisplayName = (a: (typeof spriteAssets)[0]) => {
    const url = a.url ?? a.path;
    const cfg = spriteSheetConfigs[url] ?? spriteSheetConfigs[a.path];
    return cfg?.displayName ?? a.name ?? a.path.split('/').pop() ?? '';
  };

  const getConfig = (a: (typeof spriteAssets)[0]) => {
    const url = a.url ?? a.path;
    return spriteSheetConfigs[url] ?? spriteSheetConfigs[a.path] ?? null;
  };

  // ── Active sprite config ───────────────────────────────────────────────────
  const selectedAsset = spriteAssets.find(
    (a) => (a.url ?? a.path) === selectedSpriteUrl || a.path === selectedSpriteUrl
  );
  const selectedConfig = selectedAsset ? getConfig(selectedAsset) : null;

  // ── Upload handlers ────────────────────────────────────────────────────────
  const handleUpload = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      uploadFiles(files);
    },
    [uploadFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      handleUpload(files);
    },
    [handleUpload]
  );

  // ── Open import dialog for a specific asset ────────────────────────────────
  const openImport = useCallback(
    (a: (typeof spriteAssets)[0]) => {
      const url = a.url ?? a.path;
      const existing = spriteSheetConfigs[url] ?? spriteSheetConfigs[a.path];
      setImportDialog({
        imageSrc: url,
        imagePath: url,
        imageName: a.name ?? a.path.split('/').pop() ?? '',
        initialConfig: existing,
      });
    },
    [spriteSheetConfigs]
  );

  // ── Save config from dialog ────────────────────────────────────────────────
  const handleImportConfirm = useCallback(
    (imagePath: string, config: SpriteSheetConfig) => {
      setSpriteSheetConfig(imagePath, config);
      setImportDialog(null);
    },
    [setSpriteSheetConfig]
  );

  // ── Current category label ─────────────────────────────────────────────────
  const filterCatObj = SPRITE_CATEGORIES.find((c) => c.id === filterCategory);

  // ── Sprite row renderer ───────────────────────────────────────────────────
  const renderSpriteRow = (a: (typeof spriteAssets)[0]) => {
    const url = a.url ?? a.path;
    const name = getDisplayName(a);
    const isSelected = url === selectedSpriteUrl || a.path === selectedSpriteUrl;
    const isPlayer = url === playerSpritePath || a.path === playerSpritePath;

    return (
      <div
        key={a.path}
        onClick={() => setSelectedSpriteUrl(isSelected ? null : url)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 8px',
          borderRadius: 5,
          cursor: 'pointer',
          background: isSelected ? 'var(--color-primary-muted)' : 'transparent',
          border: isSelected ? '1px solid var(--color-primary-45)' : '1px solid transparent',
          transition: 'background 0.1s',
          position: 'relative',
        }}
      >
        {/* Thumbnail animée — walk_down ou 1ère animation disponible */}
        <AnimatedSpriteThumb
          url={url}
          name={name}
          config={getConfig(a)}
          size={52}
          border={`1px solid ${isSelected ? 'var(--color-primary-glow)' : 'var(--color-border-base)'}`}
        />

        {/* Name */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              title={name.length > 18 ? name : undefined}
              style={{
                fontSize: 12,
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? 'var(--color-primary)' : 'var(--color-text-base)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {truncateName(name)}
            </span>
            {isPlayer && (
              <span
                style={{
                  fontSize: 9,
                  padding: '1px 4px',
                  borderRadius: 3,
                  background: 'var(--color-primary-25)',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                🎮
              </span>
            )}
          </div>
          {getConfig(a) && (
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
              {getConfig(a)!.frameW}×{getConfig(a)!.frameH}px ·{' '}
              {Object.keys(getConfig(a)!.animations).length} anim.
            </span>
          )}
        </div>

        {/* Configure button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openImport(a);
          }}
          title="Configurer le spritesheet"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 4,
            cursor: 'pointer',
            border: '1px solid var(--color-border-base)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Settings size={12} />
        </button>
        {/* Remove from list button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            hideAsset(a.url ?? a.path);
          }}
          title="Retirer de la liste (ne supprime pas le fichier)"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 4,
            cursor: 'pointer',
            border: '1px solid transparent',
            background: 'transparent',
            color: 'var(--color-danger-55)',
          }}
        >
          <X size={11} />
        </button>
      </div>
    );
  };

  // ── Configured animations summary ─────────────────────────────────────────
  const renderAnimsSummary = (config: SpriteSheetConfig) => {
    const configured = SPRITE_ANIM_GROUPS.filter((g) => g.tags.some((t) => config.animations[t]));
    if (configured.length === 0) {
      return (
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
          }}
        >
          Aucune animation configurée. Cliquez sur ⚙ pour configurer.
        </p>
      );
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {configured.map((g) => {
          const count = g.tags.filter((t) => config.animations[t]).length;
          return (
            <span
              key={g.id}
              style={{
                fontSize: 11,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'var(--color-primary-15)',
                border: '1px solid var(--color-primary-30)',
                color: 'var(--color-primary)',
              }}
            >
              {g.emoji} {g.label} ({count}/{g.tags.length})
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag-over overlay */}
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            background: 'var(--color-primary-muted)',
            border: '2px dashed var(--color-primary)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>
            Déposer les sprites ici
          </span>
        </div>
      )}

      {/* ── Header bar ── */}
      <div style={{ borderBottom: '1px solid var(--color-border-base)', flexShrink: 0 }}>
        <div style={{ padding: '7px 8px' }}>
          {/* Search + upload + category */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 5 }}>
            {/* Search */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--color-dark-30)',
                border: '1px solid var(--color-border-base)',
                borderRadius: 5,
                padding: '3px 7px',
              }}
            >
              <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher…"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-base)',
                  fontSize: 12,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Category filter — @radix-ui/react-dropdown-menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  title="Filtrer par catégorie"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '4px 7px',
                    borderRadius: 5,
                    cursor: 'pointer',
                    border: filterCategory
                      ? '1.5px solid var(--color-primary-60)'
                      : '1px solid var(--color-border-base)',
                    background: filterCategory ? 'var(--color-primary-15)' : 'var(--color-dark-20)',
                    color: filterCategory ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontSize: 13,
                    fontWeight: filterCategory ? 700 : 400,
                    flexShrink: 0,
                  }}
                >
                  {filterCatObj ? filterCatObj.emoji : '🎭'}
                  <ChevronDown size={11} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  sideOffset={4}
                  style={{
                    zIndex: 9999,
                    minWidth: 180,
                    background: 'var(--color-surface-elevated, #1e1e2e)',
                    border: '1px solid var(--color-border-base)',
                    borderRadius: 10,
                    boxShadow: '0 12px 32px var(--color-dark-65)',
                    overflow: 'hidden',
                  }}
                >
                  <DropdownMenu.Item
                    onSelect={() => setFilterCategory(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: !filterCategory ? 'var(--color-primary-15)' : 'transparent',
                      borderBottom: '1px solid var(--color-border-base)',
                      outline: 'none',
                      color: !filterCategory ? 'var(--color-primary)' : 'var(--color-text-base)',
                      fontSize: 13,
                      fontWeight: !filterCategory ? 700 : 400,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>🎭</span> Toutes
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        background: 'var(--color-border-base)',
                        padding: '1px 6px',
                        borderRadius: 8,
                      }}
                    >
                      {spriteAssets.length}
                    </span>
                  </DropdownMenu.Item>
                  {SPRITE_CATEGORIES.map((cat) => {
                    const count = spriteAssets.filter((a) => {
                      const url = a.url ?? a.path;
                      const cfg = spriteSheetConfigs[url] ?? spriteSheetConfigs[a.path];
                      return cfg?.category === cat.id;
                    }).length;
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
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 400,
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-base)',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                        <span style={{ flex: 1 }}>{cat.label}</span>
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--color-text-secondary)',
                            background: 'var(--color-border-base)',
                            padding: '1px 6px',
                            borderRadius: 8,
                          }}
                        >
                          {count}
                        </span>
                      </DropdownMenu.Item>
                    );
                  })}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

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

            {/* Upload */}
            <label
              title="Importer un sprite (PNG)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 5,
                cursor: 'pointer',
                flexShrink: 0,
                border: '1px solid var(--color-border-base)',
                background: isUploading ? 'var(--color-primary-20)' : 'var(--color-dark-20)',
                color: isUploading ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              <Upload size={13} />
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) handleUpload(Array.from(e.target.files));
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {/* Active filter pill */}
          {filterCategory && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Filtre :</span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'var(--color-primary-15)',
                  padding: '1px 7px',
                  borderRadius: 10,
                }}
              >
                {filterCatObj?.emoji} {filterCatObj?.label}
                <button
                  onClick={() => setFilterCategory(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-primary)',
                    padding: 0,
                    display: 'flex',
                    marginLeft: 2,
                  }}
                >
                  <X size={10} />
                </button>
              </span>
            </div>
          )}
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

      {/* ── Sprite list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 4px' }}>
        {loading && spriteAssets.length === 0 ? (
          /* Skeleton — chargement initial */
          <div style={{ padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[60, 75, 50, 68, 55].map((w, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px' }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 4,
                    background: 'var(--color-border-base)',
                    flexShrink: 0,
                    animation: `shimmer 1.4s ease-in-out ${i * 0.12}s infinite`,
                  }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div
                    style={{
                      height: 11,
                      borderRadius: 4,
                      background: 'var(--color-border-base)',
                      width: `${w}%`,
                      animation: `shimmer 1.4s ease-in-out ${i * 0.12}s infinite`,
                    }}
                  />
                  <div
                    style={{
                      height: 9,
                      borderRadius: 4,
                      background: 'var(--color-overlay-05)',
                      width: '45%',
                      animation: `shimmer 1.4s ease-in-out ${i * 0.12 + 0.05}s infinite`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : spriteAssets.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Aucun sprite importé
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>
              Cliquez sur ⬆ ou glissez une image PNG/spritesheet
            </p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div style={{ padding: '16px 12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Aucun résultat
            </p>
          </div>
        ) : filterCategory || searchQuery ? (
          // Flat list when filtered
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredAssets.map((a) => renderSpriteRow(a))}
          </div>
        ) : (
          // Grouped by category
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SPRITE_CATEGORIES.map((cat) => {
              const catAssets = grouped.get(cat.id) ?? [];
              if (catAssets.length === 0) return null;
              return (
                <div key={cat.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 6px',
                      marginTop: 4,
                      marginBottom: 2,
                      background: 'var(--color-overlay-04)',
                      borderRadius: 4,
                      fontSize: 11,
                      color: 'var(--color-text-primary)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{cat.emoji}</span>
                    {cat.label}
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 10,
                        background: 'var(--color-overlay-10)',
                        padding: '1px 5px',
                        borderRadius: 8,
                      }}
                    >
                      {catAssets.length}
                    </span>
                  </div>
                  {catAssets.map((a) => renderSpriteRow(a))}
                </div>
              );
            })}
            {/* Uncategorized */}
            {(() => {
              const uncatAssets = filteredAssets.filter((a) => {
                const url = a.url ?? a.path;
                const cfg = spriteSheetConfigs[url] ?? spriteSheetConfigs[a.path];
                return !cfg?.category || !SPRITE_CATEGORIES.find((c) => c.id === cfg.category);
              });
              if (uncatAssets.length === 0) return null;
              return (
                <div key="__uncat">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 6px',
                      marginTop: 4,
                      marginBottom: 2,
                      background: 'var(--color-overlay-04)',
                      borderRadius: 4,
                      fontSize: 11,
                      color: 'var(--color-text-primary)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    📦 Non configuré
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 10,
                        background: 'var(--color-overlay-10)',
                        padding: '1px 5px',
                        borderRadius: 8,
                      }}
                    >
                      {uncatAssets.length}
                    </span>
                  </div>
                  {uncatAssets.map((a) => renderSpriteRow(a))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Detail panel (selected sprite) ── */}
      {selectedAsset && (
        <div
          style={{
            borderTop: '1px solid var(--color-border-base)',
            padding: '10px 10px',
            flexShrink: 0,
          }}
        >
          {/* Sprite header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <SpriteFrameThumb
              url={selectedAsset.url ?? selectedAsset.path}
              name={getDisplayName(selectedAsset)}
              config={selectedConfig}
              size={48}
              border="1px solid var(--color-border-base)"
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--color-text-base)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {getDisplayName(selectedAsset)}
              </p>
              {selectedConfig && (
                <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-secondary)' }}>
                  {selectedConfig.frameW}×{selectedConfig.frameH}px · {selectedConfig.cols}×
                  {selectedConfig.rows} grille
                </p>
              )}
            </div>
            <button
              onClick={() => openImport(selectedAsset)}
              title="Configurer le spritesheet"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 5,
                cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: 11,
              }}
            >
              <Settings size={12} /> Config
            </button>
          </div>

          {/* Animations */}
          {selectedConfig ? (
            <div style={{ marginBottom: 10 }}>
              <p style={labelStyle}>Animations</p>
              {renderAnimsSummary(selectedConfig)}
            </div>
          ) : (
            <div
              style={{
                marginBottom: 10,
                padding: '6px 8px',
                borderRadius: 5,
                background: 'var(--color-primary-08)',
                border: '1px dashed var(--color-primary-30)',
              }}
            >
              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-primary)' }}>
                ⚡ Cliquez sur Config pour définir la grille et les animations
              </p>
            </div>
          )}

          {/* Player sprite assignment */}
          {mapId && (
            <div style={{ marginBottom: 10 }}>
              <p style={labelStyle}>Joueur</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    const url = selectedAsset.url ?? selectedAsset.path;
                    const isPlayer =
                      url === playerSpritePath || selectedAsset.path === playerSpritePath;
                    updateMapMetadata(mapId, { playerSpritePath: isPlayer ? undefined : url });
                  }}
                  style={{
                    flex: 1,
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border:
                      (selectedAsset.url ?? selectedAsset.path) === playerSpritePath
                        ? '1.5px solid var(--color-primary-80)'
                        : '1px solid var(--color-border-base)',
                    background:
                      (selectedAsset.url ?? selectedAsset.path) === playerSpritePath
                        ? 'var(--color-primary-20)'
                        : 'transparent',
                    color:
                      (selectedAsset.url ?? selectedAsset.path) === playerSpritePath
                        ? 'var(--color-primary)'
                        : 'var(--color-text-secondary)',
                  }}
                >
                  {(selectedAsset.url ?? selectedAsset.path) === playerSpritePath
                    ? '🎮 Sprite joueur actif'
                    : '🎮 Définir comme joueur'}
                </button>
              </div>
            </div>
          )}

          {/* Entity placement */}
          {mapId && (
            <div>
              <p style={labelStyle}>Placer sur la carte</p>
              {/* Behavior selector */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 7 }}>
                {ENTITY_BEHAVIORS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setEntityBehavior(b.id)}
                    title={b.hint}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      padding: '5px 4px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      border:
                        entityBehavior === b.id
                          ? '1.5px solid var(--color-primary-70)'
                          : '1px solid var(--color-border-base)',
                      background:
                        entityBehavior === b.id ? 'var(--color-primary-15)' : 'transparent',
                      color:
                        entityBehavior === b.id
                          ? 'var(--color-primary)'
                          : 'var(--color-text-secondary)',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{b.emoji}</span>
                    <span style={{ fontSize: 9, fontWeight: entityBehavior === b.id ? 700 : 400 }}>
                      {b.label}
                    </span>
                  </button>
                ))}
              </div>

              {isPlacingEntity ? (
                /* Cancel placement mode */
                <button
                  onClick={onCancelPlacing}
                  style={{
                    width: '100%',
                    padding: '7px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1.5px solid var(--color-danger-60)',
                    background: 'var(--color-danger-15)',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                >
                  <MapPin size={13} /> Cliquez sur la carte… (Échap pour annuler)
                </button>
              ) : (
                /* Start placement mode */
                <button
                  onClick={() => {
                    const url = selectedAsset.url ?? selectedAsset.path;
                    onStartPlacing(url, entityBehavior, getDisplayName(selectedAsset));
                  }}
                  style={{
                    width: '100%',
                    padding: '7px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid var(--color-primary-glow)',
                    background: 'var(--color-primary-muted)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <MapPin size={13} /> Placer sur la carte
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Import Dialog ── */}
      {importDialog && (
        <SpriteImportDialog
          isOpen={true}
          imageSrc={importDialog.imageSrc}
          imagePath={importDialog.imagePath}
          imageName={importDialog.imageName}
          initialConfig={importDialog.initialConfig}
          onConfirm={handleImportConfirm}
          onCancel={() => setImportDialog(null)}
        />
      )}
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  margin: '0 0 5px',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
