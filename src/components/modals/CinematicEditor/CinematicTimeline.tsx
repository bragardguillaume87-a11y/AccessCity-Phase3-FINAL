/**
 * CinematicTimeline — Timeline NLE multi-pistes pour l'éditeur cinématique.
 *
 * Structure :
 *  - Toolbar   : Play/Pause, temps courant, zoom ±
 *  - Colonne labels (fixe)  : nom + bloc-count + bouton "+" par piste
 *  - Zone défilante (droite): règle temporelle + 5 pistes parallèles
 *
 * Canaux : Fond | Effets | Personnages | Audio | Dialogue
 */
import { useState, useCallback, useMemo, memo } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Plus } from 'lucide-react';
import type { Character } from '@/types';
import type { CinematicEvent, CinematicEventType, CinematicTrackId, CinematicTracks } from '@/types/cinematic';
import {
  CINEMATIC_EVENT_META, CINEMATIC_TRACKS_META, getTotalDurationMs, snapDurationToSpeed,
} from '@/types/cinematic';
import { CinematicTrackLane } from './CinematicTrackLane';
import {
  TOOLBAR_HEIGHT_PX, RULER_HEIGHT_PX, LANE_HEIGHT_PX,
  ZOOM_LEVELS, DEFAULT_ZOOM, TRACK_LABEL_WIDTH, TRACK_EVENT_TYPES,
  formatMs, getRulerInterval,
} from './CinematicTimeline.constants';

const TRACK_IDS: CinematicTrackId[] = ['background', 'effects', 'characters', 'audio', 'dialogue'];

// ── EventPicker (filtré par canal) ────────────────────────────────────────────

interface EventPickerProps {
  trackId: CinematicTrackId;
  onPick: (type: CinematicEventType) => void;
  onClose: () => void;
}

function EventPicker({ trackId, onPick, onClose }: EventPickerProps) {
  const allowed = TRACK_EVENT_TYPES[trackId];
  const items   = CINEMATIC_EVENT_META.filter(m => allowed.includes(m.type));
  return (
    <div
      style={{
        position: 'relative', zIndex: 60, minWidth: 180,
        borderRadius: 10, border: '1px solid var(--color-border-base)',
        background: 'var(--color-bg-elevated)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        padding: '8px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6, paddingLeft: 2 }}>
        {CINEMATIC_TRACKS_META[trackId].label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(meta => (
          <button
            key={meta.type}
            onClick={() => { onPick(meta.type); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
              borderRadius: 6, border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: 11, color: 'var(--color-text-primary)', textAlign: 'left',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── TimelineRuler ─────────────────────────────────────────────────────────────

interface TimelineRulerProps {
  totalMs: number;
  pxPerMs: number;
  totalWidthPx: number;
  playheadX: number;
  onSeek: (clickX: number) => void;
}

function TimelineRuler({ totalMs, pxPerMs, totalWidthPx, playheadX, onSeek }: TimelineRulerProps) {
  const interval   = getRulerInterval(pxPerMs);
  const marksCount = Math.ceil((totalMs + interval * 3) / interval);
  const marks = useMemo(
    () => Array.from({ length: Math.max(1, marksCount) }, (_, i) => i * interval),
    [marksCount, interval],
  );

  return (
    <div
      style={{
        position: 'relative', height: RULER_HEIGHT_PX, minWidth: totalWidthPx, flexShrink: 0,
        cursor: 'crosshair', background: 'rgba(0,0,0,0.35)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
      onClick={(e) => onSeek(e.nativeEvent.offsetX)}
    >
      {marks.map(t => {
        const x = t * pxPerMs;
        if (x > totalWidthPx + 80) return null;
        const isMajor = t % (interval * 2) === 0;
        return (
          <div
            key={t}
            style={{ position: 'absolute', left: x, top: 0, height: '100%', pointerEvents: 'none' }}
          >
            <div style={{ width: 1, height: isMajor ? 10 : 6, background: isMajor ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)' }} />
            {isMajor && (
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', paddingLeft: 2, lineHeight: 1, marginTop: 1, whiteSpace: 'nowrap', display: 'block' }}>
                {formatMs(t)}
              </span>
            )}
          </div>
        );
      })}
      {/* Playhead dans la règle */}
      <div style={{ position: 'absolute', left: playheadX, top: 0, bottom: 0, width: 1.5, background: '#f43f5e', pointerEvents: 'none' }} />
    </div>
  );
}

// ── CinematicTimeline ─────────────────────────────────────────────────────────

export interface CinematicTimelineProps {
  tracks: CinematicTracks;
  currentTimeMs: number;
  isPlaying: boolean;
  selectedEventId: string | null;
  characters: Character[];
  onSelectEvent: (trackedId: string) => void;
  onDeleteEvent: (trackedId: string) => void;
  onUpdateEvent: (trackedId: string, event: CinematicEvent) => void;
  onUpdateStartTime: (trackedId: string, newStartMs: number) => void;
  onAddEvent: (type: CinematicEventType, trackId: CinematicTrackId) => void;
  onSeek: (timeMs: number) => void;
  onPlayPause: () => void;
}

export const CinematicTimeline = memo(function CinematicTimeline({
  tracks, currentTimeMs, isPlaying, selectedEventId, characters,
  onSelectEvent, onDeleteEvent, onUpdateEvent, onUpdateStartTime, onAddEvent,
  onSeek, onPlayPause,
}: CinematicTimelineProps) {
  const [zoomIdx, setZoomIdx]                       = useState(DEFAULT_ZOOM);
  const [pickerOpenForTrack, setPickerOpenForTrack] = useState<CinematicTrackId | null>(null);

  const pxPerMs      = ZOOM_LEVELS[zoomIdx];
  const totalMs      = useMemo(() => getTotalDurationMs(tracks), [tracks]);
  const totalWidthPx = useMemo(() => Math.max(totalMs * pxPerMs + 200, 600), [totalMs, pxPerMs]);
  const playheadX    = currentTimeMs * pxPerMs;
  const zoomLabel    = `${Math.round((pxPerMs / 0.22) * 100)}%`;
  const totalHeight  = TOOLBAR_HEIGHT_PX + RULER_HEIGHT_PX + TRACK_IDS.length * LANE_HEIGHT_PX;

  const handleRulerSeek = useCallback((clickX: number) => {
    onSeek(clickX / pxPerMs);
  }, [pxPerMs, onSeek]);

  const handleResizeEnd = useCallback((trackedId: string, finalWidthPx: number) => {
    for (const track of Object.values(tracks)) {
      const te = track.find(t => t.id === trackedId);
      if (te && 'speed' in te.event) {
        const newSpeed = snapDurationToSpeed(finalWidthPx / pxPerMs);
        onUpdateEvent(trackedId, { ...te.event, speed: newSpeed } as CinematicEvent);
        return;
      }
    }
  }, [tracks, pxPerMs, onUpdateEvent]);

  // Fermer le picker en cliquant ailleurs
  const handleContainerClick = useCallback(() => {
    if (pickerOpenForTrack) setPickerOpenForTrack(null);
  }, [pickerOpenForTrack]);

  // Position verticale du picker (aligné sur la piste correspondante)
  const pickerTop = pickerOpenForTrack !== null
    ? TOOLBAR_HEIGHT_PX + RULER_HEIGHT_PX + TRACK_IDS.indexOf(pickerOpenForTrack) * LANE_HEIGHT_PX
    : 0;

  return (
    <div
      style={{
        height: totalHeight,
        display: 'flex', flexDirection: 'column',
        borderTop: '1px solid var(--color-border-base)',
        background: 'var(--color-bg-base)',
        flexShrink: 0,
        position: 'relative',
      }}
      onClick={handleContainerClick}
    >
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div style={{
        height: TOOLBAR_HEIGHT_PX,
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
        borderBottom: '1px solid var(--color-border-base)',
        background: 'var(--color-bg-elevated)', flexShrink: 0,
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

        {/* Temps courant / total */}
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {formatMs(currentTimeMs)}
          <span style={{ opacity: 0.45 }}> / {formatMs(totalMs)}</span>
        </span>

        <div style={{ flex: 1 }} />

        {/* Zoom − */}
        <button
          onClick={() => setZoomIdx(i => Math.max(0, i - 1))}
          disabled={zoomIdx === 0}
          style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'transparent', border: '1px solid var(--color-border-base)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)', opacity: zoomIdx === 0 ? 0.3 : 1,
          }}
          aria-label="Dézoomer"
        >
          <ZoomOut size={12} />
        </button>

        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace', minWidth: 36, textAlign: 'center' }}>
          {zoomLabel}
        </span>

        {/* Zoom + */}
        <button
          onClick={() => setZoomIdx(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          disabled={zoomIdx === ZOOM_LEVELS.length - 1}
          style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'transparent', border: '1px solid var(--color-border-base)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)', opacity: zoomIdx === ZOOM_LEVELS.length - 1 ? 0.3 : 1,
          }}
          aria-label="Zoomer"
        >
          <ZoomIn size={12} />
        </button>
      </div>

      {/* ── Body : labels + zone défilante ───────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Colonne labels (fixe, ne défile pas) */}
        <div style={{
          width: TRACK_LABEL_WIDTH, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          {/* Espace pour la règle */}
          <div style={{ height: RULER_HEIGHT_PX, flexShrink: 0 }} />

          {/* Labels des 5 pistes */}
          {TRACK_IDS.map(trackId => {
            const meta  = CINEMATIC_TRACKS_META[trackId];
            const count = tracks[trackId].length;
            return (
              <div
                key={trackId}
                style={{
                  height: LANE_HEIGHT_PX, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 8px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Nom + compteur */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: meta.accentColor, lineHeight: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', lineHeight: 1, marginTop: 2 }}>
                    {count} bloc{count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Bouton "+" */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerOpenForTrack(p => p === trackId ? null : trackId);
                  }}
                  style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    background: pickerOpenForTrack === trackId ? meta.accentColor : 'rgba(255,255,255,0.1)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', transition: 'background 0.15s',
                  }}
                  aria-label={`Ajouter sur ${meta.label}`}
                  title={`Ajouter — ${meta.label}`}
                >
                  <Plus size={11} style={{ transform: pickerOpenForTrack === trackId ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Zone défilante (règle + pistes) */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', position: 'relative' }}>
          {/* Règle temporelle */}
          <TimelineRuler
            totalMs={totalMs}
            pxPerMs={pxPerMs}
            totalWidthPx={totalWidthPx}
            playheadX={playheadX}
            onSeek={handleRulerSeek}
          />

          {/* 5 pistes */}
          <div style={{ position: 'relative' }}>
            {TRACK_IDS.map(trackId => (
              <CinematicTrackLane
                key={trackId}
                trackId={trackId}
                trackedEvents={tracks[trackId]}
                selectedEventId={selectedEventId}
                pxPerMs={pxPerMs}
                totalWidthPx={totalWidthPx}
                characters={characters}
                onSelectEvent={onSelectEvent}
                onDeleteEvent={onDeleteEvent}
                onResizeEnd={handleResizeEnd}
                onDragEnd={onUpdateStartTime}
              />
            ))}

            {/* Playhead vertical (traverse toutes les pistes) */}
            <div style={{
              position: 'absolute', left: playheadX, top: 0, bottom: 0, width: 1.5,
              background: '#f43f5e', pointerEvents: 'none', zIndex: 10,
            }}>
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
                borderTop: '6px solid #f43f5e',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── EventPicker flottant (positionné dans le container) ──────────── */}
      {pickerOpenForTrack && (
        <div
          style={{
            position: 'absolute',
            top: pickerTop,
            left: TRACK_LABEL_WIDTH + 4,
            zIndex: 50,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <EventPicker
            trackId={pickerOpenForTrack}
            onPick={(type) => {
              onAddEvent(type, pickerOpenForTrack);
              setPickerOpenForTrack(null);
            }}
            onClose={() => setPickerOpenForTrack(null)}
          />
        </div>
      )}
    </div>
  );
});
