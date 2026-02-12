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
   *  Must be > widest node (cosmos = 360px). 420 gives ≈60px gap for cosmos,
   *  ≈100px gap for the default theme (nodeWidth 320px). */
  NODE_SPACING: 420,
  /** Vertical spacing between row Y origins (px) */
  ROW_HEIGHT: 380,
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
