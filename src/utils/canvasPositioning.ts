/**
 * Canvas Positioning Utilities
 *
 * Shared utilities for converting between percentage and pixel coordinates,
 * common position presets for character placement, and resize handle configuration.
 *
 * Usage:
 * import { percentToPixels, pixelsToPercent, POSITION_PRESETS, RESIZING_CONFIG } from '@/utils/canvasPositioning';
 */

// ============================================================================
// TYPES
// ============================================================================

interface Position {
  readonly x: number;
  readonly y: number;
}

interface PositionPresets {
  readonly left: Position;
  readonly center: Position;
  readonly right: Position;
}

interface ResizingConfig {
  readonly top: boolean;
  readonly right: boolean;
  readonly bottom: boolean;
  readonly left: boolean;
  readonly topRight: boolean;
  readonly bottomRight: boolean;
  readonly bottomLeft: boolean;
  readonly topLeft: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Position presets for character placement
 * Values are in percentage (0-100)
 */
export const POSITION_PRESETS: PositionPresets = {
  left: { x: 20, y: 50 },
  center: { x: 50, y: 50 },
  right: { x: 80, y: 50 }
} as const;

/**
 * Resize handles configuration for react-rnd (Rnd component)
 * Enables only right, bottom, and bottom-right corners for proportional scaling
 * Used for characters, props, and text boxes on canvas
 */
export const RESIZING_CONFIG: ResizingConfig = {
  top: false,
  right: true,
  bottom: true,
  left: false,
  topRight: false,
  bottomRight: true,
  bottomLeft: false,
  topLeft: false
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert percentage position to pixels
 *
 * @param percent - Percentage value (0-100)
 * @param dimension - Canvas dimension in pixels (width or height)
 * @returns Pixel value
 *
 * @example
 * const pixelX = percentToPixels(50, 800); // Returns 400
 */
export const percentToPixels = (percent: number, dimension: number): number => {
  return (percent / 100) * dimension;
};

/**
 * Convert pixel position to percentage
 *
 * @param pixels - Pixel value
 * @param dimension - Canvas dimension in pixels (width or height)
 * @returns Percentage value (0-100)
 *
 * @example
 * const percentX = pixelsToPercent(400, 800); // Returns 50
 */
export const pixelsToPercent = (pixels: number, dimension: number): number => {
  return (pixels / dimension) * 100;
};
