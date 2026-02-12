/**
 * Cosmos Theme - Space/Galaxy theme for children (8+ years)
 *
 * Features:
 * - Animated starfield background
 * - Planet-like nodes with colorful gradients
 * - Glowing light trail edges
 * - Larger sizes for easier interaction
 * - Confetti effects on actions
 */
import type { GraphTheme } from '../types';

// Cosmos color palette
export const COSMOS_COLORS = {
  // Space background
  SPACE_DARK: '#0a0a1a',
  SPACE_NEBULA_PURPLE: '#1a0a2e',
  SPACE_NEBULA_BLUE: '#0a1a3e',

  // Stars and particles
  STAR_WHITE: '#ffffff',
  STAR_YELLOW: '#fef08a',
  STAR_BLUE: '#93c5fd',
  STAR_PINK: '#f9a8d4',

  // Planet colors (nodes)
  PLANET_BLUE: '#3b82f6',
  PLANET_PURPLE: '#a855f7',
  PLANET_PINK: '#ec4899',
  PLANET_CYAN: '#06b6d4',
  PLANET_AMBER: '#f59e0b',
  PLANET_EMERALD: '#10b981',

  // Glow effects
  GLOW_PURPLE: 'rgba(168, 85, 247, 0.6)',
  GLOW_PINK: 'rgba(236, 72, 153, 0.6)',
  GLOW_CYAN: 'rgba(6, 182, 212, 0.6)',
  GLOW_BLUE: 'rgba(59, 130, 246, 0.6)',

  // PHASE 7: Perplexity cosmic palette
  PERPLEXITY_PURPLE: '#9D4EDD',
  PERPLEXITY_BLUE: '#3A86FF',
  PERPLEXITY_PINK: '#FF006E',
  PERPLEXITY_CYAN: '#06FFF0',
  PERPLEXITY_YELLOW: '#FFD60A',
};

// PHASE 7: Cosmos gradients - radial for 3D planet effect (light source top-left)
export const COSMOS_GRADIENTS = {
  PLANET_DIALOGUE: 'radial-gradient(ellipse at 30% 20%, #60a5fa 0%, #3b82f6 40%, #1d4ed8 100%)',
  PLANET_CHOICE: 'radial-gradient(ellipse at 30% 20%, #c084fc 0%, #a855f7 40%, #7c3aed 100%)',
  PLANET_TERMINAL: 'radial-gradient(ellipse at 30% 20%, #fbbf24 0%, #f59e0b 40%, #d97706 100%)',
  PLANET_RESPONSE: 'radial-gradient(ellipse at 30% 20%, #34d399 0%, #10b981 40%, #059669 100%)',
};

// Cosmos shadows with glow
export const COSMOS_SHADOWS = {
  DEFAULT: `0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(168, 85, 247, 0.25)`,
  HOVER: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 20px ${COSMOS_COLORS.GLOW_PINK}, 0 0 30px ${COSMOS_COLORS.GLOW_CYAN}`,
  SELECTED: `0 0 0 4px ${COSMOS_COLORS.STAR_YELLOW}, 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 30px ${COSMOS_COLORS.GLOW_CYAN}`,
};

export const cosmosTheme: GraphTheme = {
  id: 'cosmos',
  name: 'Cosmos',
  description: 'Thème spatial pour enfants',

  background: {
    type: 'animated',
    value: COSMOS_COLORS.SPACE_DARK,
    // Component will be set dynamically to avoid circular imports
    component: undefined,
  },

  nodes: {
    dialogue: {
      bg: COSMOS_COLORS.SPACE_NEBULA_PURPLE,
      bgGradient: COSMOS_GRADIENTS.PLANET_DIALOGUE,
      border: COSMOS_COLORS.PLANET_BLUE,
      text: '#bfdbfe',
      shadow: COSMOS_SHADOWS.DEFAULT,
      shadowHover: COSMOS_SHADOWS.HOVER,
      shadowSelected: COSMOS_SHADOWS.SELECTED,
    },
    choice: {
      bg: COSMOS_COLORS.SPACE_NEBULA_PURPLE,
      bgGradient: COSMOS_GRADIENTS.PLANET_CHOICE,
      border: COSMOS_COLORS.PLANET_PURPLE,
      text: '#e9d5ff',
      shadow: COSMOS_SHADOWS.DEFAULT,
      shadowHover: COSMOS_SHADOWS.HOVER,
      shadowSelected: COSMOS_SHADOWS.SELECTED,
    },
    terminal: {
      bg: COSMOS_COLORS.SPACE_NEBULA_BLUE,
      bgGradient: COSMOS_GRADIENTS.PLANET_TERMINAL,
      border: COSMOS_COLORS.PLANET_AMBER,
      text: '#fef3c7',
      shadow: COSMOS_SHADOWS.DEFAULT,
      shadowHover: COSMOS_SHADOWS.HOVER,
      shadowSelected: COSMOS_SHADOWS.SELECTED,
    },
    response: {
      bg: COSMOS_COLORS.SPACE_NEBULA_BLUE,
      bgGradient: COSMOS_GRADIENTS.PLANET_RESPONSE,
      border: COSMOS_COLORS.PLANET_EMERALD,
      text: '#d1fae5',
      shadow: COSMOS_SHADOWS.DEFAULT,
      shadowHover: COSMOS_SHADOWS.HOVER,
      shadowSelected: COSMOS_SHADOWS.SELECTED,
    },
  },

  // PHASE 8: Enhanced edges with SVG gradients and stronger glows
  edges: {
    linear: {
      stroke: 'url(#cosmos-linear-gradient)', // SVG gradient Slate → Cyan
      strokeWidth: 3,
      filter: 'drop-shadow(0 0 6px rgba(100, 116, 139, 0.8)) drop-shadow(0 0 12px rgba(6, 255, 240, 0.3))',
      animated: true, // Changed to true for subtle flow
    },
    choice: {
      stroke: 'url(#cosmos-choice-gradient)', // SVG gradient Purple → Pink
      strokeWidth: 5, // Thicker for children
      filter: 'drop-shadow(0 0 10px rgba(157, 78, 221, 0.9)) drop-shadow(0 0 20px rgba(157, 78, 221, 0.5))',
      animated: true,
    },
    convergence: {
      stroke: 'url(#cosmos-convergence-gradient)', // SVG gradient Green → Cyan
      strokeWidth: 4,
      strokeDasharray: '10,5', // Wider dashes for visibility
      filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 16px rgba(6, 255, 240, 0.4))',
      animated: true, // Changed to true for flow effect
    },
    sceneJump: {
      stroke: 'url(#cosmos-scene-gradient)', // SVG gradient Yellow → Cyan
      strokeWidth: 5,
      strokeDasharray: '12,6', // Wider dashes
      filter: 'drop-shadow(0 0 12px rgba(255, 214, 10, 0.9)) drop-shadow(0 0 24px rgba(255, 0, 110, 0.5))',
      animated: true,
    },
  },

  // Larger sizes for children (easier to click)
  // PHASE 6: Enhanced for playful bubble shapes
  sizes: {
    nodeWidth: 360,          // Slightly wider for bubble shape
    nodeMinHeight: 140,      // Shorter for squatter bubbles
    nodeBorderRadius: 50,    // Very rounded = bubble/pill shape
    handleSize: 32,          // Much bigger handles for children (2cm target)
    fontSizeSpeaker: 18,     // Larger text for readability
    fontSizeText: 16,
  },

  animations: {
    nodeHover: 'cosmos-node-hover',
    nodeSelected: 'cosmos-node-selected',
    nodeAppear: 'cosmos-node-appear',
    edgeAnimated: 'cosmos-edge-animated',
  },

  effects: {
    // Effects will be set dynamically via useCosmosEffects hook
  },

  // Playful emojis for children
  icons: {
    dialogue: '🪐',    // Planet for dialogue
    choice: '🚀',      // Rocket for choices (branching paths)
    terminal: '⭐',    // Star for scene jumps
    response: '💬',    // Speech bubble for responses
    useEmoji: true,
  },

  // PHASE 6: Child-friendly bubble shapes
  shapes: {
    nodeShape: 'bubble',
    speechBubbleTail: true,      // Add speech bubble tail to nodes
    decorativeElements: true,    // Add stars/sparkles
    edgeType: 'straight',        // Direct diagonal lines (like Articy:draft)
  },

  // PHASE 6: Enhanced touch/drag for children
  interactions: {
    minTouchTarget: 48,          // WCAG AAA for children
    showDragIndicators: true,    // Show emoji on handles
  },

  // SERP-8: Serpentine layout colors
  serpentine: {
    // Alternating row colors (cosmic nebula tints)
    rowColors: [
      'rgba(59, 130, 246, 0.08)',   // Row 0: Blue nebula
      'rgba(139, 92, 246, 0.08)',   // Row 1: Purple nebula
      'rgba(6, 182, 212, 0.08)',    // Row 2: Cyan nebula
      'rgba(16, 185, 129, 0.08)',   // Row 3: Emerald nebula
    ],
    rowOpacity: 0.08,
    startBadgeColor: '#22c55e',     // Green for START
    endBadgeColor: '#ef4444',       // Red for FIN
    flowArrowColor: '#60a5fa',      // Blue for flow arrows
    rowTransitionColor: '#8b5cf6',  // Purple for row transitions
  },
};
