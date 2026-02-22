import { useMemo } from 'react';
import { Position } from '@xyflow/react';
import type { GraphTheme } from '@/config/graphThemes/types';
import type { SerpentineNodeData } from '@/types';
import { SERPENTINE_LAYOUT } from '@/config/layoutConfig';
import type {
  NodeLayoutResult,
  LayoutStrategy,
  LayoutStrategyParams,
  LayoutConstants,
  SerpentineInput,
} from './layout/types';

/**
 * useNodeLayout - Centralized layout computation for graph nodes.
 *
 * Eliminates duplicated directional logic (isRTL ? x : y) across components.
 * Returns pre-computed positions for all node decorations.
 *
 * @param serpentine - Serpentine metadata from node.data.serpentine
 * @param theme - Active graph theme (for sizes and colors)
 * @returns Pre-computed layout properties
 *
 * @example
 * ```tsx
 * const layout = useNodeLayout(data.serpentine, theme);
 * <div style={{ [layout.flowArrow.side]: `${-layout.flowArrow.offset}px` }} />
 * ```
 */
export function useNodeLayout(
  serpentine: SerpentineNodeData | undefined,
  theme: GraphTheme
): NodeLayoutResult {
  return useMemo(() => {
    const constants: LayoutConstants = {
      NODE_SPACING: SERPENTINE_LAYOUT.NODE_SPACING,
      ROW_HEIGHT: SERPENTINE_LAYOUT.ROW_HEIGHT,
    };

    const params: LayoutStrategyParams = {
      serpentine: serpentine as SerpentineInput | undefined,
      sizes: {
        nodeWidth: theme.sizes.nodeWidth,
        handleSize: theme.sizes.handleSize,
      },
      colors: {
        rowColors: theme.serpentine?.rowColors,
      },
      constants,
    };

    // Select strategy based on serpentine data availability
    const strategy: LayoutStrategy = serpentine
      ? SERPENTINE_STRATEGY
      : DEFAULT_STRATEGY;

    return strategy.compute(params);
  }, [serpentine, theme.sizes.nodeWidth, theme.sizes.handleSize, theme.serpentine?.rowColors]);
}

// ─── Default Strategy ───────────────────────────────────────

const DEFAULT_ROW_COLOR = 'rgba(59, 130, 246, 0.7)';

const DEFAULT_STRATEGY: LayoutStrategy = {
  name: 'default',
  compute({ sizes, constants }: LayoutStrategyParams): NodeLayoutResult {
    const gap = constants.NODE_SPACING - sizes.nodeWidth;
    return {
      flowArrow: { side: 'right', offset: gap / 2, visible: false },
      rowTransition: { side: 'right', visible: false },
      rowBadge: { side: 'left', visible: false, number: 1 },
      choiceHandles: { position: Position.Right },
      branchLines: { indicatorSide: 'left', edgeX: '95%', innerX: '70%' },
      startBadge: { visible: false },
      finBadge: { visible: false },
      rowIndicator: { side: 'left', color: DEFAULT_ROW_COLOR },
      decorativePosition: 'top-right',
    };
  },
};

// ─── Serpentine Strategy ────────────────────────────────────

const SERPENTINE_STRATEGY: LayoutStrategy = {
  name: 'serpentine',
  compute({ serpentine, sizes, colors, constants }: LayoutStrategyParams): NodeLayoutResult {
    if (!serpentine) {
      return DEFAULT_STRATEGY.compute({ serpentine, sizes, colors, constants });
    }

    const {
      flowDirection,
      isFirst,
      isLast,
      isLastInRow,
      rowIndex,
    } = serpentine;

    const isLTR = flowDirection === 'ltr';

    // Flow direction determines which side elements appear on
    const flowEndSide = isLTR ? 'right' : 'left';
    const flowStartSide = isLTR ? 'left' : 'right';

    // Dynamic gap calculation based on theme node width
    const gap = constants.NODE_SPACING - sizes.nodeWidth;
    const flowArrowOffset = gap / 2;

    // Row color from theme (cycles through available colors)
    const rowColors = colors.rowColors || [];
    const rowColor = rowColors.length > 0
      ? rowColors[rowIndex % rowColors.length]
      : DEFAULT_ROW_COLOR;

    return {
      flowArrow: {
        side: flowEndSide,
        offset: flowArrowOffset,
        // Disabled: edges already show flow direction. Removing inter-node arrows
        // reduces visual noise significantly (was 5 pulsing arrows per row of 6).
        visible: false,
      },
      rowTransition: {
        side: flowEndSide,
        visible: isLastInRow && !isLast,
      },
      rowBadge: {
        side: flowStartSide,
        // Disabled: row separators ("Ligne 2 🚀") now indicate row numbers.
        // Keeping both was redundant.
        visible: false,
        number: rowIndex + 1,
      },
      choiceHandles: {
        position: isLTR ? Position.Right : Position.Left,
      },
      branchLines: {
        indicatorSide: flowStartSide,
        edgeX: isLTR ? '95%' : '5%',
        innerX: isLTR ? '70%' : '30%',
      },
      startBadge: { visible: isFirst },
      finBadge: { visible: isLast },
      rowIndicator: {
        side: flowStartSide,
        color: rowColor,
      },
      decorativePosition: isLTR ? 'top-right' : 'top-left',
    };
  },
};

// Re-export types for convenience
export type { NodeLayoutResult, LayoutStrategy, LayoutMode } from './layout/types';
