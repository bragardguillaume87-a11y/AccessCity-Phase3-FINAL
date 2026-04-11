import { Grid3x3, BarChart3, Expand, Shrink } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { FullscreenMode } from '@/types';

export interface CanvasFloatingControlsProps {
  gridEnabled: boolean;
  onToggleGrid: (enabled: boolean) => void;
  fullscreenMode: FullscreenMode;
  onFullscreenChange?: (mode: FullscreenMode) => void;
}

/**
 * CanvasFloatingControls - Floating controls for grid toggle, stats HUD and fullscreen
 */
export function CanvasFloatingControls({
  gridEnabled,
  onToggleGrid,
  fullscreenMode,
  onFullscreenChange,
}: CanvasFloatingControlsProps) {
  const enableStatsHUD = useSettingsStore((s) => s.enableStatsHUD);
  const setEnableStatsHUD = useSettingsStore((s) => s.setEnableStatsHUD);

  return (
    <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
      {/* Stats HUD Toggle */}
      <label
        className={`flex items-center gap-2 ${
          enableStatsHUD
            ? 'bg-purple-600/80 border-purple-500'
            : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-base)]'
        } hover:bg-[var(--color-bg-hover)] border-2 px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all`}
      >
        <input
          type="checkbox"
          checked={enableStatsHUD}
          onChange={(e) => setEnableStatsHUD(e.target.checked)}
          className="w-4 h-4 accent-purple-500 cursor-pointer"
          aria-label="Toggle stats HUD"
        />
        <BarChart3
          className={`w-4 h-4 ${enableStatsHUD ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}
          aria-hidden="true"
        />
        <span
          className={`text-sm font-medium ${enableStatsHUD ? 'text-white' : 'text-[var(--color-text-primary)]'}`}
        >
          Stats
        </span>
      </label>

      {/* Grid Toggle */}
      <label className="flex items-center gap-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] border-2 border-[var(--color-border-base)] px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all">
        <input
          type="checkbox"
          checked={gridEnabled}
          onChange={(e) => onToggleGrid(e.target.checked)}
          className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
          aria-label="Toggle grid overlay"
        />
        <Grid3x3 className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Grid</span>
      </label>

      {/* Fullscreen Toggle — style cohérent Figma (icône 4 flèches) */}
      <button
        type="button"
        onClick={() => onFullscreenChange?.(fullscreenMode ? null : 'canvas')}
        title={fullscreenMode ? 'Quitter le plein écran' : 'Canvas plein écran'}
        aria-label={fullscreenMode ? 'Quitter le plein écran' : 'Canvas plein écran'}
        className={`flex items-center gap-2 ${
          fullscreenMode
            ? 'bg-red-500/20 border-red-500/60 text-red-400 hover:bg-red-500/30'
            : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
        } border-2 px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all`}
      >
        {fullscreenMode ? (
          <Shrink className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Expand className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="text-sm font-medium">{fullscreenMode ? 'Quitter' : 'Focus'}</span>
      </button>
    </div>
  );
}
