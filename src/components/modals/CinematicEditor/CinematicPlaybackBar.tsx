/**
 * CinematicPlaybackBar — Contrôles de lecture de la séquence cinématique
 *
 * Fournit :
 * - Dots de navigation (un par événement, cliquables)
 * - Boutons |◀ ◀ ▶/⏸ ▶ ▶|
 * - Label de l'événement courant + compteur
 */
import { SkipBack, ChevronLeft, Play, Pause, ChevronRight, SkipForward } from 'lucide-react';
import { CINEMATIC_EVENT_META } from '@/types/cinematic';
import type { CinematicEvent } from '@/types';

interface Props {
  events: CinematicEvent[];
  playheadIndex: number;
  isPlaying: boolean;
  onGoTo: (index: number) => void;
  onPlayPause: () => void;
}

export function CinematicPlaybackBar({ events, playheadIndex, isPlaying, onGoTo, onPlayPause }: Props) {
  if (events.length === 0) return null;

  const currentEvent = events[playheadIndex];
  const currentMeta = currentEvent
    ? CINEMATIC_EVENT_META.find(m => m.type === currentEvent.type)
    : null;

  // Dots compacts si > 16 événements
  const dotClass = events.length > 16 ? 'w-1.5 h-1.5' : 'w-2 h-2';

  const btnBase = 'flex items-center justify-center rounded-md transition-colors text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none';

  return (
    <div className="w-full flex flex-col items-center gap-1.5 select-none">

      {/* Dots de navigation */}
      <div className="flex gap-1 flex-wrap justify-center max-w-full px-2">
        {events.map((ev, i) => (
          <button
            key={ev.id}
            onClick={() => onGoTo(i)}
            title={CINEMATIC_EVENT_META.find(m => m.type === ev.type)?.label ?? ev.type}
            className={[
              dotClass,
              'rounded-full transition-all',
              i === playheadIndex
                ? 'bg-violet-400 scale-125'
                : 'bg-white/25 hover:bg-white/50',
            ].join(' ')}
            aria-label={`Aller à l'événement ${i + 1}`}
          />
        ))}
      </div>

      {/* Contrôles */}
      <div className="flex items-center gap-1">
        <button
          className={`${btnBase} w-7 h-7`}
          onClick={() => onGoTo(0)}
          disabled={playheadIndex === 0 && !isPlaying}
          aria-label="Premier événement"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          className={`${btnBase} w-7 h-7`}
          onClick={() => onGoTo(Math.max(0, playheadIndex - 1))}
          disabled={playheadIndex === 0}
          aria-label="Événement précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Play / Pause — plus grand */}
        <button
          className="flex items-center justify-center w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-md"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Lire'}
        >
          {isPlaying
            ? <Pause className="w-4 h-4" />
            : <Play className="w-4 h-4 translate-x-0.5" />
          }
        </button>

        <button
          className={`${btnBase} w-7 h-7`}
          onClick={() => onGoTo(Math.min(events.length - 1, playheadIndex + 1))}
          disabled={playheadIndex >= events.length - 1}
          aria-label="Événement suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          className={`${btnBase} w-7 h-7`}
          onClick={() => onGoTo(events.length - 1)}
          disabled={playheadIndex >= events.length - 1 && !isPlaying}
          aria-label="Dernier événement"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Label événement courant */}
      <p className="text-[10px] text-[var(--color-text-muted)] text-center">
        {currentMeta ? `${currentMeta.emoji} ${currentMeta.label}` : '—'}
        <span className="ml-1.5 opacity-60">{playheadIndex + 1} / {events.length}</span>
      </p>
    </div>
  );
}
