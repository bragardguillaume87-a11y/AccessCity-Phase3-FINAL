/**
 * Panel layout configuration for AccessCity Editor
 *
 * Centralizes all panel dimension constants for the 4-panel editor layout:
 *   [Left: Explorer] | [Canvas] | [Content Panel 3] | [Icon Bar Panel 4]
 *
 * Panel 1 (Left) and Panel 2 (Canvas) are react-resizable-panels.
 * Panel 3 (Content) and Panel 4 (Icon bar) are CSS-width-driven divs.
 *
 * @module config/panelConfig
 */

// ============================================================================
// TYPES
// ============================================================================

interface PanelWidths {
  /** Left explorer panel width in Scènes tab (compact) */
  readonly LEFT_DEFAULT: number;
  /** Left explorer panel width in Dialogues tab (wider) */
  readonly LEFT_DIALOGUES: number;
  /** Content panel width when showing section content (Fond, Texte, Persos…) */
  readonly CONTENT_SECTION: number;
  /** Content panel width when showing element properties */
  readonly CONTENT_PROPERTIES: number;
  /** Icon bar (UnifiedPanel) fixed width — always visible */
  readonly ICON_BAR: number;
}

interface PanelMinWidths {
  /** Minimum width for the left explorer panel */
  readonly LEFT: number;
  /** Minimum width for the canvas panel */
  readonly CANVAS: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Panel widths in pixels for the 4-panel editor layout.
 *
 * Panel 3 transitions between CONTENT_SECTION, CONTENT_PROPERTIES, and 0 (closed).
 * Panel 4 is always ICON_BAR wide.
 */
export const PANEL_WIDTHS: PanelWidths = {
  LEFT_DEFAULT: 240,     // onglet Scènes — compact
  LEFT_DIALOGUES: 320,   // onglet Dialogues — plus confortable pour les cartes
  CONTENT_SECTION: 420,  // section active (Dialogue, Texte, Fond…) — 420px pour EffectRow sans débordement
  CONTENT_PROPERTIES: 320,
  ICON_BAR: 72,
} as const;

/**
 * Minimum panel widths for resizable panels (react-resizable-panels).
 */
export const PANEL_MIN_WIDTHS: PanelMinWidths = {
  LEFT: 200,   // réduit de 260 → 200 pour permettre panel étroit
  CANVAS: 300,
} as const;
