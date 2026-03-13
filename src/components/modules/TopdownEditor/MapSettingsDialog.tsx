/**
 * MapSettingsDialog — Redimensionner / renommer une carte existante
 *
 * Permet de modifier : nom, largeur (tuiles), hauteur (tuiles), taille de tuile (px).
 * Les tuiles hors des nouvelles bornes sont supprimées automatiquement.
 *
 * @module components/modules/TopdownEditor/MapSettingsDialog
 */

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useMapsStore } from '@/stores/mapsStore';
import type { MapMetadata } from '@/types/map';
import { MAP_CONSTRAINTS, MAP_WARNING_COLORS } from '@/config/mapEditorConfig';

// Presets courants (largeur × hauteur tuiles, taille px)
const PRESETS = [
  { label: 'Petit (20×15, 32px)', w: 20, h: 15, ts: 32 },
  { label: 'Moyen (40×30, 32px)', w: 40, h: 30, ts: 32 },
  { label: 'Grand (80×60, 32px)', w: 80, h: 60, ts: 32 },
  { label: 'Micro (16×10, 16px)', w: 16, h: 10, ts: 16 },
  { label: 'XL (100×75, 32px)',   w: 100, h: 75, ts: 32 },
];

interface MapSettingsDialogProps {
  map: MapMetadata;
  onClose: () => void;
}

export default function MapSettingsDialog({ map, onClose }: MapSettingsDialogProps) {
  const resizeMap = useMapsStore(s => s.resizeMap);

  const [name, setName] = useState(map.name);
  const [width, setWidth] = useState(String(map.widthTiles));
  const [height, setHeight] = useState(String(map.heightTiles));
  const [tileSize, setTileSize] = useState(String(map.tileSize));

  const wNum = parseInt(width, 10);
  const hNum = parseInt(height, 10);
  const tsNum = parseInt(tileSize, 10);

  const isValid = name.trim().length > 0
    && !isNaN(wNum) && wNum >= MAP_CONSTRAINTS.WIDTH.MIN     && wNum <= MAP_CONSTRAINTS.WIDTH.MAX
    && !isNaN(hNum) && hNum >= MAP_CONSTRAINTS.HEIGHT.MIN    && hNum <= MAP_CONSTRAINTS.HEIGHT.MAX
    && !isNaN(tsNum) && tsNum >= MAP_CONSTRAINTS.TILE_SIZE.MIN && tsNum <= MAP_CONSTRAINTS.TILE_SIZE.MAX;

  const willShrink = isValid && (wNum < map.widthTiles || hNum < map.heightTiles);
  const willChangeTileSize = isValid && tsNum !== map.tileSize;

  function applyPreset(p: typeof PRESETS[0]) {
    setWidth(String(p.w));
    setHeight(String(p.h));
    setTileSize(String(p.ts));
  }

  function handleConfirm() {
    if (!isValid) return;
    resizeMap(map.id, name.trim(), wNum, hNum, tsNum);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && isValid) handleConfirm();
    if (e.key === 'Escape') onClose();
  }

  // Trap focus inside dialog
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => { prev?.focus(); };
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paramètres de la carte"
        onKeyDown={handleKeyDown}
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-base)',
          borderRadius: 8,
          width: 380,
          padding: '20px 24px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        {/* Header */}
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-base)' }}>
          ⚙ Paramètres de la carte
        </p>

        {/* Presets */}
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Présets
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                style={{
                  padding: '3px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
                  border: '1px solid var(--color-border-base)',
                  background: 'transparent', color: 'var(--color-text-muted)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Field label="Nom">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
            placeholder="Nom de la carte"
          />
        </Field>

        {/* Dimensions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="Largeur (tuiles)">
            <input type="number" min={MAP_CONSTRAINTS.WIDTH.MIN} max={MAP_CONSTRAINTS.WIDTH.MAX} value={width} onChange={e => setWidth(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Hauteur (tuiles)">
            <input type="number" min={MAP_CONSTRAINTS.HEIGHT.MIN} max={MAP_CONSTRAINTS.HEIGHT.MAX} value={height} onChange={e => setHeight(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Tuile (px)">
            <input type="number" min={MAP_CONSTRAINTS.TILE_SIZE.MIN} max={MAP_CONSTRAINTS.TILE_SIZE.MAX} value={tileSize} onChange={e => setTileSize(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        {/* Info taille pixel */}
        {isValid && (
          <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-muted)' }}>
            Carte : {wNum * tsNum} × {hNum * tsNum} px
          </p>
        )}

        {/* Warning shrink */}
        {(willShrink || willChangeTileSize) && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px',
            background: MAP_WARNING_COLORS.FILL, border: `1px solid ${MAP_WARNING_COLORS.BORDER}`, borderRadius: 6,
          }}>
            <AlertTriangle size={14} style={{ color: MAP_WARNING_COLORS.TEXT, flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11, color: MAP_WARNING_COLORS.TEXT, lineHeight: 1.5 }}>
              {willShrink && <>Les tuiles hors des nouvelles dimensions seront supprimées.<br /></>}
              {willChangeTileSize && <>Changer la taille de tuile ne rescale pas les tuiles existantes.</>}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 5, cursor: 'pointer',
              border: '1px solid var(--color-border-base)',
              background: 'transparent', color: 'var(--color-text-muted)',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 5, cursor: isValid ? 'pointer' : 'not-allowed',
              border: 'none',
              background: isValid ? 'var(--color-primary)' : 'rgba(139,92,246,0.3)',
              color: 'white', fontWeight: 600,
            }}
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border-base)',
  borderRadius: 4,
  color: 'var(--color-text-base)',
  fontSize: 12,
  padding: '5px 7px',
  boxSizing: 'border-box',
  outline: 'none',
};
