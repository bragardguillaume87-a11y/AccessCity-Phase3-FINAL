import React from 'react';

/**
 * Decorative Components for Child-Friendly Themes
 * These components add playful visual elements when shapes config is enabled
 */

/** SpeechBubbleTail - SVG tail for bubble-shaped nodes */
export const SpeechBubbleTail = ({ color }: { color: string }) => (
  <svg
    style={{
      position: 'absolute',
      bottom: '-14px',
      left: '20%',
      width: '28px',
      height: '16px',
      overflow: 'visible',
      pointerEvents: 'none',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
    }}
    viewBox="0 0 28 16"
    aria-hidden="true"
  >
    <path
      d="M0 0 C6 0 10 12 14 16 C18 12 22 0 28 0"
      fill={color}
      stroke="none"
    />
  </svg>
);

/** DecorativeStars - Sparkle decoration for playful themes */
export const DecorativeStars = ({ position = 'top-right' }: { position?: 'top-right' | 'top-left' }) => (
  <span
    style={{
      position: 'absolute',
      top: '-10px',
      [position === 'top-right' ? 'right' : 'left']: '-10px',
      fontSize: '20px',
      pointerEvents: 'none',
      filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
      animation: 'cosmos-sparkle 2s ease-in-out infinite',
    }}
    aria-hidden="true"
  >
    ✨
  </span>
);

/** DragIndicator - Visual hint for draggable nodes */
export const DragIndicator = () => (
  <div
    style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      display: 'flex',
      gap: '3px',
      opacity: 0.4,
      pointerEvents: 'none',
    }}
    className="cosmos-drag-indicator"
    aria-hidden="true"
  >
    <span style={{ fontSize: '6px', color: 'white' }}>●</span>
    <span style={{ fontSize: '6px', color: 'white' }}>●</span>
  </div>
);
