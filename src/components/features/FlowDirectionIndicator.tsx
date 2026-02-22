import React from 'react';
import type { NodeLayoutResult } from '@/hooks/useNodeLayout';
import { COSMOS_COLORS, COSMOS_DIMENSIONS, COSMOS_ANIMATIONS } from '@/config/cosmosConstants';

const transDim = COSMOS_DIMENSIONS.rowTransition;
const arrowDim = COSMOS_DIMENSIONS.flowArrow;
const badgeDim = COSMOS_DIMENSIONS.rowBadge;
const transColors = COSMOS_COLORS.rowTransition;
const arrowColors = COSMOS_COLORS.flowArrow;
const badgeColors = COSMOS_COLORS.rowBadge;

interface FlowDirectionIndicatorProps {
  layout: NodeLayoutResult;
}

function RowTransitionIndicator({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className="row-transition-indicator"
      style={{
        position: 'absolute',
        [side]: `-${transDim.sideOffset}px`,
        bottom: `-${transDim.bottomOffset}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: `${transDim.gap}px`,
        padding: transDim.padding,
        borderRadius: `${transDim.borderRadius}px`,
        background: transColors.gradient,
        border: `${transDim.borderWidth}px solid ${transColors.border}`,
        boxShadow: transColors.shadow,
        zIndex: transDim.zIndex,
        animation: COSMOS_ANIMATIONS.bounce,
      }}
      role="img"
      aria-label="La suite est en dessous"
    >
      <span
        style={{
          fontSize: `${transDim.emojiFontSize}px`,
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
        aria-hidden="true"
      >
        ⬇️
      </span>
      <span
        style={{
          fontSize: `${transDim.labelFontSize}px`,
          fontWeight: `${transDim.labelFontWeight}`,
          color: transColors.text,
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
        width: `${arrowDim.size}px`,
        height: `${arrowDim.size}px`,
        borderRadius: '50%',
        background: arrowColors.gradient,
        border: `${arrowDim.borderWidth}px solid ${arrowColors.border}`,
        boxShadow: arrowColors.shadow,
        zIndex: arrowDim.zIndex,
        animation: COSMOS_ANIMATIONS.pulse,
      }}
      role="img"
      aria-label={`Le flux continue vers la ${side === 'right' ? 'droite' : 'gauche'}`}
    >
      <span
        style={{
          fontSize: `${arrowDim.emojiFontSize}px`,
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

function RowNumberBadge({ side, number }: { side: 'left' | 'right'; number: number }) {
  return (
    <div
      className="row-number-badge"
      style={{
        position: 'absolute',
        [side]: `-${badgeDim.offset}px`,
        top: `-${badgeDim.offset}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${badgeDim.size}px`,
        height: `${badgeDim.size}px`,
        borderRadius: '50%',
        background: (number - 1) % 2 === 0 ? badgeColors.oddGradient : badgeColors.evenGradient,
        border: `${badgeDim.borderWidth}px solid ${badgeColors.border}`,
        boxShadow: badgeColors.shadow,
        zIndex: badgeDim.zIndex,
        fontSize: `${badgeDim.fontSize}px`,
        fontWeight: `${badgeDim.fontWeight}`,
        color: badgeColors.text,
        textShadow: badgeColors.textShadow,
      }}
      title={`Rangée ${number}`}
      aria-label={`Rangée ${number}`}
    >
      {number}
    </div>
  );
}

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
