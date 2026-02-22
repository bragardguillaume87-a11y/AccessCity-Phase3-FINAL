import React from 'react';
import { COSMOS_COLORS, COSMOS_DIMENSIONS } from '@/config/cosmosConstants';

/** Rotating emojis for each row — fun for kids 8+ */
const ROW_EMOJIS = ['🚀', '⭐', '🪐', '☄️', '🌙', '🛸', '💫', '🌟'] as const;

export interface RowSeparatorNodeData extends Record<string, unknown> {
  /** Which row this separator appears AFTER (0 = after row 1, before row 2) */
  afterRowIndex: number;
  /** Width in pixels (spans the full row width) */
  separatorWidth: number;
}

interface RowSeparatorNodeProps {
  data: RowSeparatorNodeData;
}

/**
 * RowSeparatorNode — Decorative divider between serpentine rows.
 *
 * Non-interactive (draggable: false, selectable: false, focusable: false).
 * Displays a horizontal line with a centered badge "Ligne N 🚀".
 */
export const RowSeparatorNode = React.memo(function RowSeparatorNode({
  data,
}: RowSeparatorNodeProps): React.JSX.Element {
  const { afterRowIndex, separatorWidth } = data;
  const rowNumber = afterRowIndex + 2; // "Ligne 2" appears after row index 0
  const isOdd = afterRowIndex % 2 === 0;

  const colors = COSMOS_COLORS.rowSeparator;
  const dims = COSMOS_DIMENSIONS.rowSeparator;

  const emoji = ROW_EMOJIS[afterRowIndex % ROW_EMOJIS.length];
  const lineColor = isOdd ? colors.lineOdd : colors.lineEven;
  const badgeGradient = isOdd ? colors.badgeGradientOdd : colors.badgeGradientEven;
  const bg = isOdd ? colors.bgOdd : colors.bgEven;

  return (
    <div
      style={{
        width: separatorWidth,
        height: dims.height,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        borderRadius: 8,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {/* Horizontal line */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: dims.lineThickness,
          background: lineColor,
          transform: 'translateY(-50%)',
        }}
      />

      {/* Center badge */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: dims.badgeGap,
          padding: dims.badgePadding,
          borderRadius: dims.badgeBorderRadius,
          border: `${dims.badgeBorderWidth}px solid ${colors.badgeBorder}`,
          background: badgeGradient,
          color: colors.badgeText,
          fontSize: dims.badgeFontSize,
          fontWeight: dims.badgeFontWeight,
          boxShadow: colors.badgeShadow,
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: dims.emojiFontSize, lineHeight: 1 }}>{emoji}</span>
        Ligne {rowNumber}
      </div>
    </div>
  );
});
