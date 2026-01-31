/**
 * Shared constants
 *
 * @module utils/constants
 */

/**
 * Sentinel value for Radix Select components that don't accept empty strings.
 * Radix UI Select crashes when a SelectItem has value="", so we use this
 * placeholder to represent "no selection".
 */
export const SELECT_NONE_VALUE = '__none__';
