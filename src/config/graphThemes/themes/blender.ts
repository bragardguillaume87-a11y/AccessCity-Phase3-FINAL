/**
 * Blender Theme - Inspired by Blender's node editor
 *
 * Features:
 * - Colored header strip per node type (à la Blender)
 * - Dark gray node bodies for maximum readability
 * - Cosmos animated starfield background (kept)
 * - Hybrid edges: Bézier + color + subtle glow, no animation
 * - Compact 320px nodes, 6px border radius
 */
import type { GraphTheme } from '../types';

// Blender-inspired color palette
const BLENDER = {
  // Node body
  BODY:        '#252e34',
  BODY_BORDER: '#3a4a54',

  // Header colors (one per node type)
  HEADER_DIALOGUE: '#4a7fb5',  // Blue steel
  HEADER_CHOICE:   '#7b5ea7',  // Violet
  HEADER_TERMINAL: '#c77a3a',  // Orange
  HEADER_RESPONSE: '#4a8c5c',  // Green

  // Text
  TEXT_MAIN:   '#e8e8e8',
  TEXT_MUTED:  '#b0bcc6',

  // Background (reuse Cosmos space)
  SPACE_DARK:  '#0a0a1a',

  // Shadows
  SHADOW:          '0 2px 8px rgba(0,0,0,0.5)',
  SHADOW_HOVER:    '0 4px 16px rgba(0,0,0,0.6), 0 0 8px rgba(74,127,181,0.2)',
  SHADOW_SELECTED: '0 0 0 2px #4a7fb5, 0 4px 16px rgba(0,0,0,0.6)',
};

// Edge glow per type (subtle, not Cosmos-level)
const EDGE_GLOW = {
  LINEAR:      'drop-shadow(0 0 3px rgba(90,122,154,0.6))',
  CHOICE:      'drop-shadow(0 0 4px rgba(123,94,167,0.7))',
  CONVERGENCE: 'drop-shadow(0 0 3px rgba(74,140,92,0.6))',
  SCENE_JUMP:  'drop-shadow(0 0 4px rgba(199,122,58,0.7))',
};

const SHARED_NODE = {
  bg:             BLENDER.BODY,
  border:         BLENDER.BODY_BORDER,
  text:           BLENDER.TEXT_MAIN,
  shadow:         BLENDER.SHADOW,
  shadowHover:    BLENDER.SHADOW_HOVER,
  shadowSelected: BLENDER.SHADOW_SELECTED,
};

export const blenderTheme: GraphTheme = {
  id:          'blender',
  name:        'Blender',
  description: 'Style éditeur nodal — lisibilité maximale',

  background: {
    type:  'animated',
    value: BLENDER.SPACE_DARK,
    // Same Cosmos animated starfield (set dynamically in useGraphTheme)
    component: undefined,
  },

  nodes: {
    dialogue: { ...SHARED_NODE, headerBg: BLENDER.HEADER_DIALOGUE },
    choice:   { ...SHARED_NODE, headerBg: BLENDER.HEADER_CHOICE   },
    terminal: { ...SHARED_NODE, headerBg: BLENDER.HEADER_TERMINAL },
    response: { ...SHARED_NODE, headerBg: BLENDER.HEADER_RESPONSE },
  },

  edges: {
    linear: {
      stroke:      '#5a7a9a',
      strokeWidth: 2,
      filter:      EDGE_GLOW.LINEAR,
      animated:    false,
    },
    choice: {
      stroke:      '#9a7abf',
      strokeWidth: 3,
      filter:      EDGE_GLOW.CHOICE,
      animated:    false,
    },
    convergence: {
      stroke:          '#5a9a7a',
      strokeWidth:     2,
      strokeDasharray: '6,4',
      filter:          EDGE_GLOW.CONVERGENCE,
      animated:        false,
    },
    sceneJump: {
      stroke:          '#c07a3a',
      strokeWidth:     2,
      strokeDasharray: '8,4',
      filter:          EDGE_GLOW.SCENE_JUMP,
      animated:        false,
    },
  },

  sizes: {
    nodeWidth:        360,
    nodeMinHeight:    140,
    nodeBorderRadius: 6,
    handleSize:       14,
    fontSizeSpeaker:  13,
    fontSizeText:     13,
  },

  animations: {
    nodeHover:    'default-node-hover',
    nodeSelected: 'default-node-selected',
    nodeAppear:   'default-node-appear',
    edgeAnimated: 'default-edge-animated',
  },

  effects: {},

  // Lucide icons, no emoji
  icons: {
    dialogue: '',
    choice:   '',
    terminal: '',
    response: '',
    useEmoji: false,
  },

  shapes: {
    nodeShape:           'rectangle',
    speechBubbleTail:    false,
    decorativeElements:  false,
    edgeType:            'bezier',
  },

  interactions: {
    minTouchTarget:      44,
    showDragIndicators:  false,
  },

  serpentine: {
    rowColors: [
      'rgba(74, 127, 181, 0.06)',
      'rgba(123, 94, 167, 0.06)',
      'rgba(199, 122, 58, 0.06)',
      'rgba(74, 140, 92,  0.06)',
    ],
    rowOpacity:          0.06,
    startBadgeColor:     '#4a8c5c',
    endBadgeColor:       '#c77a3a',
    flowArrowColor:      '#5a7a9a',
    rowTransitionColor:  '#7b5ea7',
  },
};
