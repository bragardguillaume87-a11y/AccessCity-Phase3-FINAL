/**
 * EffectsSection — Configuration des animations de sprites personnages.
 *
 * Effets globaux (projet entier, persistés dans settingsStore) :
 *   - Respiration : oscillation verticale des sprites
 *   - Réaction dialogue : animation sprite synchronisée au texte
 *   - Fondu enchaîné : transition entre dialogues
 *   - Pixel art : désactive l'anti-aliasing sur les sprites
 *   - Sons UI : typewriter, boutons, transitions
 */

import React, { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSettingsStore, DEFAULT_CHARACTER_FX } from '@/stores/settingsStore';
import type { CharacterFxSettings } from '@/stores/settingsStore';

const DEFAULT_UI_SOUNDS_VOLUME = 0.3;

// ── Toggle iOS ────────────────────────────────────────────────────────────────

function IosToggle({ enabled, onToggle, label }: {
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
      <span className={[
        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
        enabled ? 'translate-x-4' : 'translate-x-0.5',
      ].join(' ')} />
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
  children?: React.ReactNode; // slider si besoin
}

function EffectCard({ emoji, label, description, enabled, onToggle, children }: EffectCardProps) {
  return (
    <div className="sp-track">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <span aria-hidden="true">{emoji}</span>
          {label}
        </span>
        <IosToggle enabled={enabled} onToggle={onToggle} label={label} />
      </div>
      <p className="text-[11px] text-[var(--color-text-muted)] mb-2">{description}</p>
      {children}
    </div>
  );
}

// ── Curseur sp-slider ─────────────────────────────────────────────────────────

function SliderRow({ label, value, min, max, step, unit, disabled, onChange }: {
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
        <span>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="sp-slider"
        aria-label={`${label} : ${value}${unit}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function EffectsSection() {
  const fx                = useSettingsStore(s => s.characterFx);
  const setFx             = useSettingsStore(s => s.setCharacterFx);
  const uiSoundsVolume    = useSettingsStore(s => s.uiSoundsVolume);
  const setUiSoundsVolume = useSettingsStore(s => s.setUiSoundsVolume);

  const set = useCallback(
    (patch: Partial<CharacterFxSettings>) => setFx(patch),
    [setFx],
  );

  const handleReset = useCallback(() => {
    setFx(DEFAULT_CHARACTER_FX);
    setUiSoundsVolume(DEFAULT_UI_SOUNDS_VOLUME);
  }, [setFx, setUiSoundsVolume]);

  return (
    <section className="sp-sec">

      <EffectCard
        emoji="🫁"
        label="Respiration"
        description="Légère oscillation verticale des sprites"
        enabled={fx.breatheEnabled}
        onToggle={() => set({ breatheEnabled: !fx.breatheEnabled })}
      >
        <SliderRow
          label="Intensité" value={fx.breatheIntensity}
          min={0.5} max={2.0} step={0.1} unit="×"
          disabled={!fx.breatheEnabled}
          onChange={v => set({ breatheIntensity: v })}
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
          label="Intensité" value={fx.speakingIntensity}
          min={0.5} max={2.0} step={0.1} unit="×"
          disabled={!fx.speakingEnabled}
          onChange={v => set({ speakingIntensity: v })}
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
          label="Intensité" value={fx.crossfadeMs}
          min={50} max={600} step={50} unit="ms"
          disabled={!fx.crossfadeEnabled}
          onChange={v => set({ crossfadeMs: v })}
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
          min={0} max={100} step={5} unit="%"
          disabled={uiSoundsVolume === 0}
          onChange={v => setUiSoundsVolume(v / 100)}
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

    </section>
  );
}
