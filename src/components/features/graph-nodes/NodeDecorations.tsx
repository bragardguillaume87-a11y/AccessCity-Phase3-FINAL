
import { COSMOS_COLORS, COSMOS_DIMENSIONS, COSMOS_ANIMATIONS } from '@/config/cosmosConstants';

const tailDim = COSMOS_DIMENSIONS.speechBubbleTail;
const starDim = COSMOS_DIMENSIONS.decorativeStars;
const dragDim = COSMOS_DIMENSIONS.dragIndicator;

/** SpeechBubbleTail - SVG tail for bubble-shaped nodes */
export const SpeechBubbleTail = ({ color }: { color: string }) => (
  <svg
    style={{
      position: 'absolute',
      bottom: `-${tailDim.bottomOffset}px`,
      left: tailDim.leftPercent,
      width: `${tailDim.width}px`,
      height: `${tailDim.height}px`,
      overflow: 'visible',
      pointerEvents: 'none',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
    }}
    viewBox={`0 0 ${tailDim.width} ${tailDim.height}`}
    aria-hidden="true"
  >
    <path
      d={`M0 0 C6 0 10 12 14 ${tailDim.height} C18 12 22 0 ${tailDim.width} 0`}
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
      top: `-${starDim.offset}px`,
      [position === 'top-right' ? 'right' : 'left']: `-${starDim.offset}px`,
      fontSize: `${starDim.fontSize}px`,
      pointerEvents: 'none',
      filter: COSMOS_COLORS.stars.glow,
      animation: COSMOS_ANIMATIONS.sparkle,
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
      top: `${dragDim.top}px`,
      left: `${dragDim.left}px`,
      display: 'flex',
      gap: `${dragDim.gap}px`,
      opacity: dragDim.opacity,
      pointerEvents: 'none',
    }}
    className="cosmos-drag-indicator"
    aria-hidden="true"
  >
    <span style={{ fontSize: `${dragDim.dotSize}px`, color: 'white' }}>●</span>
    <span style={{ fontSize: `${dragDim.dotSize}px`, color: 'white' }}>●</span>
  </div>
);
