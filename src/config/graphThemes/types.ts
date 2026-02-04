/**
 * GraphTheme Types - Interface defining the structure of a graph theme
 *
 * Each theme defines colors, gradients, animations and dimensions.
 * Components read values from the active theme via useGraphTheme hook.
 */
import type { ComponentType } from 'react';

/**
 * Color set for a specific node type
 */
export interface NodeColorSet {
  /** Background color (solid) */
  bg: string;
  /** Background gradient (optional, overrides bg) */
  bgGradient?: string;
  /** Border color */
  border: string;
  /** Text color */
  text: string;
  /** Box shadow (default state) */
  shadow: string;
  /** Box shadow (hover state) */
  shadowHover: string;
  /** Box shadow (selected state) */
  shadowSelected: string;
}

/**
 * Style for a specific edge type
 */
export interface EdgeStyle {
  /** Stroke color */
  stroke: string;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Stroke dash array (for dashed lines) */
  strokeDasharray?: string;
  /** CSS filter (for glow effects) */
  filter?: string;
  /** Whether the edge is animated */
  animated: boolean;
}

/**
 * Main theme interface
 */
export interface GraphTheme {
  /** Unique theme identifier */
  id: string;
  /** Display name (shown in UI) */
  name: string;
  /** Short description */
  description: string;

  /** Background configuration */
  background: {
    /** Type of background */
    type: 'solid' | 'gradient' | 'animated';
    /** Background value (color or gradient CSS) */
    value: string;
    /** Optional React component for animated backgrounds */
    component?: ComponentType;
  };

  /** Node colors by type */
  nodes: {
    dialogue: NodeColorSet;
    choice: NodeColorSet;
    terminal: NodeColorSet;
    response: NodeColorSet;
  };

  /** Edge styles by type */
  edges: {
    linear: EdgeStyle;
    choice: EdgeStyle;
    convergence: EdgeStyle;
    sceneJump: EdgeStyle;
  };

  /** Dimensions (can be adapted for children) */
  sizes: {
    /** Node width in pixels */
    nodeWidth: number;
    /** Node minimum height in pixels */
    nodeMinHeight: number;
    /** Node border radius in pixels */
    nodeBorderRadius: number;
    /** Handle size in pixels */
    handleSize: number;
    /** Speaker font size in pixels */
    fontSizeSpeaker: number;
    /** Text font size in pixels */
    fontSizeText: number;
  };

  /** CSS class names for animations */
  animations: {
    /** Class applied on node hover */
    nodeHover: string;
    /** Class applied when node is selected */
    nodeSelected: string;
    /** Class applied when node appears */
    nodeAppear: string;
    /** Class applied to animated edges */
    edgeAnimated: string;
  };

  /** Special effects callbacks (confetti, particles, etc.) */
  effects: {
    /** Called when a node is created */
    onNodeCreate?: () => void;
    /** Called when a connection is made */
    onConnection?: (x: number, y: number) => void;
    /** Called when a node is deleted */
    onDelete?: () => void;
  };

  /** Icons configuration (emojis for children, Lucide for professionals) */
  icons?: {
    /** Icon/emoji for dialogue nodes */
    dialogue: string;
    /** Icon/emoji for choice nodes */
    choice: string;
    /** Icon/emoji for terminal/scene jump nodes */
    terminal: string;
    /** Icon/emoji for response nodes */
    response: string;
    /** Use emoji rendering instead of Lucide icons */
    useEmoji: boolean;
  };

  /** Node shape configuration (for child-friendly themes) */
  shapes?: {
    /** Type of node shape: rectangle (default), pill (very rounded), bubble (speech bubble style) */
    nodeShape: 'rectangle' | 'pill' | 'bubble';
    /** Add speech bubble tail to dialogue nodes */
    speechBubbleTail?: boolean;
    /** Add decorative elements (stars, sparkles) */
    decorativeElements?: boolean;
    /** Edge type: 'step' (orthogonal), 'smoothstep' (rounded corners), 'bezier' (curves), 'straight' (direct diagonal) */
    edgeType?: 'step' | 'smoothstep' | 'bezier' | 'straight';
  };

  /** Touch/drag interaction settings (for child-friendly themes) */
  interactions?: {
    /** Minimum touch target size in px (WCAG recommends 44px, children need 48px+) */
    minTouchTarget: number;
    /** Show drag handle indicators (emoji on handles) */
    showDragIndicators?: boolean;
  };
}
