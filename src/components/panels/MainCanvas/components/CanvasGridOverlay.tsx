
import { Z_INDEX } from '@/utils/zIndexLayers';
import { CANVAS_CONFIG } from '@/config/canvas';

export interface CanvasGridOverlayProps {
  enabled: boolean;
}

/**
 * CanvasGridOverlay - SVG grid overlay for canvas
 */
export function CanvasGridOverlay({ enabled }: CanvasGridOverlayProps) {
  if (!enabled) return null;

  const g = CANVAS_CONFIG.GRID_SIZE;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: Z_INDEX.CANVAS_GRID }}
    >
      <defs>
        <pattern
          id="grid"
          width={g}
          height={g}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${g} 0 L 0 0 0 ${g}`}
            fill="none"
            stroke="var(--color-border-base)"
            strokeWidth="1"
            opacity={CANVAS_CONFIG.GRID_OPACITY}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}
