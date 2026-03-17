/**
 * EffectsSection — Configuration des animations de sprites personnages.
 *
 * Effets globaux (projet entier, persistés dans settingsStore) :
 *   - Respiration : oscillation verticale des sprites
 *   - Réaction dialogue : animation sprite synchronisée au texte
 *   - Fondu enchaîné : transition entre dialogues
 *   - Pixel art : désactive l'anti-aliasing sur les sprites
 *   - Sons UI : typewriter, boutons, transitions
 *
 * Sous-menu replié "🌫 Atmosphère" (par scène, persisté dans scenesStore) :
 *   - Type d'effet : pluie, neige, brouillard, bloom, god rays
 *   - Paramètres spécifiques à chaque effet (sliders)
 */

import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useSettingsStore, DEFAULT_CHARACTER_FX } from '@/stores/settingsStore';
import type { CharacterFxSettings } from '@/stores/settingsStore';
import { useSceneById, useSceneActions } from '@/stores/selectors';
import { useUIStore } from '@/stores';
import type { SceneEffectConfig, SceneEffectType, SceneEffectShared } from '@/types/sceneEffect';
import { SCENE_EFFECT_TYPES, makeDefaultEffect } from '@/config/sceneEffects';

const DEFAULT_UI_SOUNDS_VOLUME = 0.3;

// ── Toggle iOS ────────────────────────────────────────────────────────────────

function IosToggle({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={[
        'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
        enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-hover)]',
      ].join(' ')}
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? 'Désactiver' : 'Activer'} ${label}`}
    >
      <span
        className={[
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          enabled ? 'translate-x-4' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  );
}

// ── Carte d'effet ─────────────────────────────────────────────────────────────

interface EffectCardProps {
  emoji: string;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

function EffectCard({ emoji, label, description, enabled, onToggle, children }: EffectCardProps) {
  return (
    <div className="sp-track">
      <div className="flex items-center justify-between mb-1">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="text-[12px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5 cursor-help select-none">
              <span aria-hidden="true">{emoji}</span>
              {label}
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="top" className="toolbar-tooltip" sideOffset={6}>
              {description}
              <Tooltip.Arrow className="toolbar-tooltip-arrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        <IosToggle enabled={enabled} onToggle={onToggle} label={label} />
      </div>
      {children}
    </div>
  );
}

// ── Curseur sp-slider ─────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <div className="sp-row">
        <span>{label}</span>
        <span>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sp-slider"
        aria-label={`${label} : ${value}${unit}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

// ── Sous-section Atmosphère ───────────────────────────────────────────────────

function AtmosphereSection() {
  const [open, setOpen] = useState(false);

  const sceneId = useUIStore((s) => s.selectedSceneForEdit);
  const scene = useSceneById(sceneId);
  const { updateScene } = useSceneActions();

  const effect: SceneEffectConfig = useMemo(
    () => scene?.sceneEffect ?? { type: 'none' },
    [scene?.sceneEffect]
  );

  const setEffect = useCallback(
    (next: SceneEffectConfig) => {
      if (!sceneId) return;
      updateScene(sceneId, { sceneEffect: next.type !== 'none' ? next : undefined });
    },
    [sceneId, updateScene]
  );

  const handleTypeClick = useCallback(
    (type: SceneEffectType) => {
      if (type === 'none' || effect.type === type) {
        setEffect({ type: 'none' });
      } else {
        setEffect(makeDefaultEffect(type));
      }
    },
    [effect.type, setEffect]
  );

  const handleSlider = useCallback(
    (key: string, value: number) => {
      setEffect({ ...effect, [key]: value } as SceneEffectConfig);
    },
    [effect, setEffect]
  );

  const handleShared = useCallback(
    (patch: Partial<SceneEffectShared>) => {
      if (effect.type === 'none') return;
      setEffect({ ...effect, ...patch } as SceneEffectConfig);
    },
    [effect, setEffect]
  );

  const hasEffect = effect.type !== 'none';
  const spriteLight = effect.type !== 'none' ? (effect.spriteLight ?? 'off') : 'off';
  const cssFilter = effect.type !== 'none' ? (effect.cssFilter ?? false) : false;

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
        marginTop: 4,
      }}
    >
      {/* En-tête accordéon */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 0 6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: hasEffect ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        }}
      >
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}
        >
          <span aria-hidden="true">🌫</span>
          Atmosphère
          {hasEffect && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 4,
                background: 'var(--color-primary-muted)',
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {SCENE_EFFECT_TYPES.find((m) => m.type === effect.type)?.emoji} {effect.type}
            </span>
          )}
        </span>
        <ChevronDown
          size={13}
          style={{
            transition: 'transform 0.18s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--color-text-muted)',
          }}
        />
      </button>

      {/* Contenu replié */}
      {open && (
        <div style={{ paddingBottom: 8 }}>
          {/* Pas de scène sélectionnée */}
          {!sceneId && (
            <p
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                margin: '0 0 8px',
                fontStyle: 'italic',
              }}
            >
              Sélectionne une scène pour configurer l'atmosphère.
            </p>
          )}

          {sceneId && (
            <>
              {/* Chips de type */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {SCENE_EFFECT_TYPES.map((meta) => {
                  const active = effect.type === meta.type;
                  return (
                    <button
                      key={meta.type}
                      type="button"
                      title={meta.description}
                      onClick={() => handleTypeClick(meta.type as SceneEffectType)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '3px 7px',
                        borderRadius: 5,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: active ? 700 : 400,
                        border: active
                          ? '1.5px solid var(--color-primary)'
                          : '1px solid var(--color-border-base)',
                        background: active ? 'var(--color-primary-muted)' : 'transparent',
                        color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{meta.emoji}</span>
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              {/* Sliders pluie */}
              {effect.type === 'rain' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <SliderRow
                    label="Densité"
                    value={effect.density}
                    min={50}
                    max={800}
                    step={10}
                    unit=""
                    disabled={false}
                    onChange={(v) => handleSlider('density', v)}
                  />
                  <SliderRow
                    label="Angle°"
                    value={effect.angle}
                    min={-30}
                    max={30}
                    step={1}
                    unit="°"
                    disabled={false}
                    onChange={(v) => handleSlider('angle', v)}
                  />
                  <SliderRow
                    label="Longueur"
                    value={effect.length}
                    min={4}
                    max={30}
                    step={1}
                    unit="px"
                    disabled={false}
                    onChange={(v) => handleSlider('length', v)}
                  />
                  <SliderRow
                    label="Éclaboussures"
                    value={effect.splashScale ?? 1.0}
                    min={0}
                    max={2}
                    step={0.1}
                    unit="×"
                    disabled={false}
                    onChange={(v) => handleSlider('splashScale', v)}
                  />
                  <SliderRow
                    label="Niveau sol"
                    value={effect.groundLevel ?? 0.82}
                    min={0.5}
                    max={1}
                    step={0.02}
                    unit=""
                    disabled={false}
                    onChange={(v) => handleSlider('groundLevel', v)}
                  />
                </div>
              )}

              {/* Sliders bruine */}
              {effect.type === 'drizzle' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <SliderRow
                    label="Densité"
                    value={effect.density}
                    min={50}
                    max={600}
                    step={10}
                    unit=""
                    disabled={false}
                    onChange={(v) => handleSlider('density', v)}
                  />
                  <SliderRow
                    label="Angle°"
                    value={effect.angle}
                    min={-20}
                    max={20}
                    step={1}
                    unit="°"
                    disabled={false}
                    onChange={(v) => handleSlider('angle', v)}
                  />
                  <SliderRow
                    label="Opacité"
                    value={effect.opacity}
                    min={0.05}
                    max={0.4}
                    step={0.01}
                    unit=""
                    disabled={false}
                    onChange={(v) => handleSlider('opacity', v)}
                  />
                  <SliderRow
                    label="Vitesse"
                    value={effect.speed}
                    min={1}
                    max={5}
                    step={0.1}
                    unit="×"
                    disabled={false}
                    onChange={(v) => handleSlider('speed', v)}
                  />
                </div>
              )}

              {/* Sliders neige */}
              {effect.type === 'snow' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <SliderRow
                    label="Densité"
                    value={effect.density}
                    min={50}
                    max={600}
                    step={10}
                    unit=""
                    disabled={false}
                    onChange={(v) => handleSlider('density', v)}
                  />
                  <SliderRow
                    label="Dérive"
                    value={effect.drift}
                    min={0}
                    max={2}
                    step={0.05}
                    unit=""
                    disabled={false}
                    onChange={(v) => handleSlider('drift', v)}
                  />
                  <SliderRow
                    label="Taille"
                    value={effect.size}
                    min={1}
                    max={8}
                    step={0.5}
                    unit="px"
                    disabled={false}
                    onChange={(v) => handleSlider('size', v)}
                  />
                </div>
              )}

              {/* Sliders brouillard */}
              {effect.type === 'fog' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <SliderRow
                    label="Opacité"
                    value={effect.opacity}
                    min={0.05}
                    max={1}
                    step={0.05}
                    unit=""
                    disabled={false}
                    onChange={(v) => handleSlider('opacity', v)}
                  />
                  <SliderRow
                    label="Vitesse"
                    value={effect.speed}
                    min={0.1}
                    max={3}
                    step={0.1}
                    unit="×"
                    disabled={false}
                    onChange={(v) => handleSlider('speed', v)}
                  />
                  <SliderRow
                    label="Échelle"
                    value={effect.scale}
                    min={0.5}
                    max={4}
                    step={0.1}
                    unit="×"
                    disabled={false}
                    onChange={(v) => handleSlider('scale', v)}
                  />
                </div>
              )}

              {/* Sliders bloom */}
              {effect.type === 'bloom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <SliderRow
                    label="Intensité"
                    value={effect.intensity}
                    min={0.1}
                    max={2}
                    step={0.1}
                    unit="×"
                    disabled={false}
                    onChange={(v) => handleSlider('intensity', v)}
                  />
                  <SliderRow
                    label="Rayon"
                    value={effect.radius}
                    min={1}
                    max={20}
                    step={1}
                    unit="px"
                    disabled={false}
                    onChange={(v) => handleSlider('radius', v)}
                  />
                  <SliderRow
                    label="Seuil"
                    value={effect.threshold}
                    min={0}
                    max={1}
                    step={0.05}
                    unit=""
                    disabled={false}
                    onChange={(v) => handleSlider('threshold', v)}
                  />
                </div>
              )}

              {/* Sliders god rays */}
              {effect.type === 'godrays' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <SliderRow
                    label="Intensité"
                    value={effect.intensity}
                    min={0.1}
                    max={2}
                    step={0.1}
                    unit="×"
                    disabled={false}
                    onChange={(v) => handleSlider('intensity', v)}
                  />
                  <SliderRow
                    label="Angle°"
                    value={effect.angle}
                    min={-90}
                    max={90}
                    step={5}
                    unit="°"
                    disabled={false}
                    onChange={(v) => handleSlider('angle', v)}
                  />
                  <SliderRow
                    label="Densité"
                    value={effect.density}
                    min={0.1}
                    max={1}
                    step={0.05}
                    unit=""
                    disabled={false}
                    onChange={(v) => handleSlider('density', v)}
                  />
                </div>
              )}

              {/* ── Lumière sprites ─────────────────────────────────────── */}
              {hasEffect && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 5,
                    }}
                  >
                    💡 Lumière sprites
                  </div>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {(
                      [
                        { value: 'off', label: 'Off' },
                        { value: 'tint', label: 'Teinte' },
                        { value: 'rimlight', label: 'Rim' },
                        { value: 'both', label: 'Les deux' },
                      ] as { value: SceneEffectShared['spriteLight']; label: string }[]
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleShared({ spriteLight: value })}
                        style={{
                          fontSize: 10,
                          fontWeight: spriteLight === value ? 700 : 500,
                          padding: '3px 8px',
                          borderRadius: 5,
                          border: `1.5px solid ${
                            spriteLight === value
                              ? 'var(--color-primary)'
                              : 'var(--color-border-base)'
                          }`,
                          background:
                            spriteLight === value ? 'var(--color-primary-muted)' : 'transparent',
                          color:
                            spriteLight === value
                              ? 'var(--color-primary)'
                              : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Toggle filtre CSS couleur */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 7,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--color-text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      🎨 Filtre couleur scène
                    </span>
                    <IosToggle
                      enabled={cssFilter}
                      onToggle={() => handleShared({ cssFilter: !cssFilter })}
                      label="Filtre couleur scène"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function EffectsSection() {
  const fx = useSettingsStore((s) => s.characterFx);
  const setFx = useSettingsStore((s) => s.setCharacterFx);
  const uiSoundsVolume = useSettingsStore((s) => s.uiSoundsVolume);
  const setUiSoundsVolume = useSettingsStore((s) => s.setUiSoundsVolume);

  const set = useCallback((patch: Partial<CharacterFxSettings>) => setFx(patch), [setFx]);

  const handleReset = useCallback(() => {
    setFx(DEFAULT_CHARACTER_FX);
    setUiSoundsVolume(DEFAULT_UI_SOUNDS_VOLUME);
  }, [setFx, setUiSoundsVolume]);

  return (
    <Tooltip.Provider delayDuration={400}>
      <section className="sp-sec">
        <EffectCard
          emoji="🫁"
          label="Respiration"
          description="Légère oscillation verticale des sprites"
          enabled={fx.breatheEnabled}
          onToggle={() => set({ breatheEnabled: !fx.breatheEnabled })}
        >
          <SliderRow
            label="Intensité"
            value={fx.breatheIntensity}
            min={0.5}
            max={2.0}
            step={0.1}
            unit="×"
            disabled={!fx.breatheEnabled}
            onChange={(v) => set({ breatheIntensity: v })}
          />
        </EffectCard>

        <EffectCard
          emoji="💬"
          label="Réaction dialogue"
          description="Animation sprite synchronisée au texte"
          enabled={fx.speakingEnabled}
          onToggle={() => set({ speakingEnabled: !fx.speakingEnabled })}
        >
          <SliderRow
            label="Intensité"
            value={fx.speakingIntensity}
            min={0.5}
            max={2.0}
            step={0.1}
            unit="×"
            disabled={!fx.speakingEnabled}
            onChange={(v) => set({ speakingIntensity: v })}
          />
        </EffectCard>

        <EffectCard
          emoji="🎬"
          label="Fondu enchaîné"
          description="Transition entre dialogues"
          enabled={fx.crossfadeEnabled}
          onToggle={() => set({ crossfadeEnabled: !fx.crossfadeEnabled })}
        >
          <SliderRow
            label="Intensité"
            value={fx.crossfadeMs}
            min={50}
            max={600}
            step={50}
            unit="ms"
            disabled={!fx.crossfadeEnabled}
            onChange={(v) => set({ crossfadeMs: v })}
          />
        </EffectCard>

        <EffectCard
          emoji="🎮"
          label="Pixel art"
          description="Désactive l'anti-aliasing sur les sprites"
          enabled={fx.pixelArt ?? false}
          onToggle={() => set({ pixelArt: !(fx.pixelArt ?? false) })}
        />

        <EffectCard
          emoji="🔊"
          label="Sons UI"
          description="Typewriter, boutons, transitions"
          enabled={uiSoundsVolume > 0}
          onToggle={() => setUiSoundsVolume(uiSoundsVolume > 0 ? 0 : DEFAULT_UI_SOUNDS_VOLUME)}
        >
          <SliderRow
            label="Intensité"
            value={Math.round(uiSoundsVolume * 100)}
            min={0}
            max={100}
            step={5}
            unit="%"
            disabled={uiSoundsVolume === 0}
            onChange={(v) => setUiSoundsVolume(v / 100)}
          />
        </EffectCard>

        {/* Réinitialiser */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-[var(--color-border-base)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors mt-1"
          title="Remet tous les effets aux valeurs par défaut"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Réinitialiser les effets
        </button>

        {/* Sous-section atmosphérique par scène */}
        <AtmosphereSection />
      </section>
    </Tooltip.Provider>
  );
}
