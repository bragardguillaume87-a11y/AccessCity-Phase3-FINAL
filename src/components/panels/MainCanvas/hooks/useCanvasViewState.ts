import { useState, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import type { FullscreenMode } from '@/types';

/**
 * View mode type for canvas visualization
 */
export type ViewMode = 'visual' | 'graph';

/**
 * Return type for useCanvasViewState hook
 */
export interface UseCanvasViewStateReturn {
  gridEnabled: boolean;
  setGridEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Props for useCanvasViewState hook
 */
export interface UseCanvasViewStateProps {
  fullscreenMode?: FullscreenMode;
  onFullscreenChange?: (mode: FullscreenMode) => void;
}

/**
 * useCanvasViewState - Manage visual state of the canvas (grid, view mode, playback, fullscreen)
 *
 * This hook centralizes all visual/display states for the MainCanvas component,
 * including grid overlay toggle, view mode switching, playback state, and
 * fullscreen escape handling.
 *
 * @param props - Configuration for fullscreen handling
 * @returns View state values and setters
 *
 * @example
 * ```tsx
 * const { gridEnabled, setGridEnabled, viewMode, setViewMode } = useCanvasViewState({
 *   fullscreenMode,
 *   onFullscreenChange
 * });
 * ```
 */
export function useCanvasViewState({
  fullscreenMode,
  onFullscreenChange
}: UseCanvasViewStateProps = {}): UseCanvasViewStateReturn {
  const [gridEnabled, setGridEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [isPlaying, setIsPlaying] = useState(false);

  // Stabilize onFullscreenChange with useRef to avoid re-creating event listener
  const onFullscreenChangeRef = useRef(onFullscreenChange);
  useEffect(() => {
    onFullscreenChangeRef.current = onFullscreenChange;
  }, [onFullscreenChange]);

  // Escape key handler to exit fullscreen mode
  useEffect(() => {
    if (!fullscreenMode) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Use ref to always get the latest callback
        onFullscreenChangeRef.current?.(null);
        logger.debug('[MainCanvas] Exiting fullscreen mode via Escape');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [fullscreenMode]); // Only re-run when fullscreenMode changes

  return {
    gridEnabled,
    setGridEnabled,
    viewMode,
    setViewMode,
    isPlaying,
    setIsPlaying,
  };
}
