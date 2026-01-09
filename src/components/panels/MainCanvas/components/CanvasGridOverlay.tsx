import React from 'react';
import { Z_INDEX } from '@/utils/zIndexLayers.js';

export interface CanvasGridOverlayProps {
  enabled: boolean;
}

/**
 * CanvasGridOverlay - SVG grid overlay for canvas
 */
export function CanvasGridOverlay({ enabled }: CanvasGridOverlayProps) {
  if (!enabled) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: Z_INDEX.CANVAS_GRID }}
    >
      <defs>
        <pattern
          id="grid"
          width={24}
          height={24}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="var(--color-border-base)"
            strokeWidth="1"
            opacity="0.3"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}
