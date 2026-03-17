/**
 * AudioSettingsSection — Configuration audio globale (Sons UI).
 *
 * Paramètres :
 *   - Type de frappe typewriter : 5 styles (Mécanique / Vintage / Gaming / 8-bit / Doux)
 *   - Rythme (intervalle min entre ticks) : 35–130 ms
 *   - Volume global Sons UI : 0–100%
 *   - Prévisualisation des sons
 *
 * Note : La musique de fond (BGM) et les sons ambiants sont configurés
 * par scène dans le panneau Audio de l'éditeur (Panel 4 > icône Music).
 */

import React, { useCallback } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsKidMode } from '@/hooks/useIsKidMode';
import { uiSounds, TICK_STYLES, type TickStyle } from '@/utils/uiSounds';

const DEFAULT_UI_SOUNDS_VOLUME = 0.3;

// ── Métadonnées des styles ────────────────────────────────────────────────────

const STYLE_META: Record<TickStyle, { emoji: string; label: string; desc: string }> = {
  mecanique: { emoji: '⚙️', label: 'Mécanique', desc: 'Triangle 950 Hz — Ace Attorney' },
  vintage:   { emoji: '🔩', label: 'Vintage',   desc: 'Sawtooth grave — Underwood 1950' },
  gaming:    { emoji: '🖱️', label: 'Gaming',    desc: 'Sine pur 1350 Hz — Cherry MX Blue' },
  '8bit':    { emoji: '👾', label: '8-bit',     desc: 'Square wave — RPG Maker / NES' },
  doux:      { emoji: '🌸', label: 'Doux',      desc: 'Sine 520 Hz — Animal Crossing' },
};

function rhythmLabel(ms: number): string {
  if (ms <= 50) return 'Rapide';
  if (ms <= 75) return 'Normal';
  return 'Lent';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SoundPreviewButton({ label, onPlay }: { label: string; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border-base)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
      title={`Prévisualiser : ${label}`}
    >
      <Play className="w-3 h-3" aria-hidden="true" />
      {label}
    </button>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function AudioSettingsSection(): React.ReactElement {
  const isKid = useIsKidMode();
  const uiSoundsVolume        = useSettingsStore(s => s.uiSoundsVolume);
  const setUiSoundsVolume     = useSettingsStore(s => s.setUiSoundsVolume);
  const uiSoundStyle          = useSettingsStore(s => s.uiSoundStyle);
  const setUiSoundStyle       = useSettingsStore(s => s.setUiSoundStyle);
  const uiSoundsTickInterval  = useSettingsStore(s => s.uiSoundsTickInterval);
  const setUiSoundsTickInterval = useSettingsStore(s => s.setUiSoundsTickInterval);

  const enabled = uiSoundsVolume > 0;

  const handleToggle = useCallback(() => {
    setUiSoundsVolume(enabled ? 0 : DEFAULT_UI_SOUNDS_VOLUME);
  }, [enabled, setUiSoundsVolume]);

  const handleVolumeChange = useCallback((v: number) => {
    setUiSoundsVolume(v / 100);
  }, [setUiSoundsVolume]);

  const handleStyleChange = useCallback((style: TickStyle) => {
    setUiSoundStyle(style);
    uiSounds.setTickStyle(style); // sync runtime immédiatement (pour la prévisualisation)
  }, [setUiSoundStyle]);

  const handleIntervalChange = useCallback((ms: number) => {
    setUiSoundsTickInterval(ms);
    uiSounds.setTickInterval(ms); // sync runtime
  }, [setUiSoundsTickInterval]);

  // Preview helpers — initialise l'AudioContext avant chaque son
  const preview = useCallback((fn: () => void) => {
    uiSounds.initialize();
    uiSounds.setVolume(enabled ? uiSoundsVolume : DEFAULT_UI_SOUNDS_VOLUME);
    uiSounds.setMuted(false);
    fn();
    if (!enabled) uiSounds.setMuted(true);
  }, [enabled, uiSoundsVolume]);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* En-tête */}
      <div>
        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          Paramètres Audio
        </h3>
        <p className="text-sm text-muted-foreground">
          Configuration des sons procéduraux de l'interface.
        </p>
      </div>

      <Separator />

      {/* ── Style de frappe ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h4 className="text-base font-semibold mb-0.5">Style de frappe typewriter</h4>
          <p className="text-sm text-muted-foreground">
            Son joué à chaque caractère révélé lors de l'animation de texte.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TICK_STYLES.map((style) => {
            const meta = STYLE_META[style];
            const active = uiSoundStyle === style;
            return (
              <button
                key={style}
                onClick={() => handleStyleChange(style)}
                className={[
                  'flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors',
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border-base)] bg-[var(--color-bg-base)]/40 text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg-hover)]',
                ].join(' ')}
                aria-pressed={active}
                title={`Sélectionner le style ${meta.label}`}
              >
                <span className="text-xl leading-none mt-0.5" aria-hidden="true">{meta.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{meta.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-tight">{meta.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bouton écoute rapide du style actif */}
        <button
          onClick={() => preview(() => uiSounds.tick('a'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border-base)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <Play className="w-3 h-3" aria-hidden="true" />
          Écouter le style actif
        </button>
      </div>

      <Separator />

      {/* ── Rythme — Pro mode only (trop technique pour élèves) ─────────── */}
      {!isKid && (
      <div className="space-y-3">
        <div>
          <h4 className="text-base font-semibold mb-0.5">Rythme de frappe</h4>
          <p className="text-sm text-muted-foreground">
            Intervalle minimum entre deux ticks. Plus court = plus de sons par seconde.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border-base)] p-4 bg-[var(--color-bg-base)]/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-muted)]">Rapidité</span>
            <span className="text-sm font-semibold text-[var(--color-text-secondary)] tabular-nums">
              {uiSoundsTickInterval} ms
              <span className="ml-1.5 text-xs font-normal text-[var(--color-text-muted)]">
                ({rhythmLabel(uiSoundsTickInterval)})
              </span>
            </span>
          </div>
          <input
            type="range"
            min={35}
            max={130}
            step={5}
            value={uiSoundsTickInterval}
            onChange={e => handleIntervalChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--color-primary)]"
            aria-label="Intervalle entre les ticks (ms)"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[var(--color-text-muted)]">Rapide (35 ms)</span>
            <span className="text-xs text-[var(--color-text-muted)]">Lent (130 ms)</span>
          </div>
        </div>
      </div>
      )}

      <Separator />

      {/* ── Volume Sons UI ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h4 className="text-base font-semibold mb-0.5">Sons UI</h4>
          <p className="text-sm text-muted-foreground">
            Sons procéduraux générés sans fichiers audio (Web Audio API) :
            frappe typewriter, bouton suivant, choix, transitions de scène…
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border-base)] p-4 space-y-4 bg-[var(--color-bg-base)]/40">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {enabled
                ? <Volume2 className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                : <VolumeX className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />}
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Activer les sons UI
              </span>
            </div>
            <button
              onClick={handleToggle}
              className={[
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
                enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-hover)]',
              ].join(' ')}
              role="switch"
              aria-checked={enabled}
              aria-label={`${enabled ? 'Désactiver' : 'Activer'} les sons UI`}
            >
              <span
                className={[
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                  enabled ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
          </div>

          {/* Volume */}
          <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-[var(--color-text-muted)]">Volume</span>
              <span className="text-sm font-semibold text-[var(--color-text-secondary)] tabular-nums">
                {Math.round(uiSoundsVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(uiSoundsVolume * 100)}
              onChange={e => handleVolumeChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--color-primary)]"
              aria-label="Volume des sons UI"
            />
          </div>
        </div>

        {/* Prévisualisation */}
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Prévisualiser les sons
          </p>
          <div className="flex flex-wrap gap-2">
            <SoundPreviewButton label="Frappe clavier"    onPlay={() => preview(() => uiSounds.tick('a'))} />
            <SoundPreviewButton label="Dialogue suivant"  onPlay={() => preview(uiSounds.advance)} />
            <SoundPreviewButton label="Skip typewriter"   onPlay={() => preview(uiSounds.skipTypewriter)} />
            <SoundPreviewButton label="Texte terminé"     onPlay={() => preview(uiSounds.typewriterComplete)} />
            <SoundPreviewButton label="Choix apparu"      onPlay={() => preview(uiSounds.choiceAppear)} />
            <SoundPreviewButton label="Choix sélectionné" onPlay={() => preview(uiSounds.choiceSelect)} />
            <SoundPreviewButton label="Transition scène"  onPlay={() => preview(uiSounds.sceneTransition)} />
            <SoundPreviewButton label="Démarrage jeu"     onPlay={() => preview(uiSounds.gameStart)} />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── BGM / Ambiance (informatif) ──────────────────────────────────── */}
      <div className="space-y-2">
        <h4 className="text-base font-semibold">Musique & Ambiance</h4>
        <p className="text-sm text-muted-foreground">
          La musique de fond (BGM) et les sons d'ambiance se configurent <strong>par scène</strong>{' '}
          dans l'éditeur : panneau droit → icône{' '}
          <span className="font-mono bg-muted/50 px-1 rounded text-xs">♪</span>{' '}
          Audio.
        </p>
        <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 rounded-md border border-muted">
          Cette architecture permet des ambiances sonores différentes pour chaque scène.
        </p>
      </div>
    </div>
  );
}
