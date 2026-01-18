/**
 * Validation utilities for AccessCity Studio
 *
 * Provides type-safe validation for:
 * - JSON parsing with validation
 * - URL security validation
 * - Drag-drop data validation
 * - Generic type guards
 *
 * @module utils/validation
 */

import { logger } from './logger';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a valid number (not NaN)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Dangerous URL protocols that could execute code
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
  'blob:',
] as const;

/**
 * Allowed URL protocols for assets
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', ''] as const;

/**
 * Validate if a URL is safe for use as an asset URL
 * Blocks javascript:, data:, and other dangerous protocols
 *
 * @param url - URL string to validate
 * @returns true if URL is safe, false otherwise
 *
 * @example
 * isValidAssetUrl('https://example.com/image.png') // true
 * isValidAssetUrl('javascript:alert(1)') // false
 * isValidAssetUrl('/assets/bg.jpg') // true (relative URL)
 */
export function isValidAssetUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) {
      logger.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return false;
    }
  }

  // Validate URL structure
  try {
    const parsed = new URL(url, window.location.origin);
    return (ALLOWED_PROTOCOLS as readonly string[]).includes(parsed.protocol);
  } catch {
    // If URL parsing fails, check if it's a valid relative path
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

/**
 * Sanitize a URL, returning empty string if invalid
 *
 * @param url - URL to sanitize
 * @returns Original URL if valid, empty string otherwise
 */
export function sanitizeUrl(url: string): string {
  return isValidAssetUrl(url) ? url : '';
}

// ============================================================================
// DRAG-DROP VALIDATION
// ============================================================================

/**
 * Valid drag-drop data types
 */
export type DragDropType = 'background' | 'character' | 'prop' | 'emoji' | 'textbox';

/**
 * Validated drag-drop data structure
 */
export interface DragDropData {
  type: DragDropType;
  url?: string;
  characterId?: string;
  emoji?: string;
  assetPath?: string;
}

/**
 * Valid drag-drop types
 */
const VALID_DRAG_TYPES: DragDropType[] = ['background', 'character', 'prop', 'emoji', 'textbox'];

/**
 * Validate and parse drag-drop data from dataTransfer
 *
 * @param raw - Raw parsed JSON data
 * @returns Validated DragDropData or null if invalid
 *
 * @example
 * const data = validateDragDropData(JSON.parse(e.dataTransfer.getData('application/json')));
 * if (data) {
 *   // Safe to use data.type, data.url, etc.
 * }
 */
export function validateDragDropData(raw: unknown): DragDropData | null {
  if (!isObject(raw)) {
    logger.warn('Invalid drag-drop data: not an object');
    return null;
  }

  // Validate type
  if (!VALID_DRAG_TYPES.includes(raw.type as DragDropType)) {
    logger.warn(`Invalid drag-drop type: ${raw.type}`);
    return null;
  }

  const result: DragDropData = {
    type: raw.type as DragDropType,
  };

  // Validate optional string fields
  if (typeof raw.url === 'string') {
    result.url = sanitizeUrl(raw.url);
  }
  if (typeof raw.characterId === 'string') {
    result.characterId = raw.characterId;
  }
  if (typeof raw.emoji === 'string') {
    result.emoji = raw.emoji;
  }
  if (typeof raw.assetPath === 'string') {
    result.assetPath = sanitizeUrl(raw.assetPath);
  }

  return result;
}

// ============================================================================
// SAFE JSON PARSING
// ============================================================================

/**
 * Safely parse JSON with validation
 *
 * @param json - JSON string to parse
 * @param validator - Validation function that returns validated data or null
 * @returns Validated data or null if parsing/validation fails
 *
 * @example
 * const data = safeJsonParse(jsonString, validateDragDropData);
 * if (data) {
 *   // data is typed and validated
 * }
 */
export function safeJsonParse<T>(
  json: string,
  validator: (raw: unknown) => T | null
): T | null {
  try {
    const raw = JSON.parse(json);
    return validator(raw);
  } catch (error) {
    logger.warn('Failed to parse JSON:', error);
    return null;
  }
}

/**
 * Safely get and parse JSON from localStorage
 *
 * @param key - localStorage key
 * @param validator - Validation function
 * @param fallback - Fallback value if parsing fails
 * @returns Validated data or fallback
 */
export function safeGetFromStorage<T>(
  key: string,
  validator: (raw: unknown) => T | null,
  fallback: T
): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;

    const parsed = JSON.parse(stored);
    const validated = validator(parsed);
    return validated ?? fallback;
  } catch (error) {
    logger.warn(`Failed to load from localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely set JSON to localStorage
 *
 * @param key - localStorage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function safeSetToStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.warn(`Failed to save to localStorage key "${key}":`, error);
    return false;
  }
}

// ============================================================================
// ARRAY VALIDATORS
// ============================================================================

/**
 * Validate that a value is an array of strings
 */
export function validateStringArray(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  if (!raw.every(item => typeof item === 'string')) return null;
  return raw as string[];
}

/**
 * Validate that a value is an array of valid items using a validator
 */
export function validateArray<T>(
  raw: unknown,
  itemValidator: (item: unknown) => T | null
): T[] | null {
  if (!Array.isArray(raw)) return null;

  const validated: T[] = [];
  for (const item of raw) {
    const validItem = itemValidator(item);
    if (validItem === null) return null;
    validated.push(validItem);
  }

  return validated;
}
