/**
 * CinematicInlinePlayer — Mini-player interactif dans le canvas principal.
 *
 * Remplace le placeholder statique d'EditorShell pour les scènes cinématiques.
 * Réutilise CinematicPreviewCanvas + CinematicPlaybackBar avec sa propre logique de lecture.
 */
import { useState, useEffect, useCallback } from 'react';
import { Film } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { CINEMATIC_SPEED_MS } from '@/types/cinematic';
import { CinematicPreviewCanvas } from '@/components/modals/CinematicEditor/CinematicPreviewCanvas';
import { CinematicPlaybackBar } from '@/components/modals/CinematicEditor/CinematicPlaybackBar';
import type { SceneMetadata } from '@/types/scenes';
import type { Character } from '@/types';

interface Props {
  scene: SceneMetadata;
  characters: Character[];
}

export function CinematicInlinePlayer({ scene, characters }: Props) {
  const events = scene.cinematicEvents ?? [];
  const [playheadIndex, setPlayheadIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Réinitialiser la lecture quand la scène change
  useEffect(() => {
    setPlayheadIndex(0);
    setIsPlaying(false);
  }, [scene.id]);

  // ── Auto-play : avance d'un événement à la fois ──────────────────────────
  useEffect(() => {
    if (!isPlaying || events.length === 0) return;
    if (playheadIndex >= events.length - 1) {
      setIsPlaying(false);
      return;
    }
    const currentEvent = events[playheadIndex];
    const baseDuration = 'speed' in currentEvent ? CINEMATIC_SPEED_MS[currentEvent.speed] : 0;
    const delay = Math.max(baseDuration + 400, 800);
    const timer = setTimeout(() => {
      setPlayheadIndex(prev => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [isPlaying, playheadIndex, events]);

  const handleGoTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, events.length - 1));
    setPlayheadIndex(clamped);
    setIsPlaying(false);
  }, [events.length]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) { setIsPlaying(false); return; }
    const startIdx = playheadIndex >= events.length - 1 ? 0 : playheadIndex;
    setPlayheadIndex(startIdx);
    setIsPlaying(true);
  }, [isPlaying, playheadIndex, events.length]);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-6 select-none overflow-hidden">

      {/* Titre de la scène */}
      <div className="flex items-center gap-2 text-center">
        <Film className="w-4 h-4 text-violet-400 flex-shrink-0" aria-hidden="true" />
        <p className="font-semibold text-[var(--color-text-primary)] text-sm">{scene.title}</p>
        <span className="text-[10px] text-[var(--color-text-muted)] bg-violet-900/30 px-1.5 py-0.5 rounded-full">
          Cinématique
        </span>
      </div>

      {/* Aperçu 16:9 — limité en largeur pour ne pas envahir tout le canvas */}
      <div className="w-full relative flex-shrink-0" style={{ maxWidth: '560px', aspectRatio: '16 / 9' }}>
        <CinematicPreviewCanvas
          events={events}
          playheadIndex={playheadIndex}
          backgroundUrl={scene.backgroundUrl ?? ''}
          characterLibrary={characters}
        />
      </div>

      {/* Barre de lecture */}
      {events.length > 0 && (
        <div className="w-full" style={{ maxWidth: '560px' }}>
          <CinematicPlaybackBar
            events={events}
            playheadIndex={playheadIndex}
            isPlaying={isPlaying}
            onGoTo={handleGoTo}
            onPlayPause={handlePlayPause}
          />
        </div>
      )}

      {/* Bouton vers l'éditeur dédié */}
      <button
        type="button"
        onClick={() => useUIStore.getState().setCinematicEditorOpen(true, scene.id)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-md"
      >
        <Film className="w-4 h-4" aria-hidden="true" />
        Éditer la cinématique
      </button>
    </div>
  );
}
