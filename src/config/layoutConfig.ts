/**
 * Layout constants for the graph editor.
 *
 * Single source of truth for spacing values used by:
 * - useDialogueGraph (serpentine layout calculation)
 * - useNodeLayout (flow arrow offset calculation)
 *
 * SERP-9: Increased spacing for better readability (children 8+)
 */
export const SERPENTINE_LAYOUT = {
  /** Horizontal spacing between node CENTERS in a row (px).
   *  Must be > widest node (cosmos = 360px). 460 gives ≈100px gap for cosmos,
   *  ≈140px gap for the default theme (nodeWidth 320px). */
  NODE_SPACING: 460,
  /** Vertical spacing between row Y origins (px).
   *  520 gives ~300px of clear space between rows for separators + breathing room. */
  ROW_HEIGHT: 520,
  /** Starting X position (px) */
  START_X: 50,
  /** Starting Y position (px) */
  START_Y: 50,
} as const;

/**
 * Dagre auto-layout constants.
 * Used by applyDagreLayout for node positioning.
 */
export const DAGRE_LAYOUT = {
  TB: { nodesep: 100, ranksep: 260 },
  LR: { nodesep: 160, ranksep: 220 },
  marginx: 60,
  marginy: 60,
} as const;

/** Theme ID constant for cosmos-specific rendering */
export const COSMOS_THEME_ID = 'cosmos' as const;

// ============================================================================
// GRAPH VIEW CONFIGURATION
// ============================================================================

/**
 * ReactFlow viewport configuration.
 * Centralized to avoid magic numbers scattered in DialogueGraph.tsx.
 */
export const GRAPH_VIEW = {
  /** Minimum zoom level (10%) */
  MIN_ZOOM: 0.1,
  /** Maximum zoom level (200%) */
  MAX_ZOOM: 2,
  /** Padding ratio applied when fitting all nodes in view (20% margin) */
  FIT_PADDING: 0.2,
  /** Duration of the fitView animation (ms) */
  FIT_DURATION_MS: 300,
  /** Background dot grid gap (px) */
  GRID_GAP: 16,
  /** Delay before calling fitView on initial mount (ms) */
  FIT_INIT_DELAY_MS: 100,
} as const;
