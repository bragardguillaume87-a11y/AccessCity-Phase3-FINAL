import React from 'react';
import { Grid3x3 } from 'lucide-react';

export interface CanvasFloatingControlsProps {
  gridEnabled: boolean;
  onToggleGrid: (enabled: boolean) => void;
}

/**
 * CanvasFloatingControls - Floating controls for grid toggle
 */
export function CanvasFloatingControls({ gridEnabled, onToggleGrid }: CanvasFloatingControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
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
