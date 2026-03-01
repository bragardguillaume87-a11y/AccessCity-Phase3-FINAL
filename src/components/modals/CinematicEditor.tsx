import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { X, Film } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useScenesStore } from '@/stores/index';
import { useCharactersStore } from '@/stores/index';
import { useSceneById } from '@/stores/selectors/sceneSelectors';
import type { CinematicEvent, CinematicEventType } from '@/types';
import {
  createDefaultCinematicEvent,
  getEventDurationMs,
} from '@/types/cinematic';
import { CinematicEventInspector } from './CinematicEventInspector';
import { CinematicPreviewCanvas } from './CinematicEditor/CinematicPreviewCanvas';
import { CinematicTimeline } from './CinematicEditor/CinematicTimeline';

// ── Main CinematicEditor ──────────────────────────────────────────────────────

export function CinematicEditor() {
  const cinematicEditorOpen    = useUIStore(s => s.cinematicEditorOpen);
  const cinematicEditorSceneId = useUIStore(s => s.cinematicEditorSceneId);
  const setCinematicEditorOpen = useUIStore(s => s.setCinematicEditorOpen);

  const scene               = useSceneById(cinematicEditorSceneId);
  const updateCinematicEvents = useScenesStore(s => s.updateCinematicEvents);
  const updateScene           = useScenesStore(s => s.updateScene);
  const characters            = useCharactersStore(s => s.characters);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // ── Playback state ─────────────────────────────────────────────────────────
  const [playheadIndex, setPlayheadIndex] = useState(0);
  const [isPlaying, setIsPlaying]         = useState(false);

  const events       = scene?.cinematicEvents ?? [];
  const selectedEvent = events.find(e => e.id === selectedEventId) ?? null;

  // Auto-select first event when editor opens with existing events
  useEffect(() => {
    if (cinematicEditorOpen && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
      setPlayheadIndex(0);
    }
  }, [cinematicEditorOpen, events, selectedEventId]);

  // ── Auto-play : avance d'un événement à la fois ───────────────────────────
  useEffect(() => {
    if (!isPlaying || events.length === 0) return;
    if (playheadIndex >= events.length - 1) { setIsPlaying(false); return; }

    const currentEvent = events[playheadIndex];
    const delay = Math.max(getEventDurationMs(currentEvent) + 400, 800);

    const timer = setTimeout(() => {
      const next = playheadIndex + 1;
      setPlayheadIndex(next);
      setSelectedEventId(events[next].id);
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, playheadIndex, events]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    setCinematicEditorOpen(false, null);
    setSelectedEventId(null);
    setIsPlaying(false);
    setPlayheadIndex(0);
  }, [setCinematicEditorOpen]);

  const handleSelectEvent = useCallback((eventId: string) => {
    const idx = events.findIndex(e => e.id === eventId);
    setSelectedEventId(eventId);
    if (idx !== -1) setPlayheadIndex(idx);
    setIsPlaying(false);
  }, [events]);

  const handleGoTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, events.length - 1));
    setPlayheadIndex(clamped);
    if (events[clamped]) setSelectedEventId(events[clamped].id);
    setIsPlaying(false);
  }, [events]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) { setIsPlaying(false); return; }
    const startIdx = playheadIndex >= events.length - 1 ? 0 : playheadIndex;
    setPlayheadIndex(startIdx);
    if (events[startIdx]) setSelectedEventId(events[startIdx].id);
    setIsPlaying(true);
  }, [isPlaying, playheadIndex, events]);

  const handleAddEvent = useCallback((type: CinematicEventType) => {
    if (!cinematicEditorSceneId) return;
    const newEvent = createDefaultCinematicEvent(type);
    const newEvents = [...events, newEvent];
    updateCinematicEvents(cinematicEditorSceneId, newEvents);
    const newIdx = newEvents.length - 1;
    setSelectedEventId(newEvent.id);
    setPlayheadIndex(newIdx);
    setIsPlaying(false);
  }, [cinematicEditorSceneId, events, updateCinematicEvents]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    if (!cinematicEditorSceneId) return;
    const newEvents = events.filter(e => e.id !== eventId);
    updateCinematicEvents(cinematicEditorSceneId, newEvents);
    if (selectedEventId === eventId) {
      const newIdx = Math.min(playheadIndex, newEvents.length - 1);
      setSelectedEventId(newEvents[newIdx]?.id ?? null);
      setPlayheadIndex(Math.max(0, newIdx));
    }
  }, [cinematicEditorSceneId, events, updateCinematicEvents, selectedEventId, playheadIndex]);

  const handleUpdateEvent = useCallback((updated: CinematicEvent) => {
    if (!cinematicEditorSceneId) return;
    updateCinematicEvents(cinematicEditorSceneId, events.map(e => e.id === updated.id ? updated : e));
  }, [cinematicEditorSceneId, events, updateCinematicEvents]);

  const handleReorderEvents = useCallback((newEvents: CinematicEvent[]) => {
    if (!cinematicEditorSceneId) return;
    updateCinematicEvents(cinematicEditorSceneId, newEvents);
    // Maintenir le playhead sur l'événement sélectionné après réordonnancement
    if (selectedEventId) {
      const newIdx = newEvents.findIndex(e => e.id === selectedEventId);
      if (newIdx !== -1) setPlayheadIndex(newIdx);
    }
  }, [cinematicEditorSceneId, selectedEventId, updateCinematicEvents]);

  if (!cinematicEditorOpen) return null;

  return (
    <Dialog open={cinematicEditorOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-[var(--color-bg-base)] border-[var(--color-border-base)]">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-base)] flex-shrink-0">
          <Film className="w-5 h-5 text-violet-400 flex-shrink-0" aria-hidden="true" />
          <DialogTitle className="flex-1 text-[var(--color-text-primary)] font-bold text-base">
            Éditeur Cinématique
            {scene && <span className="ml-2 text-[var(--color-text-muted)] font-normal text-sm">— {scene.title}</span>}
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
                style={{ aspectRatio: '16 / 9', maxWidth: '100%', maxHeight: '100%', width: '100%' }}
              >
                <CinematicPreviewCanvas
                  events={events}
                  playheadIndex={playheadIndex}
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
                  onUpdate={handleUpdateEvent}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] text-center p-8">
                  <Film className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Sélectionne un événement</p>
                  <p className="text-xs mt-1 opacity-70">Clique sur un bloc de la timeline pour l'éditer</p>
                </div>
              )}
            </div>
          </div>

          {/* Ligne basse : Timeline (280 px de haut, défini en interne) */}
          <CinematicTimeline
            events={events}
            playheadIndex={playheadIndex}
            isPlaying={isPlaying}
            selectedEventId={selectedEventId}
            characters={characters}
            onSelectEvent={handleSelectEvent}
            onDeleteEvent={handleDeleteEvent}
            onReorderEvents={handleReorderEvents}
            onUpdateEvent={handleUpdateEvent}
            onAddEvent={handleAddEvent}
            onGoTo={handleGoTo}
            onPlayPause={handlePlayPause}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
