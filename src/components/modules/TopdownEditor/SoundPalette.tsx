/**
 * SoundPalette — Palette de briques sonores procédurales (Sprint A)
 *
 * Interface no-code pour enfants 8-12 ans :
 *   - Grille de briques colorées (emoji + label français)
 *   - Clic sur une brique → aperçu sonore immédiat
 *   - Sound Playground : 3 sliders enfants (Hauteur, Longueur, Glissement)
 *   - Bouton "🔊 Rejouer" pour entendre les modifications
 *
 * Sprint B : les briques pourront être assignées à des zones de la carte.
 *
 * @module components/modules/TopdownEditor/SoundPalette
 */

import { useState, useCallback, useRef } from 'react';
import { sfxr, Params } from 'jsfxr';
import {
  SOUND_BRICKS,
  SOUND_BRICK_CATEGORIES,
  childParamsToJsfxr,
} from '@/config/soundBricks';
import type { SoundBrick, SoundBrickParams } from '@/config/soundBricks';

// ── Constantes ────────────────────────────────────────────────────────────────

/** Délai minimum entre deux aperçus sonores (ms) — évite la saturation */
const PREVIEW_THROTTLE_MS = 120;

// ── Utilitaire de lecture ─────────────────────────────────────────────────────

/**
 * Joue une brique sonore avec les paramètres enfants donnés.
 * Utilise jsfxr : algorithme preset → overrides pitch/length/slide → play.
 */
function playBrick(brick: SoundBrick, params: SoundBrickParams): void {
  try {
    const p = new Params();
    // Appel du générateur de preset (ex: p.jump(), p.pickupCoin()…)
    (p as unknown as Record<string, () => void>)[brick.algorithm]?.();
    // Application des overrides enfants
    const overrides = childParamsToJsfxr(params);
    p.p_base_freq = overrides.p_base_freq;
    p.p_env_decay  = overrides.p_env_decay;
    p.p_freq_ramp  = overrides.p_freq_ramp;
    sfxr.play(p);
  } catch {
    // Silencieux — AudioContext non déverrouillé ou environnement sans audio
  }
}

// ── Slider enfant ─────────────────────────────────────────────────────────────

interface ChildSliderProps {
  emoji: string;
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}

function ChildSlider({ emoji, label, hint, value, onChange }: ChildSliderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-base)' }}>
          {emoji} {label}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{hint}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={e => onChange(Number(e.target.value) / 100)}
        style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
          {label === 'Glissement' ? '⬇ descend' : '◀ moins'}
        </span>
        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
          {label === 'Glissement' ? 'monte ⬆' : 'plus ▶'}
        </span>
      </div>
    </div>
  );
}

// ── Brique sonore (carte) ─────────────────────────────────────────────────────

interface BrickCardProps {
  brick: SoundBrick;
  isSelected: boolean;
  onSelect: (brick: SoundBrick) => void;
  onPreview: (brick: SoundBrick) => void;
}

function BrickCard({ brick, isSelected, onSelect, onPreview }: BrickCardProps) {
  return (
    <button
      onClick={() => { onSelect(brick); onPreview(brick); }}
      title={`${brick.label} — cliquez pour entendre`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        padding: '8px 4px',
        borderRadius: 8,
        border: isSelected
          ? `2px solid ${brick.color}`
          : '2px solid transparent',
        background: isSelected
          ? `${brick.color}22`
          : 'rgba(255,255,255,0.05)',
        cursor: 'pointer',
        transition: 'all 0.1s',
        boxShadow: isSelected ? `0 0 10px ${brick.color}55` : 'none',
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{brick.emoji}</span>
      <span style={{
        fontSize: 9,
        fontWeight: 600,
        color: isSelected ? brick.color : 'var(--color-text-muted)',
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {brick.label}
      </span>
    </button>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function SoundPalette() {
  const [selectedBrick, setSelectedBrick] = useState<SoundBrick | null>(null);
  const [params, setParams] = useState<SoundBrickParams>({
    pitch: 0.5,
    length: 0.4,
    slide: 0.0,
  });

  // Throttle pour éviter la saturation audio
  const lastPlayRef = useRef<number>(0);

  const handlePreview = useCallback((brick: SoundBrick, overrideParams?: SoundBrickParams) => {
    const now = Date.now();
    if (now - lastPlayRef.current < PREVIEW_THROTTLE_MS) return;
    lastPlayRef.current = now;
    playBrick(brick, overrideParams ?? params);
  }, [params]);

  const handleSelectBrick = useCallback((brick: SoundBrick) => {
    setSelectedBrick(brick);
    // Charger les paramètres par défaut de la brique
    setParams(brick.defaults);
  }, []);

  const handleSliderChange = useCallback(<K extends keyof SoundBrickParams>(
    key: K,
    value: number,
  ) => {
    setParams(prev => {
      const next = { ...prev, [key]: value };
      // Aperçu instantané si une brique est sélectionnée
      if (selectedBrick) {
        const now = Date.now();
        if (now - lastPlayRef.current >= PREVIEW_THROTTLE_MS) {
          lastPlayRef.current = now;
          playBrick(selectedBrick, next);
        }
      }
      return next;
    });
  }, [selectedBrick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── En-tête ── */}
      <div style={{
        flexShrink: 0,
        padding: '8px 10px',
        borderBottom: '1px solid var(--color-border-base)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 16 }}>🔊</span>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--color-text-muted)',
        }}>
          Briques sonores
        </span>
      </div>

      {/* ── Contenu scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Grille de briques par catégorie */}
        {SOUND_BRICK_CATEGORIES.map(cat => {
          const bricksInCat = SOUND_BRICKS.filter(b => b.category === cat.id);
          if (bricksInCat.length === 0) return null;
          return (
            <div key={cat.id}>
              {/* Titre de catégorie */}
              <div style={{
                padding: '6px 10px 3px',
                background: 'rgba(255,255,255,0.03)',
                borderTop: '1px solid var(--color-border-base)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ fontSize: 12 }}>{cat.emoji}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: 'var(--color-text-muted)', opacity: 0.8,
                }}>
                  {cat.label}
                </span>
              </div>

              {/* Grille 3 colonnes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                padding: '6px 8px',
              }}>
                {bricksInCat.map(brick => (
                  <BrickCard
                    key={brick.id}
                    brick={brick}
                    isSelected={selectedBrick?.id === brick.id}
                    onSelect={handleSelectBrick}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* ── Sound Playground (visible si brique sélectionnée) ── */}
        {selectedBrick && (
          <div style={{
            margin: '8px',
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${selectedBrick.color}44`,
            background: `${selectedBrick.color}11`,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* Titre playground */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>{selectedBrick.emoji}</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: selectedBrick.color }}>
                  {selectedBrick.label}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-muted)' }}>
                  Bouge les curseurs pour modifier le son
                </p>
              </div>
            </div>

            {/* Sliders enfants */}
            <ChildSlider
              emoji="🎵"
              label="Hauteur"
              hint={params.pitch < 0.35 ? 'grave' : params.pitch > 0.65 ? 'aigu' : 'normal'}
              value={params.pitch}
              onChange={v => handleSliderChange('pitch', v)}
            />
            <ChildSlider
              emoji="⏱"
              label="Longueur"
              hint={params.length < 0.35 ? 'court' : params.length > 0.65 ? 'long' : 'normal'}
              value={params.length}
              onChange={v => handleSliderChange('length', v)}
            />
            <ChildSlider
              emoji="🌊"
              label="Glissement"
              hint={params.slide < -0.2 ? 'descend' : params.slide > 0.2 ? 'monte' : 'stable'}
              value={(params.slide + 1) / 2}   /* normalise −1…+1 → 0…1 pour le slider */
              onChange={v => handleSliderChange('slide', v * 2 - 1)}
            />

            {/* Boutons rejouer + reset */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => handlePreview(selectedBrick)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 6,
                  border: `1.5px solid ${selectedBrick.color}`,
                  background: `${selectedBrick.color}22`,
                  color: selectedBrick.color,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                🔊 Rejouer
              </button>
              <button
                onClick={() => setParams(selectedBrick.defaults)}
                title="Remettre les paramètres d'origine"
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border-base)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                ↺ Reset
              </button>
            </div>
          </div>
        )}

        {/* Hint initial si rien de sélectionné */}
        {!selectedBrick && (
          <div style={{
            margin: '12px 10px',
            padding: '12px',
            borderRadius: 8,
            background: 'rgba(139,92,246,0.07)',
            border: '1px dashed rgba(139,92,246,0.3)',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 13 }}>👆</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              Clique sur une brique<br/>pour entendre le son
            </p>
          </div>
        )}

        {/* Note Sprint B */}
        <div style={{
          margin: '4px 10px 10px',
          padding: '8px 10px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--color-border-base)',
        }}>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            💡 <strong style={{ color: 'var(--color-text-base)' }}>Bientôt</strong> : glisse une brique sur la carte pour la déclencher quand le joueur passe dessus.
          </p>
        </div>
      </div>
    </div>
  );
}
