import React from 'react';
import type { NodeLayoutResult } from '@/hooks/useNodeLayout';

/**
 * FlowDirectionIndicator - Visual cues for serpentine flow direction
 *
 * Consumes pre-computed layout from useNodeLayout hook.
 * Zero directional logic — all positions come from the layout strategy.
 *
 * OPTIMIZED for children (8+):
 * - Large, high-contrast indicators (40px+)
 * - Emoji arrows for instant recognition
 * - Pulsing glow animation
 * - White border for visibility on any background
 * - Clear "SUITE" label for row transitions
 */

interface FlowDirectionIndicatorProps {
  layout: NodeLayoutResult;
}

/**
 * RowTransitionIndicator - Shown at the end of a row to indicate flow goes down
 */
function RowTransitionIndicator({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className="row-transition-indicator"
      style={{
        position: 'absolute',
        [side]: '-20px',
        bottom: '-50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '10px 14px',
        borderRadius: '16px',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.95) 100%)',
        border: '3px solid rgba(255, 255, 255, 0.9)',
        boxShadow: `
          0 4px 20px rgba(139, 92, 246, 0.6),
          0 0 30px rgba(139, 92, 246, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3)
        `,
        zIndex: 25,
        animation: 'serpentine-bounce 1.5s ease-in-out infinite',
      }}
      role="img"
      aria-label="La suite est en dessous"
    >
      <span
        style={{
          fontSize: '28px',
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
        aria-hidden="true"
      >
        ⬇️
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        Suite
      </span>
    </div>
  );
}

/**
 * FlowArrowIndicator - Arrow showing flow direction within a row
 */
function FlowArrowIndicator({ side, offset }: { side: 'left' | 'right'; offset: number }) {
  const arrowEmoji = side === 'right' ? '➡️' : '⬅️';

  return (
    <div
      className="flow-arrow-indicator"
      style={{
        position: 'absolute',
        [side]: `${-offset}px`,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.98) 100%)',
        border: '3px solid rgba(255, 255, 255, 0.95)',
        boxShadow: `
          0 4px 16px rgba(34, 197, 94, 0.5),
          0 0 24px rgba(34, 197, 94, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.4)
        `,
        zIndex: 25,
        animation: 'serpentine-pulse 1.2s ease-in-out infinite',
      }}
      role="img"
      aria-label={`Le flux continue vers la ${side === 'right' ? 'droite' : 'gauche'}`}
    >
      <span
        style={{
          fontSize: '22px',
          lineHeight: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
        }}
        aria-hidden="true"
      >
        {arrowEmoji}
      </span>
    </div>
  );
}

/**
 * RowNumberBadge - Shows the current row number
 */
function RowNumberBadge({ side, number }: { side: 'left' | 'right'; number: number }) {
  return (
    <div
      className="row-number-badge"
      style={{
        position: 'absolute',
        [side]: '-12px',
        top: '-12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: (number - 1) % 2 === 0
          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
          : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        border: '2px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        zIndex: 20,
        fontSize: '12px',
        fontWeight: '800',
        color: '#ffffff',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}
      title={`Rangée ${number}`}
      aria-label={`Rangée ${number}`}
    >
      {number}
    </div>
  );
}

/**
 * FlowDirectionIndicator - Main component
 *
 * All positions come from the layout hook — no directional checks here.
 */
export const FlowDirectionIndicator = React.memo(function FlowDirectionIndicator({ layout }: FlowDirectionIndicatorProps) {
  return (
    <>
      {layout.rowBadge.visible && (
        <RowNumberBadge side={layout.rowBadge.side} number={layout.rowBadge.number} />
      )}

      {layout.flowArrow.visible && (
        <FlowArrowIndicator side={layout.flowArrow.side} offset={layout.flowArrow.offset} />
      )}

      {layout.rowTransition.visible && (
        <RowTransitionIndicator side={layout.rowTransition.side} />
      )}
    </>
  );
});

export default FlowDirectionIndicator;
