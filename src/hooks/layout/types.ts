import { Position } from '@xyflow/react';

/**
 * Layout types for the node layout abstraction system.
 *
 * The strategy pattern allows different layout modes (serpentine, grid, radial)
 * to compute node-level positioning without duplicating directional logic
 * across components.
 */

// ─── Layout Result ──────────────────────────────────────────

/** Side of a node element */
export type LayoutSide = 'left' | 'right';

/**
 * NodeLayoutResult - Pre-computed positional values for all node decorations.
 * Components consume these values directly — zero directional logic in components.
 */
export interface NodeLayoutResult {
  /** Flow direction arrow between nodes */
  flowArrow: {
    side: LayoutSide;
    offset: number;
    visible: boolean;
  };
  /** Row transition indicator (⬇️ SUITE) at end of row */
  rowTransition: {
    side: LayoutSide;
    visible: boolean;
  };
  /** Row number badge on first node of each row */
  rowBadge: {
    side: LayoutSide;
    visible: boolean;
    number: number;
  };
  /** Choice handle position (ReactFlow Position enum) */
  choiceHandles: {
    position: Position;
  };
  /** SVG branch lines and Y-indicator for ChoiceNode */
  branchLines: {
    indicatorSide: LayoutSide;
    edgeX: string;
    innerX: string;
  };
  /** START badge visibility */
  startBadge: { visible: boolean };
  /** FIN badge visibility */
  finBadge: { visible: boolean };
  /** Row indicator colored bar */
  rowIndicator: {
    side: LayoutSide;
    color: string;
  };
  /** Decorative stars position (cosmos theme) */
  decorativePosition: 'top-right' | 'top-left';
}

// ─── Strategy Interface ─────────────────────────────────────

/** Constants used for layout calculations */
export interface LayoutConstants {
  /** Horizontal spacing between nodes (px) */
  NODE_SPACING: number;
  /** Vertical spacing between rows (px) */
  ROW_HEIGHT: number;
}

/** Theme sizes needed for layout calculations */
export interface LayoutThemeSizes {
  nodeWidth: number;
  handleSize: number;
}

/** Serpentine row colors from theme */
export interface LayoutThemeColors {
  rowColors?: string[];
}

/**
 * LayoutStrategy - Interface for layout computation strategies.
 * Implement this to add new layout modes (grid, radial, tree).
 */
export interface LayoutStrategy {
  readonly name: string;
  compute(params: LayoutStrategyParams): NodeLayoutResult;
}

/** Parameters passed to strategy compute method */
export interface LayoutStrategyParams {
  serpentine: SerpentineInput | undefined;
  sizes: LayoutThemeSizes;
  colors: LayoutThemeColors;
  constants: LayoutConstants;
}

/** Minimal serpentine input (matches SerpentineNodeData shape) */
export interface SerpentineInput {
  rowIndex: number;
  positionInRow: number;
  rowLength: number;
  flowDirection: 'ltr' | 'rtl';
  isFirst: boolean;
  isLast: boolean;
  isFirstInRow: boolean;
  isLastInRow: boolean;
}

/** Available layout modes */
export type LayoutMode = 'serpentine' | 'default';
