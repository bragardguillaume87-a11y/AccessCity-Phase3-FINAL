
import { Grid3x3, BarChart3 } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

export interface CanvasFloatingControlsProps {
  gridEnabled: boolean;
  onToggleGrid: (enabled: boolean) => void;
}

/**
 * CanvasFloatingControls - Floating controls for grid toggle and stats HUD
 */
export function CanvasFloatingControls({ gridEnabled, onToggleGrid }: CanvasFloatingControlsProps) {
  const enableStatsHUD = useSettingsStore(s => s.enableStatsHUD);
  const setEnableStatsHUD = useSettingsStore(s => s.setEnableStatsHUD);

  return (
    <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
      {/* Stats HUD Toggle */}
      <label className={`flex items-center gap-2 ${
        enableStatsHUD
          ? 'bg-purple-600/80 border-purple-500'
          : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-base)]'
      } hover:bg-[var(--color-bg-hover)] border-2 px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all`}>
        <input
          type="checkbox"
          checked={enableStatsHUD}
          onChange={(e) => setEnableStatsHUD(e.target.checked)}
          className="w-4 h-4 accent-purple-500 cursor-pointer"
          aria-label="Toggle stats HUD"
        />
        <BarChart3 className={`w-4 h-4 ${enableStatsHUD ? 'text-white' : 'text-[var(--color-text-secondary)]'}`} aria-hidden="true" />
        <span className={`text-sm font-medium ${enableStatsHUD ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>Stats</span>
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
    </div>
  );
}
