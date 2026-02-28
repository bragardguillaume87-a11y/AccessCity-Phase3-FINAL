import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { X, Plus, Film, GripVertical, Trash2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useScenesStore } from '@/stores/index';
import { useCharactersStore } from '@/stores/index';
import type { CinematicEvent, CinematicEventType } from '@/types';
import {
  CINEMATIC_EVENT_META,
  createDefaultCinematicEvent,
} from '@/types/cinematic';
import { CinematicEventInspector } from './CinematicEventInspector';

// ── Event Card ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: CinematicEvent;
  index: number;
  isSelected: boolean;
  characterName?: string;
  onSelect: () => void;
  onDelete: () => void;
}

function EventCard({ event, index, isSelected, characterName, onSelect, onDelete }: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const meta = CINEMATIC_EVENT_META.find(m => m.type === event.type);
  const emoji = meta?.emoji ?? '❓';
  const label = meta?.label ?? event.type;

  // Short summary of key property
  const summary = (() => {
    switch (event.type) {
      case 'dialogue':    return event.text ? `"${event.text.slice(0, 40)}${event.text.length > 40 ? '…' : ''}"` : '(vide)';
      case 'fade':        return `${event.direction === 'in' ? '→ depuis' : '→ vers'} ${event.color}`;
      case 'background':  return event.url ? event.url.split('/').pop() : '(aucun décor)';
      case 'characterEnter': return characterName ?? event.characterId ?? '(aucun)';
      case 'characterExit':  return characterName ?? event.characterId ?? '(aucun)';
      case 'characterShake': return characterName ?? event.characterId ?? '(aucun)';
      case 'sfx':         return event.url ? event.url.split('/').pop() : '(aucun son)';
      case 'bgm':         return event.url ? event.url.split('/').pop() : '(aucune musique)';
      case 'tint':        return event.preset;
      case 'zoom':        return `${event.direction} × ${event.scale}`;
      case 'titleCard':   return event.title || '(sans titre)';
      case 'wait':        return event.speed;
      case 'vignette':    return event.on ? 'activé' : 'désactivé';
      case 'letterbox':   return event.on ? 'activé' : 'désactivé';
      default:            return '';
    }
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={[
        'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm select-none',
        'border',
        isSelected
          ? 'bg-violet-900/40 border-violet-500 ring-1 ring-violet-400'
          : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-base)] hover:border-[var(--color-border-hover)]',
      ].join(' ')}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="flex-shrink-0 text-[var(--color-text-muted)] cursor-grab active:cursor-grabbing"
        aria-label="Déplacer"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </span>

      {/* Index */}
      <span className="flex-shrink-0 w-5 text-center text-xs font-mono text-[var(--color-text-muted)]">{index + 1}</span>

      {/* Emoji icon */}
      <span className="flex-shrink-0 text-base leading-none">{emoji}</span>

      {/* Label + summary */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-text-primary)] text-[12px] leading-tight">{label}</p>
        {summary && (
          <p className="text-[10px] text-[var(--color-text-muted)] truncate leading-tight mt-0.5">{summary}</p>
        )}
      </div>

      {/* Delete button */}
      <button
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600/80 text-[var(--color-text-muted)] hover:text-white transition-all"
        title="Supprimer"
        aria-label="Supprimer cet événement"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Event Picker ──────────────────────────────────────────────────────────────

interface EventPickerProps {
  onPick: (type: CinematicEventType) => void;
  onClose: () => void;
}

function EventPicker({ onPick, onClose }: EventPickerProps) {
  const groups = ['essential', 'characters', 'effects', 'audio'] as const;
  const groupLabels: Record<string, string> = {
    essential: 'Essentiels', characters: 'Personnages', effects: 'Effets', audio: 'Son',
  };

  return (
    <div className="absolute left-0 right-0 bottom-full mb-2 z-50 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] shadow-2xl p-3">
      {groups.map(group => {
        const items = CINEMATIC_EVENT_META.filter(m => m.group === group);
        return (
          <div key={group} className="mb-3 last:mb-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">{groupLabels[group]}</p>
            <div className="flex flex-wrap gap-1">
              {items.map(meta => (
                <button
                  key={meta.type}
                  onClick={() => { onPick(meta.type); onClose(); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-[var(--color-bg-base)] hover:bg-violet-900/40 border border-[var(--color-border-base)] hover:border-violet-500 transition-colors text-[var(--color-text-primary)]"
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main CinematicEditor ──────────────────────────────────────────────────────

export function CinematicEditor() {
  const cinematicEditorOpen = useUIStore(s => s.cinematicEditorOpen);
  const cinematicEditorSceneId = useUIStore(s => s.cinematicEditorSceneId);
  const setCinematicEditorOpen = useUIStore(s => s.setCinematicEditorOpen);

  const scene = useScenesStore(s => s.scenes.find(sc => sc.id === cinematicEditorSceneId));
  const updateCinematicEvents = useScenesStore(s => s.updateCinematicEvents);
  const updateScene = useScenesStore(s => s.updateScene);
  const characters = useCharactersStore(s => s.characters);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const events = scene?.cinematicEvents ?? [];
  const selectedEvent = events.find(e => e.id === selectedEventId) ?? null;

  const handleClose = useCallback(() => {
    setCinematicEditorOpen(false, null);
    setSelectedEventId(null);
    setPickerOpen(false);
  }, [setCinematicEditorOpen]);

  const handleAddEvent = useCallback((type: CinematicEventType) => {
    if (!cinematicEditorSceneId) return;
    const newEvent = createDefaultCinematicEvent(type);
    updateCinematicEvents(cinematicEditorSceneId, [...events, newEvent]);
    setSelectedEventId(newEvent.id);
  }, [cinematicEditorSceneId, events, updateCinematicEvents]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    if (!cinematicEditorSceneId) return;
    updateCinematicEvents(cinematicEditorSceneId, events.filter(e => e.id !== eventId));
    if (selectedEventId === eventId) setSelectedEventId(null);
  }, [cinematicEditorSceneId, events, updateCinematicEvents, selectedEventId]);

  const handleUpdateEvent = useCallback((updated: CinematicEvent) => {
    if (!cinematicEditorSceneId) return;
    updateCinematicEvents(cinematicEditorSceneId, events.map(e => e.id === updated.id ? updated : e));
  }, [cinematicEditorSceneId, events, updateCinematicEvents]);

  // DnD reorder
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !cinematicEditorSceneId) return;
    const oldIdx = events.findIndex(ev => ev.id === active.id);
    const newIdx = events.findIndex(ev => ev.id === over.id);
    updateCinematicEvents(cinematicEditorSceneId, arrayMove(events, oldIdx, newIdx));
  }, [cinematicEditorSceneId, events, updateCinematicEvents]);

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

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* Left column: event sequence */}
          <div className="w-72 flex-shrink-0 border-r border-[var(--color-border-base)] flex flex-col">
            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] text-center p-4">
                  <Film className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucun événement</p>
                  <p className="text-xs mt-1 opacity-70">Clique sur "Ajouter" pour commencer ta cinématique</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={events.map(e => e.id)} strategy={verticalListSortingStrategy}>
                    {events.map((event, index) => {
                      const charId = 'characterId' in event ? event.characterId : undefined;
                      const char = charId ? characters.find(c => c.id === charId) : undefined;
                      return (
                        <EventCard
                          key={event.id}
                          event={event}
                          index={index}
                          isSelected={selectedEventId === event.id}
                          characterName={char?.name}
                          onSelect={() => setSelectedEventId(event.id)}
                          onDelete={() => handleDeleteEvent(event.id)}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Add event button + picker */}
            <div className="p-3 border-t border-[var(--color-border-base)] relative">
              <Button
                variant="token-primary"
                size="sm"
                onClick={() => setPickerOpen(prev => !prev)}
                className="w-full h-9 justify-center font-semibold text-[13px]"
                aria-expanded={pickerOpen}
                aria-haspopup="menu"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Ajouter un événement
              </Button>
              {pickerOpen && (
                <EventPicker onPick={handleAddEvent} onClose={() => setPickerOpen(false)} />
              )}
            </div>
          </div>

          {/* Right column: inspector */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            {selectedEvent ? (
              <CinematicEventInspector
                event={selectedEvent}
                characters={characters}
                onUpdate={handleUpdateEvent}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] text-center p-8">
                <p className="text-sm font-medium">Sélectionne un événement pour l'éditer</p>
                <p className="text-xs mt-1 opacity-70">Ou ajoute un nouvel événement avec le bouton ci-dessous</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
