/**
 * Canvas configuration constants for AccessCity Studio
 *
 * Centralizes all canvas-related dimensions, sizes, and defaults
 * to avoid magic numbers scattered across components.
 *
 * @module config/canvas
 */

// ============================================================================
// TYPES
// ============================================================================

interface CanvasConfig {
  /** Grid snap size in pixels */
  readonly GRID_SIZE: number;
  /** Grid line opacity (0-1) */
  readonly GRID_OPACITY: number;
  /** Minimum zoom level */
  readonly MIN_ZOOM: number;
  /** Maximum zoom level */
  readonly MAX_ZOOM: number;
  /** Default zoom level */
  readonly DEFAULT_ZOOM: number;
}

interface ElementSizes {
  /** Default character sprite dimensions */
  readonly CHARACTER: { readonly width: number; readonly height: number };
  /** Default text box dimensions */
  readonly TEXTBOX: { readonly width: number; readonly height: number };
  /** Default prop dimensions */
  readonly PROP: { readonly width: number; readonly height: number };
}

interface ElementDefaults {
  /** Default center position (percentage) */
  readonly CENTER_POSITION: { readonly x: number; readonly y: number };
  /** Default left position for first character */
  readonly LEFT_POSITION: { readonly x: number; readonly y: number };
  /** Default right position for second character */
  readonly RIGHT_POSITION: { readonly x: number; readonly y: number };
  /** Default scale factor */
  readonly SCALE: number;
  /** Default font size for text boxes */
  readonly FONT_SIZE: number;
  /** Default z-index for new elements */
  readonly Z_INDEX: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Canvas grid and zoom configuration
 */
export const CANVAS_CONFIG: CanvasConfig = {
  GRID_SIZE: 24,
  GRID_OPACITY: 0.3,
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 2,
  DEFAULT_ZOOM: 1,
} as const;

/**
 * Default element sizes in pixels
 */
export const ELEMENT_SIZES: ElementSizes = {
  CHARACTER: { width: 128, height: 128 },
  TEXTBOX: { width: 300, height: 100 },
  PROP: { width: 80, height: 80 },
} as const;

/**
 * Default element positions and properties
 */
export const ELEMENT_DEFAULTS: ElementDefaults = {
  CENTER_POSITION: { x: 50, y: 50 },
  LEFT_POSITION: { x: 20, y: 50 },
  RIGHT_POSITION: { x: 80, y: 50 },
  SCALE: 1.0,
  FONT_SIZE: 16,
  Z_INDEX: 1,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Snap a value to the grid
 *
 * @param value - Value to snap
 * @param gridSize - Grid size (defaults to CANVAS_CONFIG.GRID_SIZE)
 * @returns Snapped value
 */
export function snapToGrid(value: number, gridSize: number = CANVAS_CONFIG.GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a position to the grid
 *
 * @param position - Position object with x and y
 * @param gridSize - Grid size (defaults to CANVAS_CONFIG.GRID_SIZE)
 * @returns Snapped position
 */
export function snapPositionToGrid(
  position: { x: number; y: number },
  gridSize: number = CANVAS_CONFIG.GRID_SIZE
): { x: number; y: number } {
  return {
    x: snapToGrid(position.x, gridSize),
    y: snapToGrid(position.y, gridSize),
  };
}

/**
 * Clamp zoom level within allowed bounds
 *
 * @param zoom - Zoom level to clamp
 * @returns Clamped zoom level
 */
export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, CANVAS_CONFIG.MIN_ZOOM), CANVAS_CONFIG.MAX_ZOOM);
}

/**
 * Get default position for a character based on index
 *
 * @param index - Character index (0 = left, 1 = right, 2+ = center)
 * @returns Default position
 */
export function getDefaultCharacterPosition(index: number): { x: number; y: number } {
  switch (index) {
    case 0:
      return { ...ELEMENT_DEFAULTS.LEFT_POSITION };
    case 1:
      return { ...ELEMENT_DEFAULTS.RIGHT_POSITION };
    default:
      return { ...ELEMENT_DEFAULTS.CENTER_POSITION };
  }
}
