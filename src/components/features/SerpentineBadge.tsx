import React from 'react';
import type { NodeLayoutResult } from '@/hooks/useNodeLayout';
import { COSMOS_COLORS, COSMOS_DIMENSIONS, COSMOS_ANIMATIONS } from '@/config/cosmosConstants';

const badgeDim = COSMOS_DIMENSIONS.badge;
const rowDim = COSMOS_DIMENSIONS.rowIndicator;

interface SerpentineBadgeProps {
  layout: NodeLayoutResult;
}

/** Shared badge style for START/FIN */
function badgeStyle(position: 'top' | 'bottom', colors: { gradient: string; border: string; text: string; shadow: string }): React.CSSProperties {
  return {
    position: 'absolute',
    [position]: `-${badgeDim.offset}px`,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: badgeDim.zIndex,
    display: 'flex',
    alignItems: 'center',
    gap: `${badgeDim.gap}px`,
    padding: badgeDim.padding,
    borderRadius: `${badgeDim.borderRadius}px`,
    background: colors.gradient,
    border: `${badgeDim.borderWidth}px solid ${colors.border}`,
    color: colors.text,
    boxShadow: colors.shadow,
    whiteSpace: 'nowrap' as const,
  };
}

const textStyle: React.CSSProperties = {
  fontSize: `${badgeDim.textFontSize}px`,
  fontWeight: badgeDim.fontWeight,
  letterSpacing: badgeDim.letterSpacing,
  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
};

function StartBadge() {
  return (
    <div style={badgeStyle('top', COSMOS_COLORS.startBadge)} role="status" aria-label="Début du dialogue">
      <span style={{ fontSize: `${badgeDim.emojiFontSize}px`, lineHeight: 1 }} aria-hidden="true">🚀</span>
      <span style={textStyle}>START</span>
    </div>
  );
}

function EndBadge() {
  return (
    <div style={badgeStyle('bottom', COSMOS_COLORS.endBadge)} role="status" aria-label="Fin du dialogue">
      <span style={{ fontSize: `${badgeDim.emojiFontSize}px`, lineHeight: 1 }} aria-hidden="true">🏁</span>
      <span style={textStyle}>FIN</span>
    </div>
  );
}

export const SerpentineBadge = React.memo(function SerpentineBadge({ layout }: SerpentineBadgeProps) {
  return (
    <>
      {layout.startBadge.visible && <StartBadge />}
      {layout.finBadge.visible && <EndBadge />}
    </>
  );
});

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
        [side]: `-${rowDim.sideOffset}px`,
        top: `${rowDim.insetPercent}%`,
        bottom: `${rowDim.insetPercent}%`,
        width: `${rowDim.width}px`,
        background: `linear-gradient(180deg, transparent 0%, ${color} 15%, ${color} 85%, transparent 100%)`,
        borderRadius: `${rowDim.borderRadius}px`,
        boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`,
        opacity: rowDim.opacity,
        transition: COSMOS_ANIMATIONS.transitionNormal,
        zIndex: rowDim.zIndex,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
});

export default SerpentineBadge;
