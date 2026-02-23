/**
 * EffectsSection — Configuration des animations de sprites personnages.
 *
 * Paramètres globaux (projet entier, persistés) :
 *   - Respiration : activer/désactiver + intensité + vitesse
 *   - Réaction dialogue : activer/désactiver + intensité
 *   - Fondu enchaîné : activer/désactiver + durée
 *
 * Accessible via l'icône Sparkles dans le Panel 4 (barre d'icônes droite).
 * S'applique à l'éditeur ET au jeu preview.
 */

import React, { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSettingsStore, DEFAULT_CHARACTER_FX } from '@/stores/settingsStore';
import type { CharacterFxSettings } from '@/stores/settingsStore';

// ── Sous-composants helpers (inspirés d'AudioSection) ────────────────────────

function ControlCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--color-bg-base)]/60 border border-[var(--color-border-base)]/50 p-3 space-y-3">
      {children}
    </div>
  );
}

function SectionTitle({ emoji, label, enabled, onToggle }: {
  emoji: string;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
        <span aria-hidden="true">{emoji}</span>
        {label}
      </span>
      <button
        onClick={onToggle}
        className={[
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
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
    </div>
  );
}

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
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--color-primary)]"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function EffectsSection() {
  const fx         = useSettingsStore(s => s.characterFx);
  const setFx      = useSettingsStore(s => s.setCharacterFx);

  const set = useCallback(
    (patch: Partial<CharacterFxSettings>) => setFx(patch),
    [setFx],
  );

  const handleReset = useCallback(() => {
    setFx(DEFAULT_CHARACTER_FX);
  }, [setFx]);

  return (
    <div className="p-3 space-y-3">

      {/* ── Respiration ─────────────────────────────────────────────────── */}
      <ControlCard>
        <SectionTitle
          emoji="🫁"
          label="Respiration"
          enabled={fx.breatheEnabled}
          onToggle={() => set({ breatheEnabled: !fx.breatheEnabled })}
        />
        <SliderRow
          label="Intensité"
          value={fx.breatheIntensity}
          min={0.5} max={2.0} step={0.1}
          unit="×"
          disabled={!fx.breatheEnabled}
          onChange={v => set({ breatheIntensity: v })}
        />
        <SliderRow
          label="Vitesse"
          value={fx.breatheSpeed}
          min={3} max={8} step={0.5}
          unit="s"
          disabled={!fx.breatheEnabled}
          onChange={v => set({ breatheSpeed: v })}
        />
      </ControlCard>

      {/* ── Réaction dialogue ────────────────────────────────────────────── */}
      <ControlCard>
        <SectionTitle
          emoji="💬"
          label="Réaction dialogue"
          enabled={fx.speakingEnabled}
          onToggle={() => set({ speakingEnabled: !fx.speakingEnabled })}
        />
        <SliderRow
          label="Intensité"
          value={fx.speakingIntensity}
          min={0.5} max={2.0} step={0.1}
          unit="×"
          disabled={!fx.speakingEnabled}
          onChange={v => set({ speakingIntensity: v })}
        />
      </ControlCard>

      {/* ── Fondu enchaîné ───────────────────────────────────────────────── */}
      <ControlCard>
        <SectionTitle
          emoji="🔀"
          label="Fondu enchaîné"
          enabled={fx.crossfadeEnabled}
          onToggle={() => set({ crossfadeEnabled: !fx.crossfadeEnabled })}
        />
        <SliderRow
          label="Durée"
          value={fx.crossfadeMs}
          min={50} max={600} step={50}
          unit="ms"
          disabled={!fx.crossfadeEnabled}
          onChange={v => set({ crossfadeMs: v })}
        />
      </ControlCard>

      {/* ── Rendu pixel art ──────────────────────────────────────────────── */}
      <ControlCard>
        <SectionTitle
          emoji="🎮"
          label="Pixel art"
          enabled={fx.pixelArt ?? false}
          onToggle={() => set({ pixelArt: !(fx.pixelArt ?? false) })}
        />
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Désactive l'anti-aliasing sur les sprites. À activer si tes personnages sont en pixel art.
        </p>
      </ControlCard>

      {/* ── Réinitialiser ────────────────────────────────────────────────── */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-[var(--color-border-base)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
        title="Remet tous les effets aux valeurs par défaut (transitions fluides)"
      >
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        Réinitialiser les effets
      </button>

    </div>
  );
}
