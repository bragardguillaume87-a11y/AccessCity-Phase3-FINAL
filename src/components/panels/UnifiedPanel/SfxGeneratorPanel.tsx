/**
 * SfxGeneratorPanel — Génère des effets sonores 8-bit via jsfxr.
 *
 * Fonctionnement :
 *  1. Cliquer un preset → génère + joue le son immédiatement
 *  2. "Variation" → re-génère une variante aléatoire du même preset
 *  3. "Télécharger WAV" → sauvegarde le son actuel en fichier .wav
 *     (l'utilisateur l'importe ensuite via la Bibliothèque Audio)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Download, RefreshCw } from 'lucide-react';
import { sfxr } from 'jsfxr';

// ── Presets ──────────────────────────────────────────────────────────────────

type SfxPreset =
  | 'pickupCoin'
  | 'laserShoot'
  | 'explosion'
  | 'powerUp'
  | 'hitHurt'
  | 'jump'
  | 'blipSelect'
  | 'synth'
  | 'tone'
  | 'click'
  | 'random';

interface Preset {
  key: SfxPreset;
  label: string;
  emoji: string;
}

const PRESETS: Preset[] = [
  { key: 'pickupCoin', label: 'Pièce', emoji: '🪙' },
  { key: 'laserShoot', label: 'Laser', emoji: '⚡' },
  { key: 'explosion', label: 'Explosion', emoji: '💥' },
  { key: 'powerUp', label: 'Power-up', emoji: '⭐' },
  { key: 'hitHurt', label: 'Impact', emoji: '💢' },
  { key: 'jump', label: 'Saut', emoji: '🐸' },
  { key: 'blipSelect', label: 'Bip UI', emoji: '📟' },
  { key: 'synth', label: 'Synthé', emoji: '🎹' },
  { key: 'tone', label: 'Tonalité', emoji: '🔔' },
  { key: 'click', label: 'Clic', emoji: '👆' },
  { key: 'random', label: 'Aléatoire', emoji: '🎲' },
];

// ── Component ────────────────────────────────────────────────────────────────

/**
 * SfxGeneratorPanel — Panneau de génération de sons 8-bit.
 * Aucune dépendance aux stores : génération locale uniquement.
 * Exporté comme CollapsibleSection à intégrer dans AudioSection.
 */
export function SfxGeneratorPanel() {
  const [activePreset, setActivePreset] = useState<SfxPreset | null>(null);
  const [currentSound, setCurrentSound] = useState<object | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup du timer au démontage — évite setState sur composant démonté
  useEffect(() => {
    return () => {
      if (playingTimerRef.current) clearTimeout(playingTimerRef.current);
    };
  }, []);

  const generateAndPlay = useCallback((presetKey: SfxPreset) => {
    try {
      const sound = sfxr.generate(presetKey);
      setActivePreset(presetKey);
      setCurrentSound(sound);
      setIsPlaying(true);
      sfxr.play(sound);
      // Reset indicator after 1.5s (approximate max sound duration)
      if (playingTimerRef.current) clearTimeout(playingTimerRef.current);
      playingTimerRef.current = setTimeout(() => setIsPlaying(false), 1500);
    } catch {
      // jsfxr can throw on unsupported environments — silent fail
    }
  }, []);

  const handleVariation = useCallback(() => {
    if (activePreset) generateAndPlay(activePreset);
  }, [activePreset, generateAndPlay]);

  const handleDownload = useCallback(() => {
    if (!currentSound) return;
    try {
      const wave = sfxr.toWave(currentSound);
      const a = document.createElement('a');
      a.href = wave.dataURI;
      a.download = `${activePreset ?? 'sfx'}.wav`;
      a.click();
    } catch {
      // Silent fail
    }
  }, [currentSound, activePreset]);

  return (
    <div className="space-y-3">
      {/* Grille de presets */}
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Presets SFX">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => generateAndPlay(p.key)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl border text-[12px] font-medium transition-all min-h-[52px] ${
              activePreset === p.key
                ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/60 text-[var(--color-primary)]'
                : 'bg-[var(--color-bg-base)] border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]'
            }`}
            aria-label={`Générer un son : ${p.label}`}
            aria-pressed={activePreset === p.key}
          >
            <span className="text-base" aria-hidden="true">
              {p.emoji}
            </span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Actions sur le son courant */}
      {currentSound && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleVariation}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] py-2 px-2 rounded-xl border transition-all min-h-[36px] ${
              isPlaying
                ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/60 text-[var(--color-primary)]'
                : 'bg-[var(--color-bg-base)] border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40'
            }`}
            aria-label="Rejouer avec une nouvelle variation"
          >
            {isPlaying ? (
              <>
                <Play className="w-3 h-3" aria-hidden="true" /> En cours…
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3" aria-hidden="true" /> Variation
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] py-2 px-2 rounded-xl border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)] bg-[var(--color-bg-base)] transition-all min-h-[36px]"
            aria-label="Télécharger le son en WAV"
          >
            <Download className="w-3 h-3" aria-hidden="true" />
            Télécharger WAV
          </button>
        </div>
      )}
    </div>
  );
}
