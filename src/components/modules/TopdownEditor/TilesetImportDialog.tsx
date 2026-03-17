/**
 * TilesetImportDialog — Configuration de la grille de découpe d'un tileset
 *
 * Utilise :
 * - @radix-ui/react-dialog   → accessibilité, Escape, focus trap
 * - react-zoom-pan-pinch     → preview zoomable de la grille
 *
 * @module components/modules/TopdownEditor/TilesetImportDialog
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Grid3X3, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { TILESET_CATEGORIES } from '@/types/tileset';
import type { TilesetConfig, HitboxDef } from '@/types/tileset';

// ── Types ────────────────────────────────────────────────────────────────────

interface TilesetImportDialogProps {
  isOpen: boolean;
  imageSrc: string;
  imagePath: string;
  imageName?: string;
  initialConfig?: TilesetConfig;
  onConfirm: (imagePath: string, config: TilesetConfig) => void;
  onCancel: () => void;
}

interface ImgSize {
  w: number;
  h: number;
}

interface SelectedCell {
  col: number;
  row: number;
}

// ── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '16×16', w: 16, h: 16 },
  { label: '32×32', w: 32, h: 32 },
  { label: '48×48', w: 48, h: 48 },
  { label: '64×64', w: 64, h: 64 },
];

const DEFAULT_HITBOX: HitboxDef = { xPct: 10, yPct: 10, wPct: 80, hPct: 80 };
const PREVIEW_PX = 96; // Canvas preview size in px

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts a raw filename into a readable display name. */
function cleanFileName(raw: string): string {
  const noExt = raw.replace(/\.[^.]+$/, '');
  const noHash = noExt.replace(/-\d{8,}$/, '');
  const spaced = noHash.replace(/[-_]+/g, ' ').trim();
  const titled = spaced.replace(/\b\w/g, (c) => c.toUpperCase());
  if (!titled || /^\d+$/.test(titled)) return '';
  return titled.slice(0, 40);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TilesetImportDialog({
  isOpen,
  imageSrc,
  imagePath,
  imageName,
  initialConfig,
  onConfirm,
  onCancel,
}: TilesetImportDialogProps) {
  const [tileW, setTileW] = useState(initialConfig?.tileW ?? 32);
  const [tileH, setTileH] = useState(initialConfig?.tileH ?? 32);
  const [margin, setMargin] = useState(initialConfig?.margin ?? 0);
  const [spacing, setSpacing] = useState(initialConfig?.spacing ?? 0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [category, setCategory] = useState<string>(initialConfig?.category ?? 'divers');
  const [displayName, setDisplayName] = useState<string>(
    initialConfig?.displayName ?? cleanFileName(imageName ?? '')
  );
  const [imgSize, setImgSize] = useState<ImgSize | null>(null);

  // ── Hitbox state ─────────────────────────────────────────────────────────
  const [hitboxMap, setHitboxMap] = useState<Record<string, HitboxDef>>(
    initialConfig?.hitboxMap ?? {}
  );
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [hitboxDraft, setHitboxDraft] = useState<HitboxDef>({ ...DEFAULT_HITBOX });
  const hitboxCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset state when dialog opens with new image
  useEffect(() => {
    if (isOpen) {
      setTileW(initialConfig?.tileW ?? 32);
      setTileH(initialConfig?.tileH ?? 32);
      setMargin(initialConfig?.margin ?? 0);
      setSpacing(initialConfig?.spacing ?? 0);
      setShowAdvanced(false);
      setImgSize(null);
      setCategory(initialConfig?.category ?? 'divers');
      setDisplayName(initialConfig?.displayName ?? cleanFileName(imageName ?? ''));
      setHitboxMap(initialConfig?.hitboxMap ?? {});
      setSelectedCell(null);
      setHitboxDraft({ ...DEFAULT_HITBOX });
    }
  }, [isOpen, imagePath, initialConfig, imageName]);

  // Detect image dimensions
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // ── Grid computation ───────────────────────────────────────────────────────
  const eTileW = Math.max(1, tileW);
  const eTileH = Math.max(1, tileH);
  const innerW = imgSize ? imgSize.w - margin * 2 : 0;
  const innerH = imgSize ? imgSize.h - margin * 2 : 0;
  const cols = imgSize && eTileW > 0 ? Math.floor((innerW + spacing) / (eTileW + spacing)) : 0;
  const rows = imgSize && eTileH > 0 ? Math.floor((innerH + spacing) / (eTileH + spacing)) : 0;
  const totalTiles = cols * rows;

  // ── Clé hitbox map pour une cellule (col, row) ────────────────────────────
  const cellKey = useCallback(
    (col: number, row: number): string => {
      const tileX = eTileW > 0 ? margin + col * (eTileW + spacing) : 0;
      const tileY = eTileH > 0 ? margin + row * (eTileH + spacing) : 0;
      return `${tileX}_${tileY}`;
    },
    [margin, spacing, eTileW, eTileH]
  );

  // ── Canvas preview — redraw when selection or draft changes ───────────────
  useEffect(() => {
    if (!selectedCell || !hitboxCanvasRef.current || !imageSrc) return;
    const canvas = hitboxCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      canvas.width = PREVIEW_PX;
      canvas.height = PREVIEW_PX;

      // Checkerboard background (transparency indicator)
      const sz = 8;
      for (let cy = 0; cy < PREVIEW_PX; cy += sz) {
        for (let cx = 0; cx < PREVIEW_PX; cx += sz) {
          ctx.fillStyle =
            (Math.floor(cx / sz) + Math.floor(cy / sz)) % 2 === 0 ? '#3a3a3a' : '#555';
          ctx.fillRect(cx, cy, sz, sz);
        }
      }

      const srcX = margin + selectedCell.col * (eTileW + spacing);
      const srcY = margin + selectedCell.row * (eTileH + spacing);
      ctx.drawImage(img, srcX, srcY, eTileW, eTileH, 0, 0, PREVIEW_PX, PREVIEW_PX);

      // Hitbox overlay
      const hx = (hitboxDraft.xPct / 100) * PREVIEW_PX;
      const hy = (hitboxDraft.yPct / 100) * PREVIEW_PX;
      const hw = (hitboxDraft.wPct / 100) * PREVIEW_PX;
      const hh = (hitboxDraft.hPct / 100) * PREVIEW_PX;
      ctx.fillStyle = 'rgba(255, 80, 80, 0.3)';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx, hy, hw, hh);
    };
    img.src = imageSrc;
    return () => {
      cancelled = true;
    };
  }, [selectedCell, hitboxDraft, imageSrc, margin, spacing, eTileW, eTileH]);

  // ── Hitbox actions ────────────────────────────────────────────────────────
  const applyHitbox = useCallback(() => {
    if (!selectedCell) return;
    const key = cellKey(selectedCell.col, selectedCell.row);
    setHitboxMap((prev) => ({ ...prev, [key]: { ...hitboxDraft } }));
  }, [selectedCell, hitboxDraft, cellKey]);

  const deleteHitbox = useCallback(() => {
    if (!selectedCell) return;
    const key = cellKey(selectedCell.col, selectedCell.row);
    setHitboxMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [selectedCell, cellKey]);

  const handleCellClick = useCallback(
    (col: number, row: number) => {
      const key = cellKey(col, row);
      const existing = hitboxMap[key];
      setSelectedCell({ col, row });
      setHitboxDraft(existing ? { ...existing } : { ...DEFAULT_HITBOX });
    },
    [cellKey, hitboxMap]
  );

  const handleConfirm = () => {
    onConfirm(imagePath, {
      tileW: eTileW,
      tileH: eTileH,
      margin,
      spacing,
      category,
      hitboxMap: Object.keys(hitboxMap).length > 0 ? hitboxMap : undefined,
      displayName: displayName.trim() || undefined,
    });
  };

  const hitboxCount = Object.keys(hitboxMap).length;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
          }}
        />

        {/* Content */}
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            background: 'var(--color-surface-elevated, #1e1e2e)',
            border: '1px solid var(--color-border-base, rgba(255,255,255,0.12))',
            borderRadius: 14,
            boxShadow: '0 20px 56px rgba(0,0,0,0.75)',
            width: 720,
            maxWidth: '95vw',
            maxHeight: '94vh',
            overflowY: 'auto',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
          onPointerDownOutside={onCancel}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Grid3X3 size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Dialog.Title
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--color-text-base)',
                }}
              >
                Configurer le tileset
              </Dialog.Title>
              {imageName && (
                <Dialog.Description
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: 'var(--color-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {imageName}
                </Dialog.Description>
              )}
            </div>
            {imgSize && (
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-secondary)',
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                {imgSize.w}×{imgSize.h}px
              </span>
            )}
          </div>

          {/* Display name + Category */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={sectionLabel}>Nom d'affichage</p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={imageName ?? 'Nom du tileset'}
                style={textInputStyle}
              />
            </div>
            <div style={{ flexShrink: 0 }}>
              <p style={sectionLabel}>Catégorie</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {TILESET_CATEGORIES.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      title={cat.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 9px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        border: active
                          ? '1.5px solid var(--color-primary)'
                          : '1px solid var(--color-border-base)',
                        background: active ? 'var(--color-primary-muted)' : 'transparent',
                        color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontSize: 12,
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hitbox de collision */}
          <div>
            <p style={sectionLabel}>
              Hitbox de collision
              {hitboxCount > 0 && (
                <span style={{ marginLeft: 6, color: 'var(--color-primary)', fontWeight: 700 }}>
                  · {hitboxCount} tuile{hitboxCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
              Cliquer sur une cellule dans l'aperçu pour définir un rectangle de collision sub-tuile
              (AABB). Indépendant de la grille — précision pixel.
            </p>

            {/* Hitbox editor panel — shown when a cell is selected */}
            {selectedCell !== null && (
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 12,
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,210,0,0.3)',
                  marginBottom: 8,
                }}
              >
                {/* Canvas preview */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p
                    style={{
                      ...sectionLabel,
                      margin: 0,
                      color: 'rgba(255,210,0,0.9)',
                    }}
                  >
                    Cellule {selectedCell.col},{selectedCell.row}
                  </p>
                  <canvas
                    ref={hitboxCanvasRef}
                    width={PREVIEW_PX}
                    height={PREVIEW_PX}
                    style={{
                      display: 'block',
                      imageRendering: 'pixelated',
                      borderRadius: 4,
                      border: '1px solid rgba(255,210,0,0.4)',
                      width: PREVIEW_PX,
                      height: PREVIEW_PX,
                    }}
                  />
                </div>

                {/* Sliders */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {(
                    [
                      { key: 'xPct', label: 'Offset X' },
                      { key: 'yPct', label: 'Offset Y' },
                      { key: 'wPct', label: 'Largeur' },
                      { key: 'hPct', label: 'Hauteur' },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          width: 58,
                          flexShrink: 0,
                        }}
                      >
                        {label}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={hitboxDraft[key]}
                        onChange={(e) =>
                          setHitboxDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                        }
                        style={{ flex: 1, accentColor: 'rgba(255,80,80,0.9)' }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,140,100,1)',
                          fontWeight: 700,
                          width: 36,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {hitboxDraft[key]}%
                      </span>
                    </div>
                  ))}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <button
                      onClick={applyHitbox}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: 'var(--color-primary)',
                        color: '#fff',
                      }}
                    >
                      ✓ Appliquer
                    </button>
                    <button
                      onClick={deleteHitbox}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 5,
                        fontSize: 12,
                        cursor: 'pointer',
                        border: '1px solid rgba(255,80,80,0.5)',
                        background: 'rgba(255,80,80,0.1)',
                        color: 'rgba(255,140,140,1)',
                      }}
                    >
                      🗑 Supprimer
                    </button>
                    <button
                      onClick={() => setSelectedCell(null)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 5,
                        fontSize: 12,
                        cursor: 'pointer',
                        border: '1px solid var(--color-border-base)',
                        background: 'transparent',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedCell === null && hitboxCount === 0 && (
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                → Cliquer sur une cellule dans l'aperçu ci-dessous pour définir sa hitbox
              </p>
            )}
          </div>

          {/* Tile size presets */}
          <div>
            <p style={sectionLabel}>Taille de tuile</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {PRESETS.map((p) => {
                const active = tileW === p.w && tileH === p.h;
                return (
                  <button
                    key={p.label}
                    onClick={() => {
                      setTileW(p.w);
                      setTileH(p.h);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      border: active
                        ? '1.5px solid var(--color-primary)'
                        : '1.5px solid var(--color-border-base)',
                      background: active ? 'var(--color-primary-muted)' : 'transparent',
                      color: active ? 'var(--color-primary)' : 'var(--color-text-base)',
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={tileW}
                  min={1}
                  max={512}
                  onChange={(e) => setTileW(Math.max(1, parseInt(e.target.value) || 1))}
                  style={numInputStyle}
                  title="Largeur tuile (px)"
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>×</span>
                <input
                  type="number"
                  value={tileH}
                  min={1}
                  max={512}
                  onChange={(e) => setTileH(Math.max(1, parseInt(e.target.value) || 1))}
                  style={numInputStyle}
                  title="Hauteur tuile (px)"
                />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>px</span>
              </div>
              {totalTiles > 0 && (
                <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>
                  → {cols}×{rows} = {totalTiles} tuiles
                </span>
              )}
            </div>
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
              }}
            >
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Avancé (margin, spacing)
            </button>
            {showAdvanced && (
              <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={sectionLabel}>Margin</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <input
                      type="number"
                      value={margin}
                      min={0}
                      max={64}
                      onChange={(e) => setMargin(Math.max(0, parseInt(e.target.value) || 0))}
                      style={numInputStyle}
                    />
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>px</span>
                  </div>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={sectionLabel}>Espacement</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <input
                      type="number"
                      value={spacing}
                      min={0}
                      max={64}
                      onChange={(e) => setSpacing(Math.max(0, parseInt(e.target.value) || 0))}
                      style={numInputStyle}
                    />
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>px</span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Preview — zoomable */}
          <div>
            <p style={sectionLabel}>
              Aperçu — scroll molette pour zoomer · clic pour sélectionner une cellule
            </p>
            <TransformWrapper minScale={0.15} maxScale={10} initialScale={1} wheel={{ step: 0.15 }}>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div
                    style={{ display: 'flex', gap: 4, marginBottom: 5, justifyContent: 'flex-end' }}
                  >
                    <button onClick={() => zoomOut()} style={previewBtn} title="Zoom arrière">
                      <ZoomOut size={12} />
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      style={previewBtn}
                      title="Réinitialiser"
                    >
                      <Maximize2 size={12} />
                    </button>
                    <button onClick={() => zoomIn()} style={previewBtn} title="Zoom avant">
                      <ZoomIn size={12} />
                    </button>
                  </div>
                  <div
                    style={{
                      overflow: 'hidden',
                      maxHeight: 360,
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid var(--color-border-base)',
                      borderRadius: 8,
                      cursor: 'grab',
                    }}
                  >
                    <TransformComponent
                      wrapperStyle={{ width: '100%', maxHeight: 360, display: 'block' }}
                      contentStyle={{ position: 'relative', display: 'inline-block' }}
                    >
                      <img
                        src={imageSrc}
                        alt="tileset preview"
                        style={{ display: 'block', imageRendering: 'pixelated', maxWidth: '100%' }}
                        draggable={false}
                      />
                      {/* Grid overlay — cellules cliquables, hitbox overlay */}
                      {cols > 0 && rows > 0 && imgSize && (
                        <div
                          style={{
                            position: 'absolute',
                            top: margin,
                            left: margin,
                          }}
                        >
                          {Array.from({ length: rows }).map((_, r) =>
                            Array.from({ length: cols }).map((_, c) => {
                              const key = cellKey(c, r);
                              const hitbox = hitboxMap[key];
                              const isSelected = selectedCell?.col === c && selectedCell?.row === r;
                              return (
                                <div
                                  key={`${r}-${c}`}
                                  title={
                                    isSelected
                                      ? `Sélectionné — modifier dans le panneau ci-dessus`
                                      : hitbox
                                        ? `Hitbox définie — clic pour modifier`
                                        : `Cellule ${c},${r} — clic pour ajouter une hitbox`
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCellClick(c, r);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    left: c * (eTileW + spacing),
                                    top: r * (eTileH + spacing),
                                    width: eTileW,
                                    height: eTileH,
                                    boxSizing: 'border-box',
                                    border: isSelected
                                      ? '2px solid rgba(255,210,0,0.95)'
                                      : hitbox
                                        ? '1.5px solid rgba(255,140,0,0.7)'
                                        : '1px solid var(--color-primary-60)',
                                    background: isSelected
                                      ? 'rgba(255,210,0,0.1)'
                                      : 'rgba(139,92,246,0.04)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {/* Hitbox preview overlay within the cell */}
                                  {hitbox && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        left: `${hitbox.xPct}%`,
                                        top: `${hitbox.yPct}%`,
                                        width: `${hitbox.wPct}%`,
                                        height: `${hitbox.hPct}%`,
                                        background: isSelected
                                          ? 'rgba(255,210,0,0.3)'
                                          : 'rgba(255,80,80,0.35)',
                                        border: isSelected
                                          ? '1px solid rgba(255,210,0,0.8)'
                                          : '1px solid rgba(255,80,80,0.7)',
                                        boxSizing: 'border-box',
                                        pointerEvents: 'none',
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </TransformComponent>
                  </div>
                </>
              )}
            </TransformWrapper>
            {imgSize && totalTiles === 0 && (
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 12,
                  color: 'var(--color-text-warning, #f59e0b)',
                }}
              >
                ⚠️ Taille de tuile trop grande pour cette image.
              </p>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              paddingTop: 4,
              borderTop: '1px solid var(--color-border-base)',
            }}
          >
            <Dialog.Close asChild>
              <button style={cancelBtn}>Annuler</button>
            </Dialog.Close>
            <button
              onClick={handleConfirm}
              disabled={totalTiles === 0 && !!imgSize}
              style={{ ...confirmBtn, opacity: totalTiles === 0 && imgSize ? 0.5 : 1 }}
            >
              Confirmer ({totalTiles > 0 ? `${totalTiles} tuiles` : `${eTileW}×${eTileH}`})
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  margin: '0 0 6px',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const textInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: 5,
  boxSizing: 'border-box',
  border: '1px solid var(--color-border-base)',
  background: 'rgba(0,0,0,0.3)',
  color: 'var(--color-text-base)',
  fontSize: 13,
};
const numInputStyle: React.CSSProperties = {
  width: 60,
  padding: '5px 6px',
  borderRadius: 4,
  textAlign: 'center',
  border: '1px solid var(--color-border-base)',
  background: 'rgba(0,0,0,0.3)',
  color: 'var(--color-text-base)',
  fontSize: 13,
};
const previewBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  borderRadius: 4,
  cursor: 'pointer',
  border: '1px solid var(--color-border-base)',
  background: 'rgba(0,0,0,0.3)',
  color: 'var(--color-text-muted)',
};
const cancelBtn: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  border: '1px solid var(--color-border-base)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
};
const confirmBtn: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  background: 'var(--color-primary)',
  color: '#fff',
};
