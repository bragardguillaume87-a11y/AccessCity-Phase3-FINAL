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

import { useCallback, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { PanelSection } from '@/components/ui/CollapsibleSection';
import { IosToggle } from '@/components/ui/IosToggle';
import { SliderRow } from '@/components/ui/SliderRow';
import { useSettingsStore, DEFAULT_CHARACTER_FX } from '@/stores/settingsStore';
import type { CharacterFxSettings } from '@/stores/settingsStore';
import { useSceneById, useSceneActions } from '@/stores/selectors';
import { useUIStore } from '@/stores';
import type { SceneEffectConfig, SceneEffectType, SceneEffectShared } from '@/types/sceneEffect';
import { SCENE_EFFECT_TYPES, makeDefaultEffect } from '@/config/sceneEffects';

const DEFAULT_UI_SOUNDS_VOLUME = 0.3;
const DEFAULT_SCENE_EFFECT: SceneEffectConfig = { type: 'none' };

// ── Carte d'effet ─────────────────────────────────────────────────────────────

interface EffectCardProps {
  emoji: string;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  badgeValue?: string;
  children?: React.ReactNode;
}

function EffectCard({
  emoji,
  label,
  description,
  enabled,
  onToggle,
  badgeValue,
  children,
}: EffectCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: enabled
          ? 'rgba(139,92,246,0.08)'
          : hovered
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(255,255,255,0.03)',
        border: enabled
          ? '1px solid rgba(139,92,246,0.22)'
          : hovered
            ? '1px solid rgba(255,255,255,0.13)'
            : '1px solid rgba(255,255,255,0.07)',
        borderLeft: enabled ? '3px solid var(--color-primary)' : '3px solid transparent',
        borderRadius: 10,
        padding: '10px 12px',
        marginBottom: 8,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
        cursor: 'pointer',
        transition:
          'background 0.18s ease, border-color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: children ? 8 : 0,
        }}
      >
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'help',
                userSelect: 'none',
              }}
            >
              {/* Icône dans une pill macOS-style */}
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: enabled ? 'rgba(139,92,246,0.22)' : 'rgba(255,255,255,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  flexShrink: 0,
                  filter: enabled ? 'none' : 'grayscale(1) opacity(0.45)',
                  transition: 'background 0.18s ease, filter 0.18s ease',
                }}
              >
                {emoji}
              </span>
              <span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: enabled ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    transition: 'color 0.18s ease',
                  }}
                >
                  {label}
                </span>
                {/* Description visible quand pas de slider (ex: Pixel art) */}
                {!children && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10.5,
                      color: enabled ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.22)',
                      marginTop: 1,
                      fontStyle: 'italic',
                      lineHeight: 1.3,
                      transition: 'color 0.18s ease',
                    }}
                  >
                    {description}
                  </span>
                )}
              </span>
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="top" className="toolbar-tooltip" sideOffset={6}>
              {description}
              <Tooltip.Arrow className="toolbar-tooltip-arrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {badgeValue && enabled && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-primary)',
                background: 'rgba(139,92,246,0.15)',
                borderRadius: 4,
                padding: '1px 6px',
                letterSpacing: '0.02em',
              }}
            >
              {badgeValue}
            </span>
          )}
          <IosToggle enabled={enabled} onToggle={onToggle} label={label} />
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Sous-section Atmosphère ───────────────────────────────────────────────────

function AtmosphereSection() {
  const sceneId = useUIStore((s) => s.selectedSceneForEdit);
  const scene = useSceneById(sceneId);
  const { updateScene } = useSceneActions();

  const effect: SceneEffectConfig = useMemo(
    () => scene?.sceneEffect ?? DEFAULT_SCENE_EFFECT,
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
    /* Card container macOS NSGroupBox style */
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 10,
      }}
    >
      {/* En-tête section — sp-lbl style inline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: 10,
          background: 'rgba(255,255,255,0.05)',
          padding: '5px 8px',
          borderRadius: 5,
          margin: '0 -12px 10px',
        }}
      >
        <span aria-hidden="true">🌫</span>
        Atmosphère
        {hasEffect && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'var(--color-primary)',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginLeft: 2,
            }}
          >
            {SCENE_EFFECT_TYPES.find((m) => m.type === effect.type)?.emoji} {effect.type}
          </span>
        )}
      </div>

      <div style={{ paddingBottom: 4 }}>
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
            {/* Chips de type — scroll horizontal macOS style */}
            <div
              style={{
                display: 'flex',
                gap: 5,
                overflowX: 'auto',
                paddingBottom: 4,
                marginBottom: 8,
                scrollbarWidth: 'none',
              }}
            >
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
                      gap: 4,
                      padding: '5px 10px',
                      borderRadius: 7,
                      cursor: 'pointer',
                      fontSize: 11.5,
                      fontWeight: active ? 700 : 500,
                      flexShrink: 0,
                      border: active
                        ? '1.5px solid rgba(139,92,246,0.6)'
                        : '1px solid rgba(255,255,255,0.09)',
                      background: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                      color: active ? '#ffffff' : 'var(--color-text-secondary)',
                      transition: 'all 0.14s ease',
                      boxShadow: active ? '0 2px 8px rgba(139,92,246,0.3)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{meta.emoji}</span>
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
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Sous-titre sp-lbl style */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    marginBottom: 8,
                    background: 'rgba(255,255,255,0.04)',
                    padding: '3px 6px',
                    borderRadius: 4,
                  }}
                >
                  💡 Lumière sprites
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
                        fontSize: 11,
                        fontWeight: spriteLight === value ? 700 : 500,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border:
                          spriteLight === value
                            ? '1.5px solid rgba(139,92,246,0.6)'
                            : '1px solid rgba(255,255,255,0.09)',
                        background:
                          spriteLight === value ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                        color: spriteLight === value ? '#ffffff' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.14s ease',
                        boxShadow:
                          spriteLight === value ? '0 2px 6px rgba(139,92,246,0.28)' : 'none',
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
                    marginTop: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
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
      {/* Atmosphère — par scène, toujours en premier */}
      <AtmosphereSection />

      {/* Animation personnage — effets globaux sur les sprites */}
      <PanelSection title="ANIMATION PERSONNAGE" id="effects-chars" defaultOpen={true}>
        <EffectCard
          emoji="🫁"
          label="Respiration"
          description="Légère oscillation verticale des sprites"
          enabled={fx.breatheEnabled}
          onToggle={() => set({ breatheEnabled: !fx.breatheEnabled })}
          badgeValue={`${fx.breatheIntensity}×`}
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
          badgeValue={`${fx.speakingIntensity}×`}
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
          badgeValue={`${(fx.crossfadeMs / 200).toFixed(1)}×`}
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
          badgeValue={`${Math.round(uiSoundsVolume * 10) / 10}×`}
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
      </PanelSection>
    </Tooltip.Provider>
  );
}
