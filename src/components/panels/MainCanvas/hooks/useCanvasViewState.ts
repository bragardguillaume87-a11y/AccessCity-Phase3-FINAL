import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores';
import { logger } from '@/utils/logger';

export type ViewMode = 'visual' | 'graph';

/** Discrete zoom steps for the canvas (Powtoon-style) */
const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5] as const;

/**
 * useCanvasViewState - Grid toggle, view mode, playback state, fullscreen escape, canvas zoom.
 */
export function useCanvasViewState() {
  const fullscreenMode = useUIStore(s => s.fullscreenMode);
  const setFullscreenMode = useUIStore(s => s.setFullscreenMode);

  const [gridEnabled, setGridEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [isPlaying, setIsPlaying] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1.0);

  // Escape key exits fullscreen
  useEffect(() => {
    if (!fullscreenMode) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenMode(null);
        logger.debug('[MainCanvas] Exiting fullscreen mode via Escape');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [fullscreenMode, setFullscreenMode]);

  const zoomIn = useCallback(() => {
    setCanvasZoom(prev => {
      const idx = ZOOM_STEPS.findIndex(z => z > prev);
      return idx >= 0 ? ZOOM_STEPS[idx] : ZOOM_STEPS[ZOOM_STEPS.length - 1];
    });
  }, []);

  const zoomOut = useCallback(() => {
    setCanvasZoom(prev => {
      const idx = ZOOM_STEPS.findIndex(z => z >= prev);
      return idx > 0 ? ZOOM_STEPS[idx - 1] : ZOOM_STEPS[0];
    });
  }, []);

  const resetZoom = useCallback(() => {
    setCanvasZoom(1.0);
  }, []);

  return {
    gridEnabled,
    setGridEnabled,
    viewMode,
    setViewMode,
    isPlaying,
    setIsPlaying,
    canvasZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
