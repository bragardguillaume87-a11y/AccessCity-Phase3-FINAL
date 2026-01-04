/**
 * Canvas Positioning Utilities
 *
 * Shared utilities for converting between percentage and pixel coordinates,
 * common position presets for character placement, and resize handle configuration.
 *
 * Usage:
 * import { percentToPixels, pixelsToPercent, POSITION_PRESETS, RESIZING_CONFIG } from '@/utils/canvasPositioning';
 */

/**
 * Position presets for character placement
 * Values are in percentage (0-100)
 */
export const POSITION_PRESETS = {
  left: { x: 20, y: 50 },
  center: { x: 50, y: 50 },
  right: { x: 80, y: 50 }
};

/**
 * Resize handles configuration for react-rnd (Rnd component)
 * Enables only right, bottom, and bottom-right corners for proportional scaling
 * Used for characters, props, and text boxes on canvas
 */
export const RESIZING_CONFIG = {
  top: false,
  right: true,
  bottom: true,
  left: false,
  topRight: false,
  bottomRight: true,
  bottomLeft: false,
  topLeft: false
};

/**
 * Convert percentage position to pixels
 *
 * @param {number} percent - Percentage value (0-100)
 * @param {number} dimension - Canvas dimension in pixels (width or height)
 * @returns {number} Pixel value
 *
 * @example
 * const pixelX = percentToPixels(50, 800); // Returns 400
 */
export const percentToPixels = (percent, dimension) => {
  return (percent / 100) * dimension;
};

/**
 * Convert pixel position to percentage
 *
 * @param {number} pixels - Pixel value
 * @param {number} dimension - Canvas dimension in pixels (width or height)
 * @returns {number} Percentage value (0-100)
 *
 * @example
 * const percentX = pixelsToPercent(400, 800); // Returns 50
 */
export const pixelsToPercent = (pixels, dimension) => {
  return (pixels / dimension) * 100;
};
