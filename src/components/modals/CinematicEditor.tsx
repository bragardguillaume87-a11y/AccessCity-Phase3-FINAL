import { useState, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { X, Film } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useScenesStore } from '@/stores/index';
import { useCharactersStore } from '@/stores/index';
import { useSceneById } from '@/stores/selectors/sceneSelectors';
import type { CinematicEvent, CinematicEventType, CinematicTrackId } from '@/types';
import {
  createDefaultCinematicEvent,
  getEventDurationMs,
  migrateToCinematicTracks,
  flattenTracks,
  getTotalDurationMs,
} from '@/types/cinematic';
import type { CinematicTrackedEvent } from '@/types/cinematic';
import { CinematicEventInspector } from './CinematicEventInspector';
import { CinematicPreviewCanvas } from './CinematicEditor/CinematicPreviewCanvas';
import { CinematicTimeline } from './CinematicEditor/CinematicTimeline';

// ── Main CinematicEditor ──────────────────────────────────────────────────────

export function CinematicEditor() {
  const cinematicEditorOpen = useUIStore((s) => s.cinematicEditorOpen);
  const cinematicEditorSceneId = useUIStore((s) => s.cinematicEditorSceneId);
  const setCinematicEditorOpen = useUIStore((s) => s.setCinematicEditorOpen);

  const scene = useSceneById(cinematicEditorSceneId);
  const updateCinematicTracks = useScenesStore((s) => s.updateCinematicTracks);
  const updateScene = useScenesStore((s) => s.updateScene);
  const characters = useCharactersStore((s) => s.characters);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // ── Tracks : lazy migration depuis cinematicEvents si besoin ───────────────
  const tracks = useMemo(() => {
    if (scene?.cinematicTracks) return scene.cinematicTracks;
    return migrateToCinematicTracks(scene?.cinematicEvents ?? []);
  }, [scene?.cinematicTracks, scene?.cinematicEvents]);

  // ── Sauvegarde de la migration au premier ouverture ────────────────────────
  useEffect(() => {
    if (!cinematicEditorOpen || !cinematicEditorSceneId || !scene) return;
    if (!scene.cinematicTracks) {
      updateCinematicTracks(
        cinematicEditorSceneId,
        migrateToCinematicTracks(scene.cinematicEvents ?? [])
      );
    }
    setCurrentTimeMs(0);
    setIsPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setCurrentTimeMs/setIsPlaying/updateCinematicTracks sont des setters stables ; reset intentionnel à l'ouverture uniquement
  }, [cinematicEditorOpen, cinematicEditorSceneId]);

  // ── Événement sélectionné ──────────────────────────────────────────────────
  const flatEvents = useMemo(() => flattenTracks(tracks), [tracks]);
  const selectedTracked = useMemo(
    () => flatEvents.find((te: CinematicTrackedEvent) => te.id === selectedEventId) ?? null,
    [flatEvents, selectedEventId]
  );
  const selectedEvent = selectedTracked?.event ?? null;

  // Preview canvas : flat events triés + index courant basé sur currentTimeMs
  const previewEvents = useMemo(
    () => flatEvents.map((te: CinematicTrackedEvent) => te.event),
    [flatEvents]
  );
  const previewIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < flatEvents.length; i++) {
      if (flatEvents[i].startTimeMs <= currentTimeMs) idx = i;
      else break;
    }
    return Math.max(0, idx);
  }, [flatEvents, currentTimeMs]);

  // Auto-select du premier événement à l'ouverture
  useEffect(() => {
    if (cinematicEditorOpen && flatEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(flatEvents[0].id);
      setCurrentTimeMs(flatEvents[0].startTimeMs);
    }
  }, [cinematicEditorOpen, flatEvents, selectedEventId]);

  // ── Auto-play : ticker 16 ms ───────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const totalMs = getTotalDurationMs(tracks);
    if (currentTimeMs >= totalMs) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setCurrentTimeMs((t) => t + 16), 16);
    return () => clearTimeout(timer);
  }, [isPlaying, currentTimeMs, tracks]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    setCinematicEditorOpen(false, null);
    setSelectedEventId(null);
    setIsPlaying(false);
    setCurrentTimeMs(0);
  }, [setCinematicEditorOpen]);

  const handleSelectEvent = useCallback(
    (trackedId: string) => {
      const te = flatEvents.find((t: CinematicTrackedEvent) => t.id === trackedId);
      setSelectedEventId(trackedId);
      if (te) setCurrentTimeMs(te.startTimeMs);
      setIsPlaying(false);
    },
    [flatEvents]
  );

  const handleSeek = useCallback((timeMs: number) => {
    setCurrentTimeMs(Math.max(0, timeMs));
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    const totalMs = getTotalDurationMs(tracks);
    const startMs = currentTimeMs >= totalMs ? 0 : currentTimeMs;
    setCurrentTimeMs(startMs);
    setIsPlaying(true);
  }, [isPlaying, currentTimeMs, tracks]);

  const handleAddEvent = useCallback(
    (type: CinematicEventType, trackId: CinematicTrackId) => {
      if (!cinematicEditorSceneId) return;
      const newEvent = createDefaultCinematicEvent(type);
      const trackEvents = tracks[trackId];
      const endMs =
        trackEvents.length === 0
          ? 0
          : Math.max(
              0,
              ...trackEvents.map(
                (te: CinematicTrackedEvent) => te.startTimeMs + getEventDurationMs(te.event)
              )
            );
      const tracked: CinematicTrackedEvent = {
        id: `tracked-${newEvent.id}`,
        event: newEvent,
        trackId,
        startTimeMs: endMs,
      };
      updateCinematicTracks(cinematicEditorSceneId, {
        ...tracks,
        [trackId]: [...trackEvents, tracked],
      });
      setSelectedEventId(tracked.id);
      setCurrentTimeMs(tracked.startTimeMs);
      setIsPlaying(false);
    },
    [cinematicEditorSceneId, tracks, updateCinematicTracks]
  );

  const handleDeleteEvent = useCallback(
    (trackedId: string) => {
      if (!cinematicEditorSceneId) return;
      const te = flatEvents.find((t: CinematicTrackedEvent) => t.id === trackedId);
      if (!te) return;
      const newTracks = {
        ...tracks,
        [te.trackId]: tracks[te.trackId].filter((t: CinematicTrackedEvent) => t.id !== trackedId),
      };
      updateCinematicTracks(cinematicEditorSceneId, newTracks);
      if (selectedEventId === trackedId) setSelectedEventId(null);
    },
    [cinematicEditorSceneId, tracks, flatEvents, updateCinematicTracks, selectedEventId]
  );

  const handleUpdateEvent = useCallback(
    (trackedId: string, event: CinematicEvent) => {
      if (!cinematicEditorSceneId) return;
      const te = flatEvents.find((t: CinematicTrackedEvent) => t.id === trackedId);
      if (!te) return;
      updateCinematicTracks(cinematicEditorSceneId, {
        ...tracks,
        [te.trackId]: tracks[te.trackId].map((t: CinematicTrackedEvent) =>
          t.id === trackedId ? { ...t, event } : t
        ),
      });
    },
    [cinematicEditorSceneId, tracks, flatEvents, updateCinematicTracks]
  );

  const handleUpdateStartTime = useCallback(
    (trackedId: string, newStartMs: number) => {
      if (!cinematicEditorSceneId) return;
      const te = flatEvents.find((t: CinematicTrackedEvent) => t.id === trackedId);
      if (!te) return;
      updateCinematicTracks(cinematicEditorSceneId, {
        ...tracks,
        [te.trackId]: tracks[te.trackId].map((t: CinematicTrackedEvent) =>
          t.id === trackedId ? { ...t, startTimeMs: Math.max(0, newStartMs) } : t
        ),
      });
    },
    [cinematicEditorSceneId, tracks, flatEvents, updateCinematicTracks]
  );

  if (!cinematicEditorOpen) return null;

  return (
    <Dialog
      open={cinematicEditorOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-[var(--color-bg-base)] border-[var(--color-border-base)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-base)] flex-shrink-0">
          <Film className="w-5 h-5 text-violet-400 flex-shrink-0" aria-hidden="true" />
          <DialogTitle className="flex-1 text-[var(--color-text-primary)] font-bold text-base">
            Éditeur Cinématique
            {scene && (
              <span className="ml-2 text-[var(--color-text-muted)] font-normal text-sm">
                — {scene.title}
              </span>
            )}
          </DialogTitle>
          {scene && (
            <input
              type="text"
              value={scene.title}
              onChange={(e) => updateScene(scene.id, { title: e.target.value })}
              className="text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] rounded px-2 py-1 text-[var(--color-text-primary)] w-48"
              placeholder="Titre de la cinématique"
              aria-label="Titre de la scène"
            />
          )}
          <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Fermer">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body — 2 lignes */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Ligne haute : Aperçu + Inspecteur */}
          <div className="flex flex-1 min-h-0">
            {/* Aperçu centré (16:9) */}
            <div className="flex-1 min-w-0 min-h-0 flex items-center justify-center p-4 bg-black/20 border-r border-[var(--color-border-base)] overflow-hidden">
              <div
                className="relative"
                style={{
                  aspectRatio: '16 / 9',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: '100%',
                }}
              >
                <CinematicPreviewCanvas
                  events={previewEvents}
                  playheadIndex={previewIndex}
                  backgroundUrl={scene?.backgroundUrl ?? ''}
                  characterLibrary={characters}
                />
              </div>
            </div>

            {/* Inspecteur */}
            <div className="w-72 flex-shrink-0 overflow-y-auto">
              {selectedEvent ? (
                <CinematicEventInspector
                  event={selectedEvent}
                  characters={characters}
                  onUpdate={(event) => {
                    if (selectedEventId) handleUpdateEvent(selectedEventId, event);
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] text-center p-8">
                  <Film className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Sélectionne un événement</p>
                  <p className="text-xs mt-1 opacity-70">
                    Clique sur un bloc de la timeline pour l'éditer
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Ligne basse : Timeline multi-pistes */}
          <CinematicTimeline
            tracks={tracks}
            currentTimeMs={currentTimeMs}
            isPlaying={isPlaying}
            selectedEventId={selectedEventId}
            characters={characters}
            onSelectEvent={handleSelectEvent}
            onDeleteEvent={handleDeleteEvent}
            onUpdateEvent={handleUpdateEvent}
            onUpdateStartTime={handleUpdateStartTime}
            onAddEvent={handleAddEvent}
            onSeek={handleSeek}
            onPlayPause={handlePlayPause}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
