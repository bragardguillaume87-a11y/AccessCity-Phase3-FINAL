import React from 'react';
import type { NodeLayoutResult } from '@/hooks/useNodeLayout';

/**
 * SerpentineBadge - Visual indicators for serpentine layout
 *
 * Displays badges to help children (8+) understand the flow:
 * - START badge on the first node of the serpentine flow
 * - FIN badge on the last node of the serpentine flow
 * - Row indicator showing which row the node is in
 *
 * All positions come from useNodeLayout — zero directional logic here.
 *
 * Design choices for children:
 * - Emojis for instant recognition
 * - High contrast colors (WCAG AA compliant)
 * - Simple, rounded shapes
 * - Small, non-intrusive badges
 */

interface SerpentineBadgeProps {
  layout: NodeLayoutResult;
}

/**
 * StartBadge - Large, high-contrast badge on the first node
 * Design: green gradient, white border, glow effect, large emoji
 */
function StartBadge() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '-18px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 16px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        border: '3px solid rgba(255, 255, 255, 0.95)',
        color: '#ffffff',
        boxShadow: `
          0 4px 16px rgba(34, 197, 94, 0.6),
          0 0 30px rgba(34, 197, 94, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3)
        `,
        whiteSpace: 'nowrap' as const,
      }}
      role="status"
      aria-label="Début du dialogue"
    >
      <span style={{ fontSize: '18px', lineHeight: 1 }} aria-hidden="true">🚀</span>
      <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '1px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>START</span>
    </div>
  );
}

/**
 * EndBadge - Large, high-contrast badge on the last node
 * Design: red gradient, white border, glow effect, large emoji
 */
function EndBadge() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '-18px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 16px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        border: '3px solid rgba(255, 255, 255, 0.95)',
        color: '#ffffff',
        boxShadow: `
          0 4px 16px rgba(239, 68, 68, 0.6),
          0 0 30px rgba(239, 68, 68, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3)
        `,
        whiteSpace: 'nowrap' as const,
      }}
      role="status"
      aria-label="Fin du dialogue"
    >
      <span style={{ fontSize: '18px', lineHeight: 1 }} aria-hidden="true">🏁</span>
      <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '1px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>FIN</span>
    </div>
  );
}

/**
 * SerpentineBadge - Main component that renders appropriate badges
 * Visibility comes from layout hook — no directional checks here.
 */
export const SerpentineBadge = React.memo(function SerpentineBadge({ layout }: SerpentineBadgeProps) {
  return (
    <>
      {/* START badge - only on first node of entire flow */}
      {layout.startBadge.visible && <StartBadge />}

      {/* FIN badge - only on last node of entire flow */}
      {layout.finBadge.visible && <EndBadge />}
    </>
  );
});

/**
 * SerpentineRowIndicator - Subtle row color indicator
 * Adds a glowing colored bar to indicate which row the node belongs to.
 * Side and color come from useNodeLayout — no hardcoded positions.
 */
interface SerpentineRowIndicatorProps {
  layout: NodeLayoutResult;
}

export const SerpentineRowIndicator = React.memo(function SerpentineRowIndicator({ layout }: SerpentineRowIndicatorProps) {
  const { side, color } = layout.rowIndicator;

  return (
    <div
      className="serpentine-row-indicator"
      style={{
        position: 'absolute',
        [side]: '-2px',
        top: '15%',
        bottom: '15%',
        width: '4px',
        background: `linear-gradient(180deg, transparent 0%, ${color} 15%, ${color} 85%, transparent 100%)`,
        borderRadius: '4px',
        boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`,
        opacity: 0.9,
        transition: 'all 0.3s ease',
        zIndex: 5,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
});

export default SerpentineBadge;
