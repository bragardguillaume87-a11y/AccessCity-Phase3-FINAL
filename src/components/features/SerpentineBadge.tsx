import type { SerpentineNodeData } from '@/types';

/**
 * SerpentineBadge - Visual indicators for serpentine layout
 *
 * Displays badges to help children (8+) understand the flow:
 * - START badge on the first node of the serpentine flow
 * - FIN badge on the last node of the serpentine flow
 * - Row indicator showing which row the node is in
 *
 * Design choices for children:
 * - Emojis for instant recognition
 * - High contrast colors (WCAG AA compliant)
 * - Simple, rounded shapes
 * - Small, non-intrusive badges
 */

interface SerpentineBadgeProps {
  serpentine: SerpentineNodeData;
  /** Show row number badge (optional, for debugging or advanced view) */
  showRowNumber?: boolean;
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
 */
export function SerpentineBadge({ serpentine }: SerpentineBadgeProps) {
  const { isFirst, isLast } = serpentine;

  return (
    <>
      {/* START badge - only on first node of entire flow */}
      {isFirst && <StartBadge />}

      {/* FIN badge - only on last node of entire flow */}
      {isLast && <EndBadge />}
    </>
  );
}

/**
 * SerpentineRowIndicator - Subtle row color indicator
 * Adds a glowing colored bar on the left side of the node to indicate which row it belongs to
 * The color alternates based on the row index for easy visual grouping
 */
interface SerpentineRowIndicatorProps {
  rowIndex: number;
  /** Optional custom colors from theme (uses defaults if not provided) */
  rowColors?: string[];
}

// Default row colors (cosmic theme - used if theme doesn't provide custom ones)
const DEFAULT_ROW_COLORS = [
  'rgba(59, 130, 246, 0.7)',   // Row 0: Blue nebula
  'rgba(139, 92, 246, 0.7)',   // Row 1: Purple nebula
  'rgba(6, 182, 212, 0.7)',    // Row 2: Cyan nebula
  'rgba(16, 185, 129, 0.7)',   // Row 3: Emerald nebula
];

export function SerpentineRowIndicator({ rowIndex, rowColors = DEFAULT_ROW_COLORS }: SerpentineRowIndicatorProps) {
  const color = rowColors[rowIndex % rowColors.length];

  return (
    <div
      className="serpentine-row-indicator"
      style={{
        position: 'absolute',
        left: '-2px',
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
      title={`Rangée ${rowIndex + 1}`}
    />
  );
}

export default SerpentineBadge;
