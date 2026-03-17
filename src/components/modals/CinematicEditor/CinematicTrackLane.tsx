/**
 * CinematicTrackLane — Piste individuelle dans la timeline multi-canaux.
 *
 * Rendu d'un canal (fond, effets, personnages, audio, dialogue) avec
 * les blocs positionnés absolument par startTimeMs.
 */
import { memo } from 'react';
import type { Character } from '@/types';
import type { CinematicEventType, CinematicTrackId, CinematicTrackedEvent } from '@/types/cinematic';
import { CinematicTrackBlock } from './CinematicTrackBlock';
import { LANE_HEIGHT_PX } from './CinematicTimeline.constants';

interface CinematicTrackLaneProps {
  trackId: CinematicTrackId;
  trackedEvents: CinematicTrackedEvent[];
  selectedEventId: string | null;
  pxPerMs: number;
  totalWidthPx: number;
  characters: Character[];
  onSelectEvent: (trackedId: string) => void;
  onDeleteEvent: (trackedId: string) => void;
  onResizeEnd: (trackedId: string, finalWidthPx: number) => void;
  onDragEnd: (trackedId: string, newStartMs: number) => void;
  /** Inutilisé ici mais préservé pour la signature des callbacks remontés */
  onAddEvent?: (type: CinematicEventType, trackId: CinematicTrackId) => void;
}

export const CinematicTrackLane = memo(function CinematicTrackLane({
  trackId, trackedEvents, selectedEventId, pxPerMs, totalWidthPx, characters,
  onSelectEvent, onDeleteEvent, onResizeEnd, onDragEnd,
}: CinematicTrackLaneProps) {
  return (
    <div
      data-track={trackId}
      style={{
        position: 'relative',
        minWidth: totalWidthPx,
        height: LANE_HEIGHT_PX,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {trackedEvents.map(tracked => {
        const charId = 'characterId' in tracked.event
          ? (tracked.event as { characterId: string }).characterId
          : undefined;
        const char = charId ? characters.find(c => c.id === charId) : undefined;
        return (
          <CinematicTrackBlock
            key={tracked.id}
            tracked={tracked}
            isSelected={selectedEventId === tracked.id}
            pxPerMs={pxPerMs}
            characterName={char?.name}
            onSelect={() => onSelectEvent(tracked.id)}
            onDelete={(e) => { e.stopPropagation(); onDeleteEvent(tracked.id); }}
            onResizeEnd={onResizeEnd}
            onDragEnd={onDragEnd}
          />
        );
      })}
    </div>
  );
});
