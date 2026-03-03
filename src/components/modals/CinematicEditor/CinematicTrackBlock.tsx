/**
 * CinematicTrackBlock — Bloc individuel dans une piste de la timeline multi-canaux.
 *
 * Positionné absolument dans sa piste par `startTimeMs * pxPerMs`.
 * - Drag horizontal → change `startTimeMs` (via onDragEnd)
 * - Poignée droite → change `speed` (snap durée, via onResizeEnd)
 * - Bouton ✕ → suppression
 */
import { useState, useRef, useCallback, memo } from 'react';
import { Trash2 } from 'lucide-react';
import type { CinematicTrackedEvent } from '@/types/cinematic';
import { CINEMATIC_EVENT_META, CINEMATIC_SPEED_LABELS } from '@/types/cinematic';
import {
  BLOCK_COLORS, FALLBACK_COLOR, BLOCK_HEIGHT_PX, LANE_PADDING_Y, MIN_BLOCK_PX,
  getBlockWidth,
} from './CinematicTimeline.constants';

interface CinematicTrackBlockProps {
  tracked: CinematicTrackedEvent;
  isSelected: boolean;
  pxPerMs: number;
  characterName?: string;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onResizeEnd: (trackedId: string, finalWidthPx: number) => void;
  onDragEnd: (trackedId: string, newStartMs: number) => void;
}

export const CinematicTrackBlock = memo(function CinematicTrackBlock({
  tracked, isSelected, pxPerMs, characterName,
  onSelect, onDelete, onResizeEnd, onDragEnd,
}: CinematicTrackBlockProps) {
  const { event } = tracked;
  const baseWidth = getBlockWidth(event, pxPerMs);

  // Drag horizontal (repositionnement)
  const [dragDeltaMs, setDragDeltaMs] = useState(0);
  const [isDragging, setIsDragging]   = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startMs: tracked.startTimeMs });

  // Resize (poignée droite)
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const resizeRef = useRef({ startX: 0, startWidth: 0, currentWidth: 0 });

  const meta      = CINEMATIC_EVENT_META.find(m => m.type === event.type);
  const colors    = BLOCK_COLORS[event.type] ?? FALLBACK_COLOR;
  const canResize = 'speed' in event;
  const speedLabel = canResize
    ? CINEMATIC_SPEED_LABELS[(event as { speed: keyof typeof CINEMATIC_SPEED_LABELS }).speed]
    : null;

  const displayLeft  = (tracked.startTimeMs + dragDeltaMs) * pxPerMs;
  const displayWidth = resizeWidth ?? baseWidth;

  // ── Drag horizontal ─────────────────────────────────────────────────────────

  const handleDragDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startX: e.clientX, startMs: tracked.startTimeMs };
    setIsDragging(true);
  }, [tracked.startTimeMs]);

  const handleDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const deltaMs = (e.clientX - dragRef.current.startX) / pxPerMs;
    setDragDeltaMs(Math.max(-dragRef.current.startMs, deltaMs));
  }, [pxPerMs]);

  const handleDragUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const newStartMs = Math.max(0, dragRef.current.startMs + dragDeltaMs);
    dragRef.current.active = false;
    setDragDeltaMs(0);
    setIsDragging(false);
    onDragEnd(tracked.id, newStartMs);
  }, [dragDeltaMs, tracked.id, onDragEnd]);

  // ── Resize (poignée droite) ──────────────────────────────────────────────────

  const handleResizeDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = { startX: e.clientX, startWidth: baseWidth, currentWidth: baseWidth };
    setResizeWidth(baseWidth);
  }, [baseWidth]);

  const handleResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (resizeRef.current.startX === 0) return;
    const newW = Math.max(MIN_BLOCK_PX, resizeRef.current.startWidth + (e.clientX - resizeRef.current.startX));
    resizeRef.current.currentWidth = newW;
    setResizeWidth(newW);
  }, []);

  const handleResizeUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const finalW = resizeRef.current.currentWidth || baseWidth;
    resizeRef.current.startX = 0;
    setResizeWidth(null);
    onResizeEnd(tracked.id, finalW);
  }, [baseWidth, tracked.id, onResizeEnd]);

  return (
    <div
      style={{
        position: 'absolute',
        left: displayLeft,
        top: LANE_PADDING_Y,
        width: displayWidth,
        height: BLOCK_HEIGHT_PX,
        borderRadius: 5,
        border: `1.5px solid ${isSelected ? '#a78bfa' : colors.border}`,
        background: colors.bg,
        color: colors.text,
        boxShadow: isSelected ? '0 0 0 2px rgba(167,139,250,0.4), 0 2px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.3)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        overflow: 'hidden',
        zIndex: isSelected ? 2 : 1,
        opacity: isDragging ? 0.8 : 1,
        transition: isDragging ? 'none' : 'opacity 0.1s',
      }}
      onPointerDown={handleDragDown}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragUp}
      onClick={onSelect}
    >
      {/* Contenu du bloc */}
      <div style={{
        padding: '5px 28px 4px 8px', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>{meta?.emoji ?? '❓'}</span>
          <p style={{ fontSize: 9, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            {meta?.label ?? event.type}
          </p>
        </div>
        <p style={{ fontSize: 8, opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {speedLabel ?? characterName ?? ''}
        </p>
      </div>

      {/* Bouton supprimer */}
      <button
        style={{
          position: 'absolute', top: 3, right: canResize ? 16 : 3,
          width: 14, height: 14, borderRadius: 3,
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
        <Trash2 size={8} />
      </button>

      {/* Poignée de redimensionnement */}
      {canResize && (
        <div
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 12,
            cursor: 'ew-resize',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.07)',
            pointerEvents: 'all',
          }}
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          onClick={(e) => e.stopPropagation()}
          title="Glisser pour changer la durée"
        >
          <div style={{ width: 2, height: 18, borderRadius: 1, background: 'rgba(255,255,255,0.35)' }} />
        </div>
      )}
    </div>
  );
});
