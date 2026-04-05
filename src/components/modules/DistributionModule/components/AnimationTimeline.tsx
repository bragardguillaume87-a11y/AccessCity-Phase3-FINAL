import { useRef, useCallback, useState, useEffect } from 'react';
import type { KeyframeEntry } from '@/types/bone';
import { EASING_LABELS } from '@/utils/animationEasing';

interface AnimationTimelineProps {
  keyframes: KeyframeEntry[];
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isPlaying: boolean;
  speed: number;
  onPlayToggle: () => void;
  onSeek: (frame: number) => void;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [
  { value: 0.5, label: '🐌 0.5×' },
  { value: 1, label: '🐾 1×' },
  { value: 2, label: '🐇 2×' },
];

/** Couleurs des blocs keyframe — cycle sur 6 couleurs distinctes */
const KF_BLOCK_COLORS = [
  'rgba(139,92,246,0.7)',
  'rgba(52,211,153,0.7)',
  'rgba(244,114,182,0.7)',
  'rgba(96,165,250,0.7)',
  'rgba(251,146,60,0.7)',
  'rgba(250,204,21,0.7)',
];

/**
 * AnimationTimeline — Scrubber + contrôles lecture.
 * Affiche les keyframes comme blocs proportionnels à leur durée.
 * Le curseur est draggable pour le seek frame-level.
 */
export function AnimationTimeline({
  keyframes,
  currentFrame,
  totalFrames,
  fps,
  isPlaying,
  speed,
  onPlayToggle,
  onSeek,
  onSpeedChange,
}: AnimationTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Durées individuelles en frames
  const kfFrames = keyframes.map((kf) => Math.max(1, Math.round(kf.duration * fps)));

  // Seek par clic ou drag sur la barre
  const seekFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || totalFrames === 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(Math.round(ratio * (totalFrames - 1)));
    },
    [totalFrames, onSeek]
  );

  // Listeners window attachés/détachés via useEffect — garantit le cleanup même si mouseup
  // se produit hors de la fenêtre (drag sorti du navigateur)
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (ev: MouseEvent) => seekFromPointer(ev.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, seekFromPointer]);

  const handleTrackMouseDown = useCallback(
    (e: React.MouseEvent) => {
      seekFromPointer(e.clientX);
      setIsDragging(true);
    },
    [seekFromPointer]
  );

  const currentTimeSec = totalFrames > 0 ? (currentFrame / fps).toFixed(2) : '0.00';
  const totalTimeSec = totalFrames > 0 ? (totalFrames / fps).toFixed(2) : '0.00';
  const cursorPct = totalFrames > 1 ? (currentFrame / (totalFrames - 1)) * 100 : 0;

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border-base)',
        background: 'var(--color-bg-elevated)',
        padding: '8px 10px 10px',
        flexShrink: 0,
      }}
    >
      {/* Barre de timeline */}
      <div
        ref={trackRef}
        onMouseDown={handleTrackMouseDown}
        style={{
          position: 'relative',
          height: 28,
          borderRadius: 4,
          overflow: 'hidden',
          cursor: 'pointer',
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-border-base)',
          display: 'flex',
          marginBottom: 6,
        }}
        title="Cliquez ou faites glisser pour naviguer"
      >
        {/* Blocs keyframe proportionnels */}
        {kfFrames.map((kfLen, idx) => {
          const kf = keyframes[idx];
          const widthPct = totalFrames > 0 ? (kfLen / totalFrames) * 100 : 0;
          return (
            <div
              key={`${kf.poseId}-${kf.easing}-${kf.duration}-${idx}`}
              title={`${kf.poseId.slice(0, 6)} — ${kf.duration}s — ${EASING_LABELS[kf.easing]}`}
              style={{
                width: `${widthPct}%`,
                background: KF_BLOCK_COLORS[idx % KF_BLOCK_COLORS.length],
                borderRight: '1px solid rgba(0,0,0,0.25)',
                height: '100%',
                flexShrink: 0,
                transition: 'opacity 0.1s',
              }}
            />
          );
        })}

        {/* Curseur de lecture */}
        {totalFrames > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${cursorPct}%`,
              width: 2,
              background: '#fff',
              boxShadow: '0 0 4px rgba(255,255,255,0.8)',
              pointerEvents: 'none',
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>

      {/* Contrôles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Play / Pause */}
        <button
          type="button"
          onClick={onPlayToggle}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            border: '1.5px solid var(--color-primary)',
            background: isPlaying ? 'var(--color-primary)' : 'var(--color-primary-subtle)',
            color: isPlaying ? '#fff' : 'var(--color-primary)',
            transition: 'background 0.1s',
            flexShrink: 0,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Vitesse */}
        <div style={{ display: 'flex', gap: 3 }}>
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSpeedChange(opt.value)}
              style={{
                padding: '3px 7px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: speed === opt.value ? 700 : 400,
                border:
                  speed === opt.value
                    ? '1.5px solid var(--color-primary)'
                    : '1.5px solid var(--color-border-base)',
                background: speed === opt.value ? 'var(--color-primary-subtle)' : 'transparent',
                color: speed === opt.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
                transition: 'background 0.1s, border-color 0.1s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Indicateur frame/temps */}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: 'var(--color-text-muted)',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {currentFrame + 1}&thinsp;/&thinsp;{totalFrames} — {currentTimeSec}s&thinsp;/&thinsp;
          {totalTimeSec}s
        </span>
      </div>
    </div>
  );
}
