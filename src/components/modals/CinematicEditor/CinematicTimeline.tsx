/**
 * CinematicTimeline — Timeline horizontale style Powtoon pour l'éditeur cinématique.
 *
 * Fonctionnalités :
 * - Blocs colorés proportionnels à la durée (CINEMATIC_SPEED_MS)
 * - Drag-to-reorder (dnd-kit, rectSortingStrategy)
 * - Drag-to-resize : poignée droite → snap vers la vitesse la plus proche
 * - Clic sur règle → seek playhead à ce temps
 * - Zoom +/− (5 niveaux de 0.06 à 0.60 px/ms)
 * - Bouton + flottant → EventPicker
 */
import { useState, useRef, useCallback, useMemo } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, rectSortingStrategy, useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Pause, Plus, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';
import type { Character } from '@/types';
import type { CinematicEvent, CinematicEventType } from '@/types/cinematic';
import {
  CINEMATIC_EVENT_META, CINEMATIC_SPEED_LABELS,
  getEventDurationMs, snapDurationToSpeed,
} from '@/types/cinematic';

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_BLOCK_PX    = 64;   // Largeur minimale d'un bloc (px)
const BLOCK_HEIGHT_PX = 80;   // Hauteur d'un bloc dans la piste (px)
const RULER_HEIGHT_PX = 24;   // Hauteur de la règle temporelle (px)
const TOOLBAR_HEIGHT  = 44;   // Hauteur de la barre d'outils (px)
const BLOCK_GAP       = 3;    // Espace entre les blocs (px)
const ZOOM_LEVELS     = [0.06, 0.12, 0.22, 0.40, 0.70] as const; // px/ms
const DEFAULT_ZOOM    = 2;    // Index dans ZOOM_LEVELS (0.22 px/ms par défaut)

// ── Block colors ──────────────────────────────────────────────────────────────

const BLOCK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  fade:             { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  flash:            { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  screenShake:      { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  vignette:         { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  tint:             { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  zoom:             { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  letterbox:        { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  characterEnter:   { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  characterExit:    { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  characterMove:    { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  characterExpression: { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  characterShake:   { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  sfx:              { bg: '#064e3b', border: '#059669', text: '#d1fae5' },
  bgm:              { bg: '#064e3b', border: '#059669', text: '#d1fae5' },
  bgmStop:          { bg: '#064e3b', border: '#059669', text: '#d1fae5' },
  ambiance:         { bg: '#064e3b', border: '#059669', text: '#d1fae5' },
  dialogue:         { bg: '#78350f', border: '#d97706', text: '#fef3c7' },
  wait:             { bg: '#111827', border: '#4b5563', text: '#d1d5db' },
  background:       { bg: '#831843', border: '#db2777', text: '#fce7f3' },
  titleCard:        { bg: '#831843', border: '#db2777', text: '#fce7f3' },
};

const FALLBACK_COLOR = { bg: '#1f2937', border: '#374151', text: '#f3f4f6' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBlockWidth(event: CinematicEvent, pxPerMs: number): number {
  return Math.max(MIN_BLOCK_PX, getEventDurationMs(event) * pxPerMs);
}

function formatMs(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m${(s % 60).toFixed(0)}s`;
}

function getRulerInterval(pxPerMs: number): number {
  if (pxPerMs < 0.08) return 5000;
  if (pxPerMs < 0.18) return 2000;
  if (pxPerMs < 0.35) return 1000;
  if (pxPerMs < 0.65) return 500;
  return 200;
}

// ── EventPicker ───────────────────────────────────────────────────────────────

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
    <div
      className="absolute bottom-full mb-2 right-0 z-50 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] shadow-2xl p-3 w-72"
      onClick={(e) => e.stopPropagation()}
    >
      {groups.map(group => {
        const items = CINEMATIC_EVENT_META.filter(m => m.group === group);
        return (
          <div key={group} className="mb-3 last:mb-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
              {groupLabels[group]}
            </p>
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

// ── TimelineBlock ─────────────────────────────────────────────────────────────

interface TimelineBlockProps {
  event: CinematicEvent;
  index: number;
  isSelected: boolean;
  blockWidth: number;
  characterName?: string;
  pxPerMs: number;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onResizeEnd: (event: CinematicEvent, finalWidthPx: number, pxPerMs: number) => void;
}

function TimelineBlock({
  event, index, isSelected, blockWidth, characterName, pxPerMs,
  onSelect, onDelete, onResizeEnd,
}: TimelineBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: event.id });

  // Local resize state
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const resizeData = useRef({ startX: 0, startWidth: 0, currentWidth: 0 });

  const meta    = CINEMATIC_EVENT_META.find(m => m.type === event.type);
  const emoji   = meta?.emoji ?? '❓';
  const label   = meta?.label ?? event.type;
  const canResize = 'speed' in event;
  const colors  = BLOCK_COLORS[event.type] ?? FALLBACK_COLOR;
  const displayWidth = resizeWidth ?? blockWidth;

  // Speed label for events with speed
  const speedLabel = canResize
    ? CINEMATIC_SPEED_LABELS[(event as { speed: keyof typeof CINEMATIC_SPEED_LABELS }).speed]
    : null;

  // ── Resize pointer handlers (with pointer capture) ─────────────────────────

  const handleResizeDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const w = blockWidth;
    resizeData.current = { startX: e.clientX, startWidth: w, currentWidth: w };
    setResizeWidth(w);
  }, [blockWidth]);

  const handleResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (resizeData.current.startX === 0) return;
    const delta = e.clientX - resizeData.current.startX;
    const newW = Math.max(MIN_BLOCK_PX, resizeData.current.startWidth + delta);
    resizeData.current.currentWidth = newW;
    setResizeWidth(newW);
  }, []);

  const handleResizeUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const finalW = resizeData.current.currentWidth || blockWidth;
    resizeData.current.startX = 0;
    setResizeWidth(null);
    onResizeEnd(event, finalW, pxPerMs);
  }, [event, blockWidth, pxPerMs, onResizeEnd]);

  // ── Block style ────────────────────────────────────────────────────────────

  const blockStyle: React.CSSProperties = {
    width: displayWidth,
    height: BLOCK_HEIGHT_PX,
    flexShrink: 0,
    position: 'relative',
    borderRadius: 6,
    border: `1.5px solid ${isSelected ? '#a78bfa' : colors.border}`,
    background: colors.bg,
    color: colors.text,
    boxShadow: isSelected
      ? '0 0 0 2px rgba(167,139,250,0.5), 0 2px 8px rgba(0,0,0,0.4)'
      : '0 1px 4px rgba(0,0,0,0.3)',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    overflow: 'hidden',
    marginRight: BLOCK_GAP,
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={blockStyle}
      {...attributes}
      {...listeners}
      onClick={onSelect}
    >
      {/* Content (pointer events pass through to block for select/drag) */}
      <div style={{ padding: '8px 30px 6px 8px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
        {/* Index + emoji */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, opacity: 0.6, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{index + 1}</span>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
        </div>
        {/* Label */}
        <p style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
        {/* Sub-info */}
        <p style={{ fontSize: 9, opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {speedLabel ?? characterName ?? ''}
        </p>
      </div>

      {/* Delete button */}
      <button
        style={{
          position: 'absolute', top: 4, right: canResize ? 18 : 4,
          width: 16, height: 16, borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', border: 'none',
          cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
          pointerEvents: 'all',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onDelete}
        aria-label="Supprimer cet événement"
        title="Supprimer"
      >
        <Trash2 size={9} />
      </button>

      {/* Resize handle (events with speed only) */}
      {canResize && (
        <div
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 14,
            cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.07)',
            pointerEvents: 'all',
          }}
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          onClick={(e) => e.stopPropagation()}
          title="Glisser pour changer la durée"
        >
          <div style={{
            width: 2, height: 28, borderRadius: 1,
            background: 'rgba(255,255,255,0.35)',
          }} />
        </div>
      )}
    </div>
  );
}

// ── TimelineRuler ─────────────────────────────────────────────────────────────

interface TimelineRulerProps {
  totalMs: number;
  pxPerMs: number;
  minWidth: number;
  onSeek: (clickX: number) => void;
}

function TimelineRuler({ totalMs, pxPerMs, minWidth, onSeek }: TimelineRulerProps) {
  const interval = getRulerInterval(pxPerMs);
  const marksCount = Math.ceil((totalMs + interval * 3) / interval);

  const marks = useMemo(
    () => Array.from({ length: Math.max(1, marksCount) }, (_, i) => i * interval),
    [marksCount, interval],
  );

  return (
    <div
      style={{
        position: 'relative', height: RULER_HEIGHT_PX, minWidth, flexShrink: 0,
        cursor: 'crosshair', background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
      onClick={(e) => onSeek(e.nativeEvent.offsetX)}
    >
      {marks.map(t => {
        const x = t * pxPerMs;
        if (x > minWidth + 80) return null;
        const isMajor = t % (interval * 2) === 0;
        return (
          <div
            key={t}
            style={{ position: 'absolute', left: x, top: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pointerEvents: 'none' }}
          >
            <div style={{ width: 1, height: isMajor ? 10 : 6, background: isMajor ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', marginTop: 0 }} />
            {isMajor && (
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', paddingLeft: 2, lineHeight: 1, marginTop: 1, whiteSpace: 'nowrap' }}>
                {formatMs(t)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── CinematicTimeline ─────────────────────────────────────────────────────────

export interface CinematicTimelineProps {
  events: CinematicEvent[];
  playheadIndex: number;
  isPlaying: boolean;
  selectedEventId: string | null;
  characters: Character[];
  onSelectEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onReorderEvents: (newEvents: CinematicEvent[]) => void;
  onUpdateEvent: (event: CinematicEvent) => void;
  onAddEvent: (type: CinematicEventType) => void;
  onGoTo: (index: number) => void;
  onPlayPause: () => void;
}

export function CinematicTimeline({
  events, playheadIndex, isPlaying, selectedEventId, characters,
  onSelectEvent, onDeleteEvent, onReorderEvents, onUpdateEvent, onAddEvent,
  onGoTo, onPlayPause,
}: CinematicTimelineProps) {
  const [zoomIdx, setZoomIdx]     = useState(DEFAULT_ZOOM);
  const [pickerOpen, setPickerOpen] = useState(false);

  const pxPerMs = ZOOM_LEVELS[zoomIdx];

  // ── Derived values ─────────────────────────────────────────────────────────

  const blockWidths = useMemo(
    () => events.map(e => getBlockWidth(e, pxPerMs)),
    [events, pxPerMs],
  );

  const totalDurationMs = useMemo(
    () => events.reduce((sum, e) => sum + getEventDurationMs(e), 0),
    [events],
  );

  const currentTimeMs = useMemo(
    () => events.slice(0, playheadIndex).reduce((sum, e) => sum + getEventDurationMs(e), 0),
    [events, playheadIndex],
  );

  const totalWidthPx = useMemo(
    () => Math.max(blockWidths.reduce((sum, w) => sum + w + BLOCK_GAP, 0) + 120, 500),
    [blockWidths],
  );

  // Playhead x position = sum of widths of events before playheadIndex
  const playheadX = useMemo(
    () => events.slice(0, playheadIndex).reduce((sum, _e, i) => sum + blockWidths[i] + BLOCK_GAP, 0),
    [events, playheadIndex, blockWidths],
  );

  // ── DnD setup ──────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = events.findIndex(ev => ev.id === active.id);
    const newIdx = events.findIndex(ev => ev.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) onReorderEvents(arrayMove(events, oldIdx, newIdx));
  }, [events, onReorderEvents]);

  // ── Resize → snap speed ────────────────────────────────────────────────────

  const handleResizeEnd = useCallback((event: CinematicEvent, finalWidthPx: number, px: number) => {
    if (!('speed' in event)) return;
    const targetMs = finalWidthPx / px;
    const newSpeed = snapDurationToSpeed(targetMs);
    onUpdateEvent({ ...event, speed: newSpeed } as CinematicEvent);
  }, [onUpdateEvent]);

  // ── Ruler seek ─────────────────────────────────────────────────────────────

  const handleRulerSeek = useCallback((clickX: number) => {
    let cumulative = 0;
    for (let i = 0; i < events.length; i++) {
      cumulative += getEventDurationMs(events[i]);
      if (clickX / pxPerMs <= cumulative) { onGoTo(i); return; }
    }
    if (events.length > 0) onGoTo(events.length - 1);
  }, [events, pxPerMs, onGoTo]);

  // ── Zoom label (percentages relative to 0.22 px/ms = 100%) ───────────────
  const zoomLabel = `${Math.round((pxPerMs / 0.22) * 100)}%`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      height: 280,
      display: 'flex',
      flexDirection: 'column',
      borderTop: '1px solid var(--color-border-base)',
      background: 'var(--color-bg-base)',
      position: 'relative',
      flexShrink: 0,
    }}>

      {/* Toolbar */}
      <div style={{
        height: TOOLBAR_HEIGHT,
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
        borderBottom: '1px solid var(--color-border-base)', flexShrink: 0,
        background: 'var(--color-bg-elevated)',
      }}>
        {/* Play / Pause */}
        <button
          onClick={onPlayPause}
          style={{
            width: 32, height: 32, borderRadius: '50%', background: '#7c3aed',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white', flexShrink: 0,
          }}
          aria-label={isPlaying ? 'Pause' : 'Lire'}
        >
          {isPlaying
            ? <Pause size={13} />
            : <Play size={13} style={{ transform: 'translateX(1px)' }} />}
        </button>

        {/* Time display */}
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {formatMs(currentTimeMs)}
          <span style={{ opacity: 0.45 }}> / {formatMs(totalDurationMs)}</span>
        </span>

        {/* Event counter */}
        {events.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
            {playheadIndex + 1} / {events.length}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Zoom controls */}
        <button
          onClick={() => setZoomIdx(i => Math.max(0, i - 1))}
          disabled={zoomIdx === 0}
          style={{
            width: 26, height: 26, borderRadius: 6, background: 'transparent',
            border: '1px solid var(--color-border-base)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)', opacity: zoomIdx === 0 ? 0.3 : 1,
          }}
          aria-label="Dézoomer"
        >
          <ZoomOut size={12} />
        </button>

        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace', minWidth: 36, textAlign: 'center' }}>
          {zoomLabel}
        </span>

        <button
          onClick={() => setZoomIdx(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          disabled={zoomIdx === ZOOM_LEVELS.length - 1}
          style={{
            width: 26, height: 26, borderRadius: 6, background: 'transparent',
            border: '1px solid var(--color-border-base)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)', opacity: zoomIdx === ZOOM_LEVELS.length - 1 ? 0.3 : 1,
          }}
          aria-label="Zoomer"
        >
          <ZoomIn size={12} />
        </button>
      </div>

      {/* Scrollable area: ruler + track */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', position: 'relative' }}>

        {/* Ruler */}
        <TimelineRuler
          totalMs={totalDurationMs}
          pxPerMs={pxPerMs}
          minWidth={totalWidthPx}
          onSeek={handleRulerSeek}
        />

        {/* Track */}
        <div style={{
          position: 'relative', minWidth: totalWidthPx, padding: '12px 60px 12px 8px',
          display: 'flex', alignItems: 'center',
        }}>
          {events.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, padding: '8px 16px', userSelect: 'none' }}>
              Clique sur <strong style={{ color: '#a78bfa' }}>+</strong> pour ajouter un premier événement
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={events.map(e => e.id)} strategy={rectSortingStrategy}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  {events.map((event, index) => {
                    const charId = 'characterId' in event ? (event as { characterId: string }).characterId : undefined;
                    const char   = charId ? characters.find(c => c.id === charId) : undefined;
                    return (
                      <TimelineBlock
                        key={event.id}
                        event={event}
                        index={index}
                        isSelected={selectedEventId === event.id}
                        blockWidth={blockWidths[index]}
                        characterName={char?.name}
                        pxPerMs={pxPerMs}
                        onSelect={() => onSelectEvent(event.id)}
                        onDelete={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                        onResizeEnd={handleResizeEnd}
                      />
                    );
                  })}

                  {/* Playhead */}
                  <div style={{
                    position: 'absolute',
                    left: playheadX - 1,
                    top: -12, bottom: -12,
                    width: 2, background: '#f43f5e',
                    pointerEvents: 'none', zIndex: 10,
                  }}>
                    {/* Triangle indicator at top */}
                    <div style={{
                      position: 'absolute', top: 0, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '8px solid #f43f5e',
                    }} />
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Floating "+" button */}
      <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 20 }}>
        {pickerOpen && (
          <EventPicker
            onPick={(type) => { onAddEvent(type); setPickerOpen(false); }}
            onClose={() => setPickerOpen(false)}
          />
        )}
        <button
          onClick={() => setPickerOpen(p => !p)}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: pickerOpen ? '#5b21b6' : '#7c3aed',
            border: '2px solid #a78bfa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white',
            boxShadow: '0 4px 14px rgba(124,58,237,0.6)',
            transition: 'background 0.15s',
          }}
          aria-label="Ajouter un événement"
          aria-expanded={pickerOpen}
          title="Ajouter un événement"
        >
          <Plus size={18} style={{ transform: pickerOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
      </div>
    </div>
  );
}
