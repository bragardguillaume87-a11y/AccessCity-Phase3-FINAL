/**
 * Centralized color constants for AccessCity Studio
 *
 * Usage:
 * import { COLORS, NODE_COLORS } from '@/config/colors';
 * style={{ backgroundColor: COLORS.ERROR }}
 *
 * These colors match Tailwind's color palette for consistency
 */

// ============================================================================
// SEMANTIC COLORS
// ============================================================================

export const COLORS = {
  // Selection & Focus
  SELECTED: '#06b6d4',        // cyan-500 - selection borders
  FOCUS_RING: '#0ea5e9',      // sky-500 - focus indicators

  // Status Colors
  ERROR: '#dc2626',           // red-600 - error states
  WARNING: '#f59e0b',         // amber-500 - warning states
  SUCCESS: '#22c55e',         // green-500 - success states
  INFO: '#3b82f6',            // blue-500 - info states

  // Text Colors
  TEXT_PRIMARY: '#e2e8f0',    // slate-200 - primary text on dark
  TEXT_SECONDARY: '#94a3b8',  // slate-400 - secondary/muted text
  TEXT_DARK: '#1e293b',       // slate-800 - text on light backgrounds
  TEXT_WHITE: '#ffffff',      // white

  // Background Colors
  BG_DARK: '#0f172a',         // slate-900 - darkest background
  BG_CARD: '#1e293b',         // slate-800 - card backgrounds
  BG_ELEVATED: '#334155',     // slate-700 - elevated surfaces

  // Border Colors
  BORDER_DEFAULT: '#334155',  // slate-700 - default borders
  BORDER_LIGHT: '#475569',    // slate-600 - lighter borders
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  DEFAULT: '0 4px 8px rgba(0, 0, 0, 0.3)',
  SELECTED: '0 8px 16px rgba(0, 0, 0, 0.4)',
  ELEVATED: '0 12px 24px rgba(0, 0, 0, 0.5)',
  CARD: '0 2px 4px rgba(0, 0, 0, 0.2)',
} as const;

// ============================================================================
// DIALOGUE GRAPH NODE COLORS
// ============================================================================

export const NODE_COLORS = {
  // Dialogue Node (default)
  dialogueNode: {
    bg: '#1e293b',            // slate-800
    border: '#334155',        // slate-700
    text: '#e2e8f0',          // slate-200
  },

  // Choice Node (purple theme)
  choiceNode: {
    bg: 'rgba(139, 92, 246, 0.2)',  // violet-500/20
    border: '#8b5cf6',              // violet-500
    text: '#c4b5fd',                // violet-300
  },

  // Terminal Node (end of flow)
  terminalNode: {
    bg: '#1e293b',
    border: '#475569',
    text: '#94a3b8',
  },

  // Error state (overlays normal colors)
  error: {
    bg: 'rgba(220, 38, 38, 0.15)',  // red-600/15
    border: '#dc2626',              // red-600
    text: '#fca5a5',                // red-300
  },

  // Warning state
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)', // amber-500/15
    border: '#f59e0b',              // amber-500
    text: '#fcd34d',                // amber-300
  },
} as const;

// ============================================================================
// HUD COLORS (for progress bars)
// ============================================================================

export const HUD_COLORS = {
  HIGH: 'from-green-500 to-green-600',
  MEDIUM: 'from-yellow-500 to-yellow-600',
  LOW: 'from-red-500 to-red-600',
} as const;

// ============================================================================
// EDGE COLORS (for connections in graph)
// ============================================================================

export const EDGE_COLORS = {
  DEFAULT: '#64748b',         // slate-500
  SUCCESS: '#22c55e',         // green-500
  FAILURE: '#ef4444',         // red-500
  SELECTED: '#06b6d4',        // cyan-500
} as const;
