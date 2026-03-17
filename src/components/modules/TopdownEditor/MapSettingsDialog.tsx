/**
 * MapSettingsDialog — Redimensionner / renommer une carte existante
 *
 * Permet de modifier : nom, largeur (tuiles), hauteur (tuiles), taille de tuile (px).
 * Les tuiles hors des nouvelles bornes sont supprimées automatiquement.
 *
 * @module components/modules/TopdownEditor/MapSettingsDialog
 */

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useMapsStore } from '@/stores/mapsStore';
import type { MapMetadata } from '@/types/map';
import type { SceneEffectConfig, SceneEffectType } from '@/types/sceneEffect';
import { MAP_CONSTRAINTS, MAP_WARNING_COLORS } from '@/config/mapEditorConfig';
import { SOUND_BRICKS } from '@/config/soundBricks';
import { SCENE_EFFECT_TYPES, makeDefaultEffect } from '@/config/sceneEffects';

// Presets courants (largeur × hauteur tuiles, taille px)
const PRESETS = [
  { label: 'Petit (20×15, 32px)', w: 20, h: 15, ts: 32 },
  { label: 'Moyen (40×30, 32px)', w: 40, h: 30, ts: 32 },
  { label: 'Grand (80×60, 32px)', w: 80, h: 60, ts: 32 },
  { label: 'Micro (16×10, 16px)', w: 16, h: 10, ts: 16 },
  { label: 'XL (100×75, 32px)', w: 100, h: 75, ts: 32 },
];

interface MapSettingsDialogProps {
  map: MapMetadata;
  onClose: () => void;
}

export default function MapSettingsDialog({ map, onClose }: MapSettingsDialogProps) {
  const resizeMap = useMapsStore((s) => s.resizeMap);

  const [name, setName] = useState(map.name);
  const [width, setWidth] = useState(String(map.widthTiles));
  const [height, setHeight] = useState(String(map.heightTiles));
  const [tileSize, setTileSize] = useState(String(map.tileSize));
  const [spawnCx, setSpawnCx] = useState(String(map.playerStartCx ?? 2));
  const [spawnCy, setSpawnCy] = useState(String(map.playerStartCy ?? 2));
  const [bgmBrickId, setBgmBrickId] = useState(map.bgmBrickId ?? '');
  const [sceneEffect, setSceneEffect] = useState<SceneEffectConfig>(
    map.sceneEffect ?? { type: 'none' }
  );

  const wNum = parseInt(width, 10);
  const hNum = parseInt(height, 10);
  const tsNum = parseInt(tileSize, 10);

  const spawnCxNum = parseInt(spawnCx, 10);
  const spawnCyNum = parseInt(spawnCy, 10);

  const isValid =
    name.trim().length > 0 &&
    !isNaN(wNum) &&
    wNum >= MAP_CONSTRAINTS.WIDTH.MIN &&
    wNum <= MAP_CONSTRAINTS.WIDTH.MAX &&
    !isNaN(hNum) &&
    hNum >= MAP_CONSTRAINTS.HEIGHT.MIN &&
    hNum <= MAP_CONSTRAINTS.HEIGHT.MAX &&
    !isNaN(tsNum) &&
    tsNum >= MAP_CONSTRAINTS.TILE_SIZE.MIN &&
    tsNum <= MAP_CONSTRAINTS.TILE_SIZE.MAX &&
    !isNaN(spawnCxNum) &&
    spawnCxNum >= 0 &&
    !isNaN(spawnCyNum) &&
    spawnCyNum >= 0;

  const willShrink = isValid && (wNum < map.widthTiles || hNum < map.heightTiles);
  const willChangeTileSize = isValid && tsNum !== map.tileSize;

  function applyPreset(p: (typeof PRESETS)[0]) {
    setWidth(String(p.w));
    setHeight(String(p.h));
    setTileSize(String(p.ts));
  }

  const updateMapMetadata = useMapsStore((s) => s.updateMapMetadata);

  // Valeur d'origine — utilisée pour restaurer si l'utilisateur annule
  const originalSceneEffect = useRef(map.sceneEffect);

  // Prévisualisation live : chaque changement de sceneEffect se reflète immédiatement
  // sur le canvas de la carte sans attendre la confirmation.
  useEffect(() => {
    updateMapMetadata(map.id, {
      sceneEffect: sceneEffect.type !== 'none' ? sceneEffect : undefined,
    });
  }, [sceneEffect, map.id, updateMapMetadata]);

  function handleConfirm() {
    if (!isValid) return;
    resizeMap(map.id, name.trim(), wNum, hNum, tsNum);
    updateMapMetadata(map.id, {
      playerStartCx: spawnCxNum,
      playerStartCy: spawnCyNum,
      bgmBrickId: bgmBrickId || undefined,
      sceneEffect: sceneEffect.type !== 'none' ? sceneEffect : undefined,
    });
    onClose();
  }

  function handleCancel() {
    // Restaure l'effet original avant de fermer (annulation de la préview live)
    updateMapMetadata(map.id, { sceneEffect: originalSceneEffect.current });
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && isValid) handleConfirm();
    if (e.key === 'Escape') handleCancel();
  }

  // Trap focus inside dialog
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => {
      prev?.focus();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
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
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-base)' }}>
          ⚙ Paramètres de la carte
        </p>

        {/* Presets */}
        <div>
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 11,
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Présets
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: '1px solid var(--color-border-base)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
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
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            placeholder="Nom de la carte"
          />
        </Field>

        {/* Dimensions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="Largeur (tuiles)">
            <input
              type="number"
              min={MAP_CONSTRAINTS.WIDTH.MIN}
              max={MAP_CONSTRAINTS.WIDTH.MAX}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Hauteur (tuiles)">
            <input
              type="number"
              min={MAP_CONSTRAINTS.HEIGHT.MIN}
              max={MAP_CONSTRAINTS.HEIGHT.MAX}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Tuile (px)">
            <input
              type="number"
              min={MAP_CONSTRAINTS.TILE_SIZE.MIN}
              max={MAP_CONSTRAINTS.TILE_SIZE.MAX}
              value={tileSize}
              onChange={(e) => setTileSize(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Info taille pixel */}
        {isValid && (
          <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-secondary)' }}>
            Carte : {wNum * tsNum} × {hNum * tsNum} px
          </p>
        )}

        {/* Spawn position */}
        <div>
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 11,
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            ▶ Position de départ du joueur
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Colonne (cx)">
              <input
                type="number"
                min={0}
                value={spawnCx}
                onChange={(e) => setSpawnCx(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Rangée (cy)">
              <input
                type="number"
                min={0}
                value={spawnCy}
                onChange={(e) => setSpawnCy(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-text-secondary)' }}>
            Visible dans l'éditeur (marqueur ▶ vert). Modifiable via clic sur la carte.
          </p>
        </div>

        {/* BGM */}
        <div>
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 11,
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            🎵 Musique de fond (BGM)
          </p>
          <select
            value={bgmBrickId}
            onChange={(e) => setBgmBrickId(e.target.value)}
            style={{ ...inputStyle, fontSize: 12 }}
          >
            <option value="">🔇 Aucune musique</option>
            {SOUND_BRICKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.emoji} {b.label}
              </option>
            ))}
          </select>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-text-secondary)' }}>
            Jouée en boucle dès l'entrée sur la carte.
          </p>
        </div>

        {/* Atmosphère */}
        <div>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 11,
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            🌫 Atmosphère
          </p>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {SCENE_EFFECT_TYPES.map((meta) => {
              const active = sceneEffect.type === meta.type;
              return (
                <button
                  key={meta.type}
                  type="button"
                  title={meta.description}
                  onClick={() => {
                    if (meta.type === 'none') {
                      setSceneEffect({ type: 'none' });
                    } else {
                      setSceneEffect(
                        active ? { type: 'none' } : makeDefaultEffect(meta.type as SceneEffectType)
                      );
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 5,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: active ? 700 : 400,
                    border: active
                      ? '1.5px solid var(--color-primary)'
                      : '1px solid var(--color-border-base)',
                    background: active ? 'var(--color-primary-muted)' : 'transparent',
                    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Paramètres de l'effet sélectionné */}
          {sceneEffect.type === 'rain' && (
            <>
              <EffectSliders
                params={[
                  {
                    key: 'density',
                    label: 'Densité',
                    min: 50,
                    max: 800,
                    value: sceneEffect.density,
                  },
                  { key: 'angle', label: 'Angle°', min: -30, max: 30, value: sceneEffect.angle },
                  { key: 'length', label: 'Longueur', min: 4, max: 30, value: sceneEffect.length },
                  {
                    key: 'splashScale',
                    label: 'Éclaboussures',
                    min: 0,
                    max: 2,
                    value: sceneEffect.splashScale ?? 1.0,
                    step: 0.1,
                  },
                  {
                    key: 'groundLevel',
                    label: 'Niveau sol',
                    min: 0.5,
                    max: 1,
                    value: sceneEffect.groundLevel ?? 0.82,
                    step: 0.02,
                  },
                ]}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
              <EffectColorRow
                label="Couleur"
                colorKey="color"
                value={sceneEffect.color}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
            </>
          )}
          {sceneEffect.type === 'drizzle' && (
            <>
              <EffectSliders
                params={[
                  {
                    key: 'density',
                    label: 'Densité',
                    min: 50,
                    max: 600,
                    value: sceneEffect.density,
                  },
                  { key: 'angle', label: 'Angle°', min: -20, max: 20, value: sceneEffect.angle },
                  {
                    key: 'opacity',
                    label: 'Opacité',
                    min: 0.05,
                    max: 0.4,
                    value: sceneEffect.opacity,
                    step: 0.01,
                  },
                  {
                    key: 'speed',
                    label: 'Vitesse',
                    min: 1,
                    max: 5,
                    value: sceneEffect.speed,
                    step: 0.1,
                  },
                ]}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
              <EffectColorRow
                label="Couleur"
                colorKey="color"
                value={sceneEffect.color}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
            </>
          )}
          {sceneEffect.type === 'snow' && (
            <>
              <EffectSliders
                params={[
                  {
                    key: 'density',
                    label: 'Densité',
                    min: 50,
                    max: 600,
                    value: sceneEffect.density,
                  },
                  {
                    key: 'drift',
                    label: 'Dérive',
                    min: 0,
                    max: 2,
                    value: sceneEffect.drift,
                    step: 0.05,
                  },
                  {
                    key: 'size',
                    label: 'Taille',
                    min: 1,
                    max: 8,
                    value: sceneEffect.size,
                    step: 0.5,
                  },
                ]}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
              <EffectColorRow
                label="Couleur"
                colorKey="color"
                value={sceneEffect.color}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
            </>
          )}
          {sceneEffect.type === 'fog' && (
            <>
              <EffectSliders
                params={[
                  {
                    key: 'opacity',
                    label: 'Opacité',
                    min: 0.05,
                    max: 1,
                    value: sceneEffect.opacity,
                    step: 0.05,
                  },
                  {
                    key: 'speed',
                    label: 'Vitesse',
                    min: 0.1,
                    max: 3,
                    value: sceneEffect.speed,
                    step: 0.1,
                  },
                  {
                    key: 'scale',
                    label: 'Échelle',
                    min: 0.5,
                    max: 4,
                    value: sceneEffect.scale,
                    step: 0.1,
                  },
                ]}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
              <EffectColorRow
                label="Couleur"
                colorKey="color"
                value={sceneEffect.color}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
            </>
          )}
          {sceneEffect.type === 'bloom' && (
            <EffectSliders
              params={[
                {
                  key: 'intensity',
                  label: 'Intensité',
                  min: 0.1,
                  max: 1.5,
                  value: sceneEffect.intensity,
                  step: 0.05,
                },
                { key: 'radius', label: 'Rayon', min: 1, max: 8, value: sceneEffect.radius },
                {
                  key: 'threshold',
                  label: 'Seuil',
                  min: 0.2,
                  max: 0.9,
                  value: sceneEffect.threshold,
                  step: 0.05,
                },
              ]}
              onChange={(k, v) =>
                setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
              }
            />
          )}
          {sceneEffect.type === 'godrays' && (
            <>
              <EffectSliders
                params={[
                  {
                    key: 'intensity',
                    label: 'Intensité',
                    min: 0.1,
                    max: 1,
                    value: sceneEffect.intensity,
                    step: 0.05,
                  },
                  { key: 'angle', label: 'Source X', min: -90, max: 90, value: sceneEffect.angle },
                  {
                    key: 'density',
                    label: 'Nb rayons',
                    min: 0.3,
                    max: 1.5,
                    value: sceneEffect.density,
                    step: 0.1,
                  },
                ]}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
              <EffectColorRow
                label="Couleur"
                colorKey="color"
                value={sceneEffect.color}
                onChange={(k, v) =>
                  setSceneEffect((prev) => ({ ...prev, [k]: v }) as SceneEffectConfig)
                }
              />
            </>
          )}
        </div>

        {/* Warning shrink */}
        {(willShrink || willChangeTileSize) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '8px 10px',
              background: MAP_WARNING_COLORS.FILL,
              border: `1px solid ${MAP_WARNING_COLORS.BORDER}`,
              borderRadius: 6,
            }}
          >
            <AlertTriangle
              size={14}
              style={{ color: MAP_WARNING_COLORS.TEXT, flexShrink: 0, marginTop: 1 }}
            />
            <p style={{ margin: 0, fontSize: 11, color: MAP_WARNING_COLORS.TEXT, lineHeight: 1.5 }}>
              {willShrink && (
                <>
                  Les tuiles hors des nouvelles dimensions seront supprimées.
                  <br />
                </>
              )}
              {willChangeTileSize && (
                <>Changer la taille de tuile ne rescale pas les tuiles existantes.</>
              )}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '6px 16px',
              fontSize: 12,
              borderRadius: 5,
              cursor: 'pointer',
              border: '1px solid var(--color-border-base)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            style={{
              padding: '6px 16px',
              fontSize: 12,
              borderRadius: 5,
              cursor: isValid ? 'pointer' : 'not-allowed',
              border: 'none',
              background: isValid ? 'var(--color-primary)' : 'var(--color-primary-30)',
              color: 'white',
              fontWeight: 600,
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
      <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── EffectSliders — Sliders de paramètres pour un effet atmosphérique ─────────

interface SliderParam {
  key: string;
  label: string;
  min: number;
  max: number;
  value: number;
  step?: number;
}

function EffectSliders({
  params,
  onChange,
}: {
  params: SliderParam[];
  onChange: (key: string, value: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {params.map((p) => (
        <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              color: 'var(--color-text-secondary)',
              width: 54,
              flexShrink: 0,
            }}
          >
            {p.label}
          </span>
          <input
            type="range"
            min={p.min}
            max={p.max}
            step={p.step ?? 1}
            value={p.value}
            onChange={(e) => onChange(p.key, Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--color-primary)' }}
          />
          <span
            style={{
              fontSize: 11,
              color: 'var(--color-primary)',
              fontWeight: 700,
              width: 32,
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            {typeof p.value === 'number' && p.step && p.step < 1 ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── colorToHex — convertit rgba(...) ou hex en #rrggbb pour <input type="color"> ─
function colorToHex(color: string): string {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    return '#' + [m[1], m[2], m[3]].map((v) => parseInt(v).toString(16).padStart(2, '0')).join('');
  }
  if (color.startsWith('#') && color.length >= 7) return color.slice(0, 7);
  return '#a0c8ff';
}

// ── EffectColorRow — sélecteur de couleur inline ───────────────────────────────

function EffectColorRow({
  label,
  colorKey,
  value,
  onChange,
}: {
  label: string;
  colorKey: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const hex = colorToHex(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <span
        style={{ fontSize: 10, color: 'var(--color-text-secondary)', width: 54, flexShrink: 0 }}
      >
        {label}
      </span>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          flex: 1,
        }}
      >
        {/* Swatch cliquable */}
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            border: '1px solid var(--color-border-base)',
            background: hex,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontFamily: 'monospace',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {hex}
        </span>
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(colorKey, e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          tabIndex={-1}
        />
      </label>
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
