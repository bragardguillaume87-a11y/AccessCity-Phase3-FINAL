/**
 * ObjectsPanel — Bibliothèque d'objets (Phase 4 — système de composants)
 *
 * Panneau droit, style GDevelop "Objets de scène" :
 * - Source : mapsStore.objectDefinitions (blueprints partagés)
 * - Badge ×N instances sur la carte active (depuis _ac_objects)
 * - Chips composants par définition (🎭 AnimatedSprite 🧱 Collider 💬 Dialogue…)
 * - Upload sprite + création définition via SpriteImportDialog
 * - "Ajouter un objet" en bas (pleine largeur)
 * - Suppression / configuration inline
 *
 * @module components/modules/TopdownEditor/ObjectsPanel
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Plus,
  Settings,
  Crown,
  Search,
  Upload,
  ChevronDown,
  X,
  MapPin,
  Trash2,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { useAssetUpload } from '@/components/modals/AssetsLibraryModal/hooks/useAssetUpload';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMapsStore } from '@/stores/mapsStore';
import SpriteImportDialog from './SpriteImportDialog';
import ObjectDefinitionDialog from './ObjectDefinitionDialog';
import { SPRITE_CATEGORIES, OBJECT_COMPONENT_META } from '@/types/sprite';
import type {
  SpriteSheetConfig,
  ObjectDefinition,
  AnimatedSpriteComponent,
  SpriteComponent,
} from '@/types/sprite';
import { OBJECT_PRESETS } from '@/config/objectPresets';

// ── Stable fallback ─────────────────────────────────────────────────────────
const EMPTY_OBJECT_INSTANCES: { definitionId: string }[] = [];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getIdleFramePos(config: SpriteSheetConfig): { col: number; row: number } {
  const PRIO = ['idle_down', 'idle_up', 'walk_down', 'walk_up'] as const;
  for (const tag of PRIO) {
    const anim = config.animations[tag];
    if (anim?.frames?.length) {
      const frameIdx = anim.frames[0];
      return {
        col: frameIdx % Math.max(1, config.cols),
        row: Math.floor(frameIdx / Math.max(1, config.cols)),
      };
    }
  }
  return { col: 0, row: 0 };
}

function drawFrame(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  col: number,
  row: number,
  cfg: SpriteSheetConfig,
  flipX = false
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  if (flipX) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      img,
      col * cfg.frameW,
      row * cfg.frameH,
      cfg.frameW,
      cfg.frameH,
      -canvas.width,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();
  } else {
    ctx.drawImage(
      img,
      col * cfg.frameW,
      row * cfg.frameH,
      cfg.frameW,
      cfg.frameH,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }
}

// ── Animated thumbnail (réutilisé depuis l'ancien ObjectsPanel) ─────────────

interface AnimThumbProps {
  url: string;
  config: SpriteSheetConfig;
  size?: number;
  animate?: boolean;
}

function AnimThumb({ url, config, size = 40, animate = false }: AnimThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      if (!animate) {
        const { col, row } = getIdleFramePos(config);
        drawFrame(canvas, img, col, row, config);
        return;
      }
      const walkAnim = config.animations.walk_down ?? config.animations.idle_down;
      const frames = walkAnim?.frames ?? [0];
      const fps = walkAnim?.fps ?? 8;
      const interval = 1000 / fps;
      let last = 0;
      const tick = (ts: number) => {
        if (cancelled) return;
        if (ts - last > interval) {
          last = ts;
          frameRef.current = (frameRef.current + 1) % frames.length;
          const fi = frames[frameRef.current];
          const col = fi % Math.max(1, config.cols);
          const row = Math.floor(fi / Math.max(1, config.cols));
          drawFrame(canvas, img, col, row, config);
        }
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    };
    img.src = url;
    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [url, config, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        flexShrink: 0,
        borderRadius: 4,
        background: 'rgba(0,0,0,0.35)',
      }}
    />
  );
}

// ── Thumbnail générique (sans sprite) ───────────────────────────────────────

function EmojiThumb({ emoji, size = 38 }: { emoji: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
      }}
    >
      {emoji}
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ObjectsPanelProps {
  mapId: string | null;
  /** true = en mode placement (un objet est en attente d'être posé sur la carte) */
  isPlacingObject: boolean;
  /** ID de la définition en cours de placement (null si aucun) */
  placingObjectDefId: string | null;
  onStartPlacing: (definitionId: string) => void;
  onCancelPlacing: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ObjectsPanel({
  mapId,
  isPlacingObject,
  placingObjectDefId,
  onStartPlacing,
  onCancelPlacing,
}: ObjectsPanelProps) {
  const spriteConfigs = useSettingsStore((s) => s.spriteSheetConfigs);
  const setSpriteSheetConfig = useSettingsStore((s) => s.setSpriteSheetConfig);

  const objectDefinitions = useMapsStore((s) => s.objectDefinitions);
  const addObjectDefinition = useMapsStore((s) => s.addObjectDefinition);
  const updateObjectDefinition = useMapsStore((s) => s.updateObjectDefinition);
  const removeObjectDefinition = useMapsStore((s) => s.removeObjectDefinition);
  const mapMetadata = useMapsStore((s) => (mapId ? s.maps.find((m) => m.id === mapId) : undefined));
  const mapObjects = useMapsStore((s) =>
    mapId ? (s.mapDataById[mapId]?._ac_objects ?? EMPTY_OBJECT_INSTANCES) : EMPTY_OBJECT_INSTANCES
  );
  const updateMapMetadata = useMapsStore((s) => s.updateMapMetadata);

  const { assets, loading } = useAssets();
  const { uploadFiles, isUploading } = useAssetUpload({ category: 'sprites-2d' });
  // Upload dédié au sprite picker (instance isolée pour éviter les conflits)
  const {
    uploadFiles: uploadSpritePickerFile,
    isUploading: isSpritePickerUploading,
    uploadedAssets: spritePickerUploaded,
  } = useAssetUpload({ category: 'sprites-2d' });

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [hoveredDefId, setHoveredDefId] = useState<string | null>(null);

  // Dialog état — création via SpriteImportDialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState('');
  const [dialogName, setDialogName] = useState<string | undefined>();
  const [dialogInitialConfig, setDialogInitialConfig] = useState<SpriteSheetConfig | undefined>();
  /** defId en cours d'édition (null = création) */
  const [editingDefId, setEditingDefId] = useState<string | null>(null);
  /** defId ouvert dans ObjectDefinitionDialog (null = fermé) */
  const [objDefDialogId, setObjDefDialogId] = useState<string | null>(null);
  /** Panneau présets ouvert */
  const [showPresets, setShowPresets] = useState(false);
  /** defId en attente d'un sprite à sélectionner (SpritePicker) */
  const [spritePickerDefId, setSpritePickerDefId] = useState<string | null>(null);
  const spritePickerFileRef = useRef<HTMLInputElement>(null);

  // Drag-over overlay
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // ── Dérivés ────────────────────────────────────────────────────────────────
  const playerUrl = mapMetadata?.playerSpritePath;

  const instanceCountByDef = useMemo(() => {
    const map = new Map<string, number>();
    for (const inst of mapObjects) {
      map.set(inst.definitionId, (map.get(inst.definitionId) ?? 0) + 1);
    }
    return map;
  }, [mapObjects]);

  /** Résout le composant sprite d'une définition (AnimatedSprite ou Sprite) */
  function getSpriteComp(def: ObjectDefinition): AnimatedSpriteComponent | SpriteComponent | null {
    return (
      def.components.find(
        (c): c is AnimatedSpriteComponent | SpriteComponent =>
          c.type === 'animatedSprite' || c.type === 'sprite'
      ) ?? null
    );
  }

  const allEntries = useMemo(() => {
    return objectDefinitions.map((def) => {
      const spriteComp = getSpriteComp(def);
      const spriteUrl = spriteComp?.spriteAssetUrl ?? '';
      const spriteConfig = spriteUrl ? spriteConfigs[spriteUrl] : undefined;
      const catInfo = SPRITE_CATEGORIES.find((c) => c.id === def.category);
      return {
        def,
        spriteUrl,
        spriteConfig,
        catEmoji: catInfo?.emoji ?? '📦',
        instanceCount: instanceCountByDef.get(def.id) ?? 0,
        isPlayer: !!spriteUrl && spriteUrl === playerUrl,
      };
    });
  }, [objectDefinitions, spriteConfigs, instanceCountByDef, playerUrl]);

  const visibleEntries = useMemo(() => {
    let list = allEntries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.def.displayName.toLowerCase().includes(q));
    } else if (filterCategory) {
      list = list.filter((e) => e.def.category === filterCategory);
    }
    return list;
  }, [allEntries, searchQuery, filterCategory]);

  const grouped = useMemo(() => {
    if (searchQuery.trim()) {
      return [{ id: null, label: 'Résultats', emoji: '🔍', entries: visibleEntries }];
    }
    if (filterCategory) {
      const cat = SPRITE_CATEGORIES.find((c) => c.id === filterCategory);
      return [
        {
          id: filterCategory,
          label: cat?.label ?? filterCategory,
          emoji: cat?.emoji ?? '📦',
          entries: visibleEntries,
        },
      ];
    }
    return SPRITE_CATEGORIES.map((cat) => ({
      id: cat.id,
      label: cat.label,
      emoji: cat.emoji,
      entries: visibleEntries.filter((e) => e.def.category === cat.id),
    })).filter((g) => g.entries.length > 0);
  }, [visibleEntries, searchQuery, filterCategory]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Ouvre SpriteImportDialog pour éditer le sprite d'une définition existante */
  const openEditSprite = useCallback(
    (def: ObjectDefinition) => {
      const spriteComp = getSpriteComp(def);
      const url = spriteComp?.spriteAssetUrl ?? '';
      setDialogUrl(url);
      setDialogName(def.displayName);
      setDialogInitialConfig(url ? spriteConfigs[url] : undefined);
      setEditingDefId(def.id);
      setDialogOpen(true);
    },
    [spriteConfigs]
  );

  // Quand l'upload du SpritePicker est terminé → ouvrir SpriteImportDialog
  useEffect(() => {
    if (!spritePickerDefId || spritePickerUploaded.length === 0) return;
    const uploadedUrl = spritePickerUploaded[0].path;
    const def = objectDefinitions.find((d) => d.id === spritePickerDefId);
    if (def) {
      setDialogUrl(uploadedUrl);
      setDialogName(def.displayName);
      setDialogInitialConfig(spriteConfigs[uploadedUrl]);
      setEditingDefId(spritePickerDefId);
      setDialogOpen(true);
    }
    setSpritePickerDefId(null);
  }, [spritePickerUploaded, spritePickerDefId, objectDefinitions, spriteConfigs]);

  /** Sélection d'un asset existant depuis le SpritePicker */
  const handleSpritePickerSelect = useCallback(
    (url: string, name?: string) => {
      const def = objectDefinitions.find((d) => d.id === spritePickerDefId);
      if (def) {
        setDialogUrl(url);
        setDialogName(name ?? def.displayName);
        setDialogInitialConfig(spriteConfigs[url]);
        setEditingDefId(spritePickerDefId);
        setDialogOpen(true);
      }
      setSpritePickerDefId(null);
    },
    [spritePickerDefId, objectDefinitions, spriteConfigs]
  );

  /** Ouvre SpriteImportDialog pour créer une nouvelle définition depuis un sprite */
  const openCreateFromSprite = useCallback(() => {
    const unconfigured = assets.find(
      (a) =>
        (a.type?.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(a.path)) &&
        !spriteConfigs[a.url ?? a.path]
    );
    if (unconfigured) {
      const url = unconfigured.url ?? unconfigured.path;
      setDialogUrl(url);
      setDialogName(unconfigured.name);
      setDialogInitialConfig(undefined);
    } else {
      // Prendre la première image disponible pour re-configurer
      const first = assets.find(
        (a) => a.type?.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(a.path)
      );
      if (first) {
        const url = first.url ?? first.path;
        setDialogUrl(url);
        setDialogName(first.name);
        setDialogInitialConfig(spriteConfigs[url]);
      }
    }
    setEditingDefId(null);
    setDialogOpen(true);
  }, [assets, spriteConfigs]);

  const handleSpriteConfirm = useCallback(
    (imagePath: string, config: SpriteSheetConfig) => {
      // Toujours sauvegarder la config sprite (pour AnimThumb + GameScene)
      setSpriteSheetConfig(imagePath, config);

      if (editingDefId) {
        // Mise à jour du composant AnimatedSprite de la définition existante
        const def = objectDefinitions.find((d) => d.id === editingDefId);
        if (def) {
          const newComponents = def.components.map((c) =>
            c.type === 'animatedSprite'
              ? { ...c, spriteAssetUrl: imagePath, spriteSheetConfigUrl: imagePath }
              : c
          );
          // Si pas de composant animatedSprite → en ajouter un
          const hasAnimSprite = def.components.some((c) => c.type === 'animatedSprite');
          if (!hasAnimSprite) {
            newComponents.unshift({
              type: 'animatedSprite',
              spriteAssetUrl: imagePath,
              spriteSheetConfigUrl: imagePath,
            });
          }
          updateObjectDefinition(editingDefId, {
            components: newComponents,
            thumbnailUrl: imagePath,
          });
        }
      } else {
        // Création d'une nouvelle définition
        const defName =
          config.displayName ??
          imagePath
            .split('/')
            .pop()
            ?.replace(/\.[^.]+$/, '') ??
          'Objet';
        addObjectDefinition({
          displayName: defName,
          category: (config.category as string) ?? 'npc',
          thumbnailUrl: imagePath,
          components: [
            {
              type: 'animatedSprite',
              spriteAssetUrl: imagePath,
              spriteSheetConfigUrl: imagePath,
            },
            {
              type: 'collider',
              shape: 'box',
              offsetX: 0,
              offsetY: 0,
              w: 28,
              h: 28,
              radius: 14,
            },
          ],
        });
      }
      setDialogOpen(false);
      setEditingDefId(null);
    },
    [
      editingDefId,
      objectDefinitions,
      setSpriteSheetConfig,
      addObjectDefinition,
      updateObjectDefinition,
    ]
  );

  const handleDelete = useCallback(
    (def: ObjectDefinition) => {
      const count = instanceCountByDef.get(def.id) ?? 0;
      const msg =
        count > 0
          ? `Supprimer "${def.displayName}" ? Cette définition a ${count} instance${count > 1 ? 's' : ''} sur les cartes — elles seront aussi supprimées.`
          : `Supprimer "${def.displayName}" de la bibliothèque ?`;
      if (window.confirm(msg)) {
        removeObjectDefinition(def.id);
        if (selectedDefId === def.id) setSelectedDefId(null);
      }
    },
    [removeObjectDefinition, selectedDefId, instanceCountByDef]
  );

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      await uploadFiles(Array.from(files));
    },
    [uploadFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload]
  );

  // Auto-déselectionner si la définition est supprimée
  useEffect(() => {
    if (selectedDefId && !objectDefinitions.find((d) => d.id === selectedDefId)) {
      setSelectedDefId(null);
    }
  }, [objectDefinitions, selectedDefId]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounterRef.current++;
        setIsDragOver(true);
      }}
      onDragLeave={() => {
        dragCounterRef.current--;
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0;
          setIsDragOver(false);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: 'rgba(139,92,246,0.18)',
            border: '2px dashed rgba(139,92,246,0.7)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          <Upload size={28} style={{ color: '#8b5cf6' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#c4b5fd' }}>
            Déposer les sprites ici
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div
        style={{
          padding: '10px 10px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            Objets de scène
          </span>
          {/* Upload button */}
          <label
            title="Importer un sprite"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: 5,
              border: isUploading
                ? '1px solid rgba(139,92,246,0.6)'
                : '1px solid rgba(255,255,255,0.1)',
              background: isUploading ? 'rgba(139,92,246,0.18)' : 'transparent',
              color: isUploading ? '#8b5cf6' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Upload size={11} />
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
          {/* Category dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                title="Filtrer par catégorie"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  height: 22,
                  padding: '0 5px',
                  borderRadius: 5,
                  border: filterCategory
                    ? '1px solid rgba(139,92,246,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: filterCategory ? 'rgba(139,92,246,0.12)' : 'transparent',
                  color: filterCategory ? '#8b5cf6' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                {filterCategory
                  ? SPRITE_CATEGORIES.find((c) => c.id === filterCategory)?.emoji
                  : '🗂'}
                <ChevronDown size={10} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                style={{
                  width: 160,
                  zIndex: 9999,
                  padding: 4,
                  background: 'var(--color-bg-elevated, #1e1e35)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}
                sideOffset={4}
              >
                <DropdownMenu.Item
                  onSelect={() => setFilterCategory(null)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 5,
                    cursor: 'pointer',
                    fontSize: 14,
                    color: !filterCategory ? '#8b5cf6' : 'rgba(255,255,255,0.85)',
                    fontWeight: !filterCategory ? 700 : 400,
                    outline: 'none',
                  }}
                >
                  🗂 Tous les objets
                </DropdownMenu.Item>
                {SPRITE_CATEGORIES.map((cat) => (
                  <DropdownMenu.Item
                    key={cat.id}
                    onSelect={() => setFilterCategory(cat.id)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontSize: 14,
                      color: filterCategory === cat.id ? '#8b5cf6' : 'rgba(255,255,255,0.85)',
                      fontWeight: filterCategory === cat.id ? 700 : 400,
                      outline: 'none',
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={10}
            style={{
              position: 'absolute',
              left: 7,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.3)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer les objets…"
            style={{
              width: '100%',
              height: 36,
              paddingLeft: 28,
              paddingRight: searchQuery ? 32 : 10,
              borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 5,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* ── Object list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {/* Loading skeleton */}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 8px',
                margin: '0 4px',
                borderRadius: 5,
                opacity: 0.5,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.06)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 8,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.08)',
                    width: '60%',
                    marginBottom: 5,
                  }}
                />
                <div
                  style={{
                    height: 7,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.05)',
                    width: '40%',
                  }}
                />
              </div>
            </div>
          ))}

        {/* Empty state */}
        {!loading && objectDefinitions.length === 0 && (
          <p
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.3)',
              padding: '12px 10px',
              lineHeight: 1.6,
            }}
          >
            Aucun objet créé.
            <br />
            Cliquez "Ajouter un objet" pour créer votre premier personnage ou objet.
          </p>
        )}

        {/* No results */}
        {!loading && objectDefinitions.length > 0 && visibleEntries.length === 0 && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', padding: '12px 10px' }}>
            Aucun résultat{searchQuery ? ` pour "${searchQuery}"` : ''}.
          </p>
        )}

        {/* Grouped entries */}
        {!loading &&
          grouped.map((group) => (
            <div key={group.id ?? '__search__'}>
              {/* Category header */}
              {(grouped.length > 1 || filterCategory) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 10px 4px',
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.25)',
                  }}
                >
                  <span>{group.emoji}</span>
                  <span>{group.label}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 3,
                      padding: '1px 4px',
                    }}
                  >
                    {group.entries.length}
                  </span>
                </div>
              )}

              {group.entries.map(
                ({ def, spriteUrl, spriteConfig, catEmoji, instanceCount, isPlayer }) => {
                  const isSelected = selectedDefId === def.id;
                  const isHov = hoveredDefId === def.id;
                  const isBeingPlaced = isPlacingObject && placingObjectDefId === def.id;

                  return (
                    <div key={def.id}>
                      {/* Object row */}
                      <div
                        onClick={() => setSelectedDefId(isSelected ? null : def.id)}
                        onMouseEnter={() => setHoveredDefId(def.id)}
                        onMouseLeave={() => setHoveredDefId(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 10px',
                          cursor: 'pointer',
                          borderRadius: 6,
                          margin: '0 4px',
                          transition: 'background 0.1s',
                          background: isBeingPlaced
                            ? 'rgba(74,222,128,0.12)'
                            : isSelected
                              ? 'rgba(139,92,246,0.15)'
                              : isHov
                                ? 'rgba(255,255,255,0.05)'
                                : 'transparent',
                          border: isBeingPlaced
                            ? '1px solid rgba(74,222,128,0.4)'
                            : isSelected
                              ? '1px solid rgba(139,92,246,0.4)'
                              : '1px solid transparent',
                        }}
                      >
                        {/* Thumbnail */}
                        {spriteUrl && spriteConfig ? (
                          <AnimThumb
                            url={spriteUrl}
                            config={spriteConfig}
                            size={44}
                            animate={isHov || isSelected}
                          />
                        ) : (
                          <EmojiThumb emoji={catEmoji} size={44} />
                        )}

                        {/* Info */}
                        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginBottom: 2,
                            }}
                          >
                            {isPlayer && (
                              <Crown size={9} style={{ color: '#fbbf24', flexShrink: 0 }} />
                            )}
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected
                                  ? '#c4b5fd'
                                  : isPlayer
                                    ? '#fbbf24'
                                    : 'rgba(255,255,255,0.82)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {def.displayName}
                            </span>
                            {instanceCount > 0 && (
                              <span
                                title={`${instanceCount} instance${instanceCount > 1 ? 's' : ''} sur la carte`}
                                style={{
                                  fontSize: 14,
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  background: 'rgba(74,222,128,0.15)',
                                  color: '#4ade80',
                                  border: '1px solid rgba(74,222,128,0.3)',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                ×{instanceCount}
                              </span>
                            )}
                          </div>
                          {/* Component chips */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {def.components.map((comp, i) => {
                              const meta = OBJECT_COMPONENT_META[comp.type];
                              return (
                                <span
                                  key={i}
                                  title={meta.description}
                                  style={{
                                    fontSize: 14,
                                    padding: '1px 5px',
                                    borderRadius: 3,
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.4)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                  }}
                                >
                                  {meta.emoji} {meta.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Row actions (visible on hover) */}
                        {isHov && (
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
                          >
                            {mapId && !isPlayer && spriteUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateMapMetadata(mapId, { playerSpritePath: spriteUrl });
                                }}
                                title="Définir comme sprite joueur"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 3,
                                  color: 'rgba(255,255,255,0.3)',
                                  borderRadius: 4,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#fbbf24';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                                }}
                              >
                                <Crown size={10} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setObjDefDialogId(def.id);
                              }}
                              title="Configurer l'objet et ses composants"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 3,
                                color: 'rgba(255,255,255,0.3)',
                                borderRadius: 4,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#8b5cf6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                              }}
                            >
                              <Settings size={10} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(def);
                              }}
                              title="Supprimer de la bibliothèque"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 3,
                                color: 'rgba(239,68,68,0.5)',
                                borderRadius: 4,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#f87171';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'rgba(239,68,68,0.5)';
                              }}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* ── Detail panel (when selected) ── */}
                      {isSelected && (
                        <div
                          style={{
                            margin: '2px 4px 4px',
                            borderRadius: 6,
                            border: '1px solid rgba(139,92,246,0.25)',
                            background: 'rgba(139,92,246,0.06)',
                            padding: '8px 10px',
                          }}
                        >
                          {/* All components */}
                          <div
                            style={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.3)',
                              marginBottom: 5,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            Composants
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3,
                              marginBottom: 8,
                            }}
                          >
                            {def.components.map((comp, i) => {
                              const meta = OBJECT_COMPONENT_META[comp.type];
                              return (
                                <div
                                  key={i}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 7px',
                                    borderRadius: 5,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                  }}
                                >
                                  <span style={{ fontSize: 14 }}>{meta.emoji}</span>
                                  <span
                                    style={{
                                      fontSize: 14,
                                      color: 'rgba(255,255,255,0.6)',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {meta.label}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: 'rgba(255,255,255,0.25)',
                                      marginLeft: 'auto',
                                    }}
                                  >
                                    {meta.description}
                                  </span>
                                </div>
                              );
                            })}
                            {def.components.length === 0 && (
                              <p
                                style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', margin: 0 }}
                              >
                                Aucun composant. Configurez le sprite ⚙ pour commencer.
                              </p>
                            )}
                          </div>

                          {/* Place / Cancel button */}
                          {isBeingPlaced ? (
                            <button
                              onClick={onCancelPlacing}
                              style={{
                                width: '100%',
                                height: 30,
                                borderRadius: 5,
                                border: '1px solid rgba(239,68,68,0.5)',
                                background: 'rgba(239,68,68,0.12)',
                                color: '#f87171',
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                              }}
                            >
                              <X size={11} />
                              Cliquez sur la carte — Échap
                            </button>
                          ) : (
                            <button
                              onClick={() => onStartPlacing(def.id)}
                              disabled={def.components.length === 0}
                              style={{
                                width: '100%',
                                height: 30,
                                borderRadius: 5,
                                border: '1px solid rgba(74,222,128,0.4)',
                                background: 'rgba(74,222,128,0.1)',
                                color:
                                  def.components.length === 0 ? 'rgba(255,255,255,0.2)' : '#4ade80',
                                cursor: def.components.length === 0 ? 'not-allowed' : 'pointer',
                                fontSize: 14,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                transition: 'all 0.12s',
                              }}
                              onMouseEnter={(e) => {
                                if (def.components.length > 0)
                                  e.currentTarget.style.background = 'rgba(74,222,128,0.18)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(74,222,128,0.1)';
                              }}
                            >
                              <MapPin size={11} />
                              Placer sur la carte
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          ))}
      </div>

      {/* ── Footer — Ajouter un objet ── */}
      <div
        style={{ padding: '6px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}
      >
        {/* Panneau présets */}
        {showPresets && (
          <div
            style={{
              marginBottom: 6,
              borderRadius: 8,
              border: '1px solid rgba(139,92,246,0.25)',
              background: 'rgba(16,16,32,0.98)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              <span>Présets</span>
              <button
                onClick={() => setShowPresets(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                }}
              >
                <X size={10} />
              </button>
            </div>
            <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {OBJECT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    addObjectDefinition({
                      displayName: preset.label,
                      category: preset.category,
                      components: preset.components.map((c) => ({ ...c })),
                    });
                    setShowPresets(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${preset.accent}14`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>
                    {preset.emoji}
                  </span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: preset.accent }}>
                      {preset.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {preset.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Boutons Prédéfinis + Ajouter */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setShowPresets((v) => !v)}
            title="Créer depuis un préset"
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 6,
              border: showPresets
                ? '1px solid rgba(139,92,246,0.6)'
                : '1px solid rgba(255,255,255,0.1)',
              background: showPresets ? 'rgba(139,92,246,0.18)' : 'transparent',
              color: showPresets ? '#8b5cf6' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!showPresets) {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                e.currentTarget.style.color = '#8b5cf6';
              }
            }}
            onMouseLeave={(e) => {
              if (!showPresets) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
              }
            }}
          >
            ✦ Prédéfinis
          </button>
          <button
            onClick={openCreateFromSprite}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 6,
              border: '1px solid rgba(139,92,246,0.35)',
              background: 'rgba(139,92,246,0.08)',
              color: 'rgba(139,92,246,0.9)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139,92,246,0.18)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)';
              e.currentTarget.style.color = '#8b5cf6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139,92,246,0.08)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)';
              e.currentTarget.style.color = 'rgba(139,92,246,0.9)';
            }}
          >
            <Plus size={13} />
            Ajouter un objet
          </button>
        </div>
      </div>

      {/* SpriteImportDialog — création depuis sprite OU édition depuis ObjectDefinitionDialog */}
      {dialogOpen && dialogUrl && (
        <SpriteImportDialog
          isOpen={dialogOpen}
          imageSrc={dialogUrl}
          imagePath={dialogUrl}
          imageName={dialogName}
          initialConfig={dialogInitialConfig}
          onConfirm={handleSpriteConfirm}
          onCancel={() => {
            setDialogOpen(false);
            setEditingDefId(null);
          }}
        />
      )}

      {/* Hidden file input pour SpritePicker */}
      <input
        ref={spritePickerFileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            uploadSpritePickerFile(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
      />

      {/* ObjectDefinitionDialog — édition complète des composants */}
      <ObjectDefinitionDialog
        definitionId={objDefDialogId}
        onClose={() => setObjDefDialogId(null)}
        onOpenSpriteImport={(defId) => {
          setObjDefDialogId(null);
          const def = objectDefinitions.find((d) => d.id === defId);
          if (!def) return;
          const spriteComp = getSpriteComp(def);
          const url = spriteComp?.spriteAssetUrl ?? '';
          if (url) {
            openEditSprite(def);
          } else {
            // Pas encore de sprite → ouvrir le sélecteur d'image
            setSpritePickerDefId(defId);
          }
        }}
      />

      {/* SpritePicker — sélecteur d'image quand aucun sprite n'est configuré */}
      {spritePickerDefId &&
        createPortal(
          <SpritePicker
            assets={assets}
            isUploading={isSpritePickerUploading}
            onSelectExisting={handleSpritePickerSelect}
            onUploadClick={() => spritePickerFileRef.current?.click()}
            onClose={() => setSpritePickerDefId(null)}
          />,
          document.body
        )}
    </div>
  );
}

// ── SpritePicker — sélecteur d'image intégré ─────────────────────────────────

interface SpritePickerProps {
  assets: { name: string; path: string; url?: string; type?: string }[];
  isUploading: boolean;
  onSelectExisting: (url: string, name: string) => void;
  onUploadClick: () => void;
  onClose: () => void;
}

function SpritePicker({
  assets,
  isUploading,
  onSelectExisting,
  onUploadClick,
  onClose,
}: SpritePickerProps) {
  const imageAssets = assets.filter(
    (a) => a.type?.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(a.path)
  );
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9995,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 380,
          maxHeight: '70vh',
          background: '#13131f',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '13px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}
        >
          <ImagePlus size={15} style={{ color: '#a78bfa', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
              Choisir l'image du sprite
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              Importe un nouveau fichier ou sélectionne un asset existant
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 6,
              border: 'none',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            }}
            aria-label="Fermer"
          >
            <X size={12} />
          </button>
        </div>

        {/* Upload button */}
        <div style={{ padding: '10px 16px 6px', flexShrink: 0 }}>
          <button
            onClick={onUploadClick}
            disabled={isUploading}
            style={{
              width: '100%',
              height: 38,
              borderRadius: 8,
              border: '1px dashed rgba(139,92,246,0.5)',
              background: isUploading ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.07)',
              color: isUploading ? '#a78bfa' : 'rgba(139,92,246,0.9)',
              cursor: isUploading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!isUploading) e.currentTarget.style.background = 'rgba(139,92,246,0.18)';
            }}
            onMouseLeave={(e) => {
              if (!isUploading) e.currentTarget.style.background = 'rgba(139,92,246,0.07)';
            }}
          >
            {isUploading ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Chargement…
              </>
            ) : (
              <>
                <Upload size={14} /> Importer depuis l'ordinateur
              </>
            )}
          </button>
        </div>

        {/* Assets list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 10px' }}>
          {imageAssets.length === 0 ? (
            <div
              style={{
                padding: '20px 0',
                textAlign: 'center',
                fontSize: 14,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              Aucun sprite dans la bibliothèque.
              <br />
              <span style={{ fontSize: 14 }}>Importez un fichier PNG ci-dessus.</span>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '6px 4px 4px',
                }}
              >
                Bibliothèque ({imageAssets.length})
              </div>
              {imageAssets.map((a) => {
                const url = a.url ?? a.path;
                const isHov = hovered === url;
                return (
                  <button
                    key={url}
                    onClick={() => onSelectExisting(url, a.name)}
                    onMouseEnter={() => setHovered(url)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 8px',
                      borderRadius: 7,
                      border: isHov ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
                      background: isHov ? 'rgba(139,92,246,0.1)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.08s',
                    }}
                  >
                    <img
                      src={url}
                      alt={a.name}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: 'contain',
                        borderRadius: 4,
                        background: 'rgba(0,0,0,0.4)',
                        flexShrink: 0,
                        imageRendering: 'pixelated',
                      }}
                    />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: isHov ? '#c4b5fd' : 'rgba(255,255,255,0.8)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.3)',
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {url.split('/').pop()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
