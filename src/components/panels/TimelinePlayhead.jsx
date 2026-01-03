import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * TimelinePlayhead - Timeline scrubber at bottom of canvas (Powtoon-style)
 *
 * Features:
 * - Scrub preview (drag playhead to navigate time)
 * - Play/Pause button
 * - Timecode display (00:00)
 * - Dialogue markers (small dots on timeline)
 * - Scene duration indicator
 *
 * @param {Object} props
 * @param {number} props.currentTime - Current playback time in seconds
 * @param {number} props.duration - Total scene duration in seconds
 * @param {Array} props.dialogues - Array of dialogues with timestamps
 * @param {Function} props.onSeek - Callback (time) when user scrubs timeline
 * @param {Function} props.onPlayPause - Callback when play/pause is toggled
 * @param {boolean} props.isPlaying - Whether preview is currently playing
 */
export default function TimelinePlayhead({
  currentTime = 0,
  duration = 60,
  dialogues = [],
  onSeek = () => {},
  onPlayPause = () => {},
  isPlaying = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef(null);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate playhead position (0-100%)
  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle playhead drag
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const newTime = (percentage / 100) * duration;

    onSeek(newTime);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleTimelineClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Calculate dialogue marker positions
  const dialogueMarkers = dialogues.map((dialogue, idx) => {
    const dialogueTime = idx * (duration / Math.max(1, dialogues.length));
    const position = (dialogueTime / duration) * 100;
    return { id: dialogue.id || idx, position, dialogue };
  });

  return (
    <div
      className="h-16 bg-[var(--color-bg-elevated)] border-t-2 border-[var(--color-border-base)] flex items-center gap-4 px-4"
      role="region"
      aria-label="Timeline controls"
    >
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPlayPause}
        className="flex-shrink-0 hover:bg-[var(--color-bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
        ) : (
          <Play className="h-5 w-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
        )}
      </Button>

      {/* Skip Backward */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSeek(Math.max(0, currentTime - 5))}
        className="flex-shrink-0 hover:bg-[var(--color-bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        aria-label="Skip backward 5 seconds"
      >
        <SkipBack className="h-4 w-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
      </Button>

      {/* Timecode Display */}
      <div className="flex-shrink-0 flex items-center gap-2 font-mono text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-base)] px-3 py-1 rounded-md border border-[var(--color-border-base)]">
        <span aria-label="Current time">{formatTime(currentTime)}</span>
        <span className="text-[var(--color-text-muted)]">/</span>
        <span aria-label="Total duration">{formatTime(duration)}</span>
      </div>

      {/* Timeline Track */}
      <div
        ref={timelineRef}
        className="flex-1 h-8 relative cursor-pointer group"
        onMouseDown={handleMouseDown}
        role="slider"
        aria-label="Timeline scrubber"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 1));
          if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 1));
          if (e.key === 'Home') onSeek(0);
          if (e.key === 'End') onSeek(duration);
        }}
      >
        {/* Track Background */}
        <div className="absolute inset-0 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-full" />

        {/* Progress Bar (filled portion) */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-full transition-all"
          style={{ width: `${playheadPosition}%` }}
          aria-hidden="true"
        />

        {/* Dialogue Markers */}
        {dialogueMarkers.map((marker) => (
          <div
            key={marker.id}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-text-muted)] hover:bg-white hover:scale-150 transition-all cursor-pointer"
            style={{ left: `${marker.position}%` }}
            title={marker.dialogue.text?.substring(0, 50) || 'Dialogue'}
            aria-label={`Dialogue at ${formatTime((marker.position / 100) * duration)}`}
          />
        ))}

        {/* Playhead (draggable indicator) */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all z-10",
            isDragging
              ? "bg-[var(--color-primary)] scale-125 shadow-[var(--shadow-game-glow)] cursor-grabbing"
              : "bg-[var(--color-primary)] hover:scale-110 cursor-grab group-hover:shadow-[var(--color-primary-glow)]"
          )}
          style={{ left: `${playheadPosition}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Skip Forward */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSeek(Math.min(duration, currentTime + 5))}
        className="flex-shrink-0 hover:bg-[var(--color-bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        aria-label="Skip forward 5 seconds"
      >
        <SkipForward className="h-4 w-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
      </Button>

      {/* Scene Progress Indicator */}
      <div className="flex-shrink-0 text-xs text-[var(--color-text-muted)]">
        {dialogues.length} dialogue{dialogues.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

TimelinePlayhead.propTypes = {
  currentTime: PropTypes.number,
  duration: PropTypes.number,
  dialogues: PropTypes.array,
  onSeek: PropTypes.func,
  onPlayPause: PropTypes.func,
  isPlaying: PropTypes.bool,
};
