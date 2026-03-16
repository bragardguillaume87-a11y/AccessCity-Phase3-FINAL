/**
 * TilesetImportDialog — Configuration de la grille de découpe d'un tileset
 *
 * Utilise :
 * - @radix-ui/react-dialog   → accessibilité, Escape, focus trap
 * - react-zoom-pan-pinch     → preview zoomable de la grille
 *
 * @module components/modules/TopdownEditor/TilesetImportDialog
 */

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Grid3X3, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { TILESET_CATEGORIES } from '@/types/tileset';
import type { TilesetConfig } from '@/types/tileset';

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

// ── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '16×16', w: 16, h: 16 },
  { label: '32×32', w: 32, h: 32 },
  { label: '48×48', w: 48, h: 48 },
  { label: '64×64', w: 64, h: 64 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts a raw filename into a readable display name.
 *  - Removes file extension
 *  - Strips trailing numeric hashes (e.g. '-1773573693258')
 *  - Replaces hyphens/underscores with spaces, trims
 *  - Title-cases each word
 *  - Returns '' if result is empty or all-numeric
 */
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
    }
  }, [isOpen, imagePath, initialConfig, imageName]);

  // Detect image dimensions
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // ── Grid computation (auto depuis dimensions image) ───────────────────────
  const eTileW = Math.max(1, tileW);
  const eTileH = Math.max(1, tileH);
  const innerW = imgSize ? imgSize.w - margin * 2 : 0;
  const innerH = imgSize ? imgSize.h - margin * 2 : 0;
  const cols = imgSize && eTileW > 0 ? Math.floor((innerW + spacing) / (eTileW + spacing)) : 0;
  const rows = imgSize && eTileH > 0 ? Math.floor((innerH + spacing) / (eTileH + spacing)) : 0;
  const totalTiles = cols * rows;

  const handleConfirm = () => {
    onConfirm(imagePath, {
      tileW: eTileW,
      tileH: eTileH,
      margin,
      spacing,
      category,
      displayName: displayName.trim() || undefined,
    });
  };

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
            <p style={sectionLabel}>Aperçu — scroll molette pour zoomer</p>
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
                      {/* Grid overlay */}
                      {cols > 0 && rows > 0 && imgSize && (
                        <div
                          style={{
                            position: 'absolute',
                            top: margin,
                            left: margin,
                            pointerEvents: 'none',
                          }}
                        >
                          {Array.from({ length: rows }).map((_, r) =>
                            Array.from({ length: cols }).map((_, c) => (
                              <div
                                key={`${r}-${c}`}
                                style={{
                                  position: 'absolute',
                                  left: c * (eTileW + spacing),
                                  top: r * (eTileH + spacing),
                                  width: eTileW,
                                  height: eTileH,
                                  boxSizing: 'border-box',
                                  border: '1px solid var(--color-primary-60)',
                                  background: 'var(--color-primary-04)',
                                }}
                              />
                            ))
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
