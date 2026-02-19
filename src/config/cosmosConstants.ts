/**
 * cosmosConstants.ts — Single Source of Truth for Cosmos theme visual tokens
 *
 * All hardcoded colors, dimensions, and animation values used by Cosmos-specific
 * graph components are centralized here. Components import from this file
 * instead of defining inline magic values.
 *
 * Organized by feature area (convergence, choice, badge, indicator, etc.).
 */

// ============================================================================
// COLORS & GRADIENTS
// ============================================================================

export const COSMOS_COLORS = {
  /** Convergence edge ("↩ rejoint") */
  convergence: {
    stroke: '#22c55e',
    labelText: '#86efac',
    labelBg: 'rgba(15, 23, 42, 0.88)',
    labelBorder: 'rgba(34, 197, 94, 0.45)',
    labelShadow: '0 0 8px rgba(34, 197, 94, 0.25)',
  },

  /** Choice speech bubble on edge hover */
  choiceBubble: {
    gradient: 'linear-gradient(135deg, #9D4EDD 0%, #FF006E 100%)',
    border: '#e9d5ff',
    borderWidth: 3,
    text: '#ffffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    shadow: '0 0 20px rgba(157, 78, 221, 0.6), 0 0 40px rgba(255, 0, 110, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
    tailFill: '#9D4EDD',
  },

  /** START badge (first node) */
  startBadge: {
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    border: 'rgba(255, 255, 255, 0.95)',
    text: '#ffffff',
    shadow: `
      0 4px 16px rgba(34, 197, 94, 0.6),
      0 0 30px rgba(34, 197, 94, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
    `,
  },

  /** FIN badge (last node) */
  endBadge: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: 'rgba(255, 255, 255, 0.95)',
    text: '#ffffff',
    shadow: `
      0 4px 16px rgba(239, 68, 68, 0.6),
      0 0 30px rgba(239, 68, 68, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
    `,
  },

  /** Row transition indicator ("Suite" / down arrow) */
  rowTransition: {
    gradient: 'linear-gradient(180deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.95) 100%)',
    border: 'rgba(255, 255, 255, 0.9)',
    text: '#ffffff',
    shadow: `
      0 4px 20px rgba(139, 92, 246, 0.6),
      0 0 30px rgba(139, 92, 246, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
    `,
  },

  /** Flow arrow (direction within a row) */
  flowArrow: {
    gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.98) 100%)',
    border: 'rgba(255, 255, 255, 0.95)',
    shadow: `
      0 4px 16px rgba(34, 197, 94, 0.5),
      0 0 24px rgba(34, 197, 94, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4)
    `,
  },

  /** Row number badges (alternating by row parity) */
  rowBadge: {
    oddGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    evenGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    border: 'rgba(255, 255, 255, 0.9)',
    text: '#ffffff',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },

  /** Decorative stars (sparkle on nodes) */
  stars: {
    glow: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
  },

  /** Starfield background */
  starfield: {
    palette: ['#ffffff', '#FFD60A', '#06FFF0', '#FF006E', '#9D4EDD'] as const,
    glowStrong: (color: string) => `0 0 12px ${color}, 0 0 24px ${color}, 0 0 36px ${color}80`,
    glowMedium: (color: string) => `0 0 8px ${color}, 0 0 16px ${color}cc`,
    glowSubtle: (color: string) => `0 0 6px ${color}`,
  },

  /** Confetti / visual effects */
  effects: {
    creationColors: ['#fef08a', '#93c5fd', '#f9a8d4', '#a855f7'] as const,
    connectionColors: ['#10b981', '#34d399', '#6ee7b7'] as const,
    deleteGradient: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
  },

  /** Turn connector (serpentine U-turn) */
  turnConnector: {
    stroke: '#94a3b8',
  },

  /** Row separator (fun divider between serpentine rows) */
  rowSeparator: {
    bgOdd: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.08) 20%, rgba(59, 130, 246, 0.12) 50%, rgba(59, 130, 246, 0.08) 80%, transparent 100%)',
    bgEven: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.08) 20%, rgba(139, 92, 246, 0.12) 50%, rgba(139, 92, 246, 0.08) 80%, transparent 100%)',
    lineOdd: 'rgba(59, 130, 246, 0.35)',
    lineEven: 'rgba(139, 92, 246, 0.35)',
    badgeGradientOdd: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    badgeGradientEven: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    badgeBorder: 'rgba(255, 255, 255, 0.9)',
    badgeText: '#ffffff',
    badgeShadow: '0 2px 12px rgba(0, 0, 0, 0.25), 0 0 20px rgba(139, 92, 246, 0.3)',
  },

  /** SVG edge gradients (CosmosEdgeGradients.tsx) */
  gradients: {
    linear: {
      id: 'cosmos-linear-gradient',
      stops: [
        { offset: '0%', color: '#64748b', opacity: 0.8 },
        { offset: '50%', color: '#94a3b8', opacity: 0.9 },
        { offset: '100%', color: '#06FFF0', opacity: 0.7 },
      ],
    },
    choice: {
      id: 'cosmos-choice-gradient',
      stops: [
        { offset: '0%', color: '#9D4EDD', opacity: 1 },
        { offset: '50%', color: '#c084fc', opacity: 0.9 },
        { offset: '100%', color: '#FF006E', opacity: 0.8 },
      ],
    },
    convergence: {
      id: 'cosmos-convergence-gradient',
      stops: [
        { offset: '0%', color: '#10b981', opacity: 0.9 },
        { offset: '50%', color: '#34d399', opacity: 1 },
        { offset: '100%', color: '#06FFF0', opacity: 0.8 },
      ],
    },
    sceneJump: {
      id: 'cosmos-scene-gradient',
      stops: [
        { offset: '0%', color: '#FFD60A', opacity: 1 },
        { offset: '50%', color: '#f59e0b', opacity: 0.9 },
        { offset: '100%', color: '#06FFF0', opacity: 0.7 },
      ],
    },
  },
} as const;

// ============================================================================
// DIMENSIONS
// ============================================================================

export const COSMOS_DIMENSIONS = {
  /** Badges (START / FIN) */
  badge: {
    offset: 18,
    padding: '6px 16px',
    borderRadius: 20,
    borderWidth: 3,
    gap: 6,
    emojiFontSize: 18,
    textFontSize: 14,
    fontWeight: 800,
    letterSpacing: '1px',
    zIndex: 30,
  },

  /** Row number badge */
  rowBadge: {
    offset: 12,
    size: 28,
    borderWidth: 2,
    fontSize: 12,
    fontWeight: 800,
    zIndex: 20,
  },

  /** Flow arrow indicator (circular arrow in row) */
  flowArrow: {
    size: 40,
    borderWidth: 3,
    emojiFontSize: 22,
    zIndex: 25,
  },

  /** Row transition indicator ("Suite" / down arrow) */
  rowTransition: {
    sideOffset: 20,
    bottomOffset: 50,
    borderRadius: 16,
    borderWidth: 3,
    padding: '10px 14px',
    gap: 2,
    emojiFontSize: 28,
    labelFontSize: 11,
    labelFontWeight: 700,
    zIndex: 25,
  },

  /** Row indicator (glowing side bar) */
  rowIndicator: {
    sideOffset: 2,
    insetPercent: 15,
    width: 4,
    borderRadius: 4,
    opacity: 0.9,
    zIndex: 5,
  },

  /** Convergence edge (custom component) */
  convergenceEdge: {
    borderRadius: 20,
    offset: 24,
    stepRange: 0.4,
    ySpread: 9,
    strokeWidth: 2,
    strokeDasharray: '5,4',
    labelFontSize: 10,
    labelFontWeight: 600,
    labelPadding: '2px 7px',
    labelBorderRadius: 5,
  },

  /** Choice bubble (speech bubble on edge hover) */
  choiceBubble: {
    maxWidth: 250,
    borderRadius: 20,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
    tailWidth: 24,
    tailHeight: 12,
    tailOffset: 12,
    zIndex: 1000,
  },

  /** Speech bubble tail (on nodes) */
  speechBubbleTail: {
    bottomOffset: 14,
    leftPercent: '20%',
    width: 28,
    height: 16,
  },

  /** Decorative stars on nodes */
  decorativeStars: {
    offset: 10,
    fontSize: 20,
  },

  /** Drag indicator dots */
  dragIndicator: {
    top: 10,
    left: 10,
    gap: 3,
    dotSize: 6,
    opacity: 0.4,
  },

  /** Turn connector (serpentine U-turn edge) */
  turnConnector: {
    strokeWidth: 2.5,
    strokeDasharray: '6,4',
    opacity: 0.55,
    arrowWidth: 14,
    arrowHeight: 14,
  },

  /** Row separator node dimensions (sized for children 8+: big, clear, unmissable) */
  rowSeparator: {
    height: 64,
    lineThickness: 3,
    badgePadding: '8px 20px',
    badgeBorderRadius: 20,
    badgeBorderWidth: 3,
    badgeFontSize: 16,
    badgeFontWeight: 800,
    badgeGap: 8,
    emojiFontSize: 22,
  },

  /** Terminal node positioning */
  terminal: {
    width: 200,
    minHeight: 60,
    widthApprox: 200,
    yOffsetFromSource: 100,
    yMultiplierPerIndex: 70,
  },

  /** Star field background */
  starfield: {
    count: 150,
    sizeSmall: { min: 1, max: 3 },
    sizeMedium: { min: 3, max: 6 },
    sizeLarge: { min: 6, max: 10 },
    thresholdSmall: 0.6,
    thresholdMedium: 0.9,
    glowThresholdLarge: 6,
    glowThresholdMedium: 3,
    delayMax: 4,
    durationMin: 1.5,
    durationRange: 3,
  },

  /** Confetti effects */
  effects: {
    creationParticles: 30,
    creationSpread: 60,
    creationScalar: 1.5,
    creationTicks: 100,
    shapeScalar: 2,
    connectionParticles: 15,
    connectionSpread: 40,
    connectionScalar: 0.8,
    connectionTicks: 60,
    connectionGravity: 0.5,
    flashDuration: 300,
    flashZIndex: 9999,
  },
} as const;

// ============================================================================
// ANIMATIONS
// ============================================================================

export const COSMOS_ANIMATIONS = {
  /** Star twinkling (CosmosBackground) */
  starTwinkle: {
    opacityKeyframes: [0.3, 1, 0.3] as const,
    scaleKeyframes: [0.8, 1.2, 0.8] as const,
    ease: 'easeInOut' as const,
  },

  /** Bubble appear (CosmosChoiceEdge) */
  bubbleAppear: 'cosmos-bubble-appear 0.3s ease-out',

  /** Sparkle (NodeDecorations) */
  sparkle: 'cosmos-sparkle 2s ease-in-out infinite',

  /** Bounce (row transition indicator) */
  bounce: 'serpentine-bounce 1.5s ease-in-out infinite',

  /** Pulse (flow arrow) */
  pulse: 'serpentine-pulse 1.2s ease-in-out infinite',

  /** General transitions */
  transitionFast: 'all 0.2s ease',
  transitionNormal: 'all 0.3s ease',

  /** Delete flash */
  deleteFlash: 'cosmos-delete-flash 0.3s ease-out forwards',
} as const;

// ============================================================================
// TEXT TRUNCATION LIMITS
// ============================================================================

export const TRUNCATION = {
  /** Main dialogue text in node (BaseNode) */
  nodeText: 80,
  /** Stage directions in node (BaseNode) */
  stageDirections: 50,
  /** Choice preview in ChoiceNode badge */
  choicePreview: 12,
  /** Choice text on edge label (buildGraphEdges) */
  edgeLabel: 20,
  /** Choice text in TerminalNode */
  terminalChoice: 30,
  /** Dialogue text in wizard select (ChoiceCard) */
  wizardDialogue: 30,
} as const;

// ============================================================================
// GRAPH UI CONTROLS POSITIONING
// ============================================================================

/** Pixel offsets for ReactFlow overlays inside the graph canvas */
export const GRAPH_CONTROLS_POSITION = {
  /** ReactFlow <Controls> panel (top-left) */
  controls: { top: 60, left: 16 },
  /** Pro mode toolbar (bottom-right) */
  proMode: { bottom: 70, right: 16 },
} as const;

// ============================================================================
// NODE FONT SIZES
// ============================================================================

/** Font sizes used across graph node renderers (px values) */
export const NODE_FONT = {
  /** Small metadata / subtitle text (BaseNode italic, ClusterNode subtitle) */
  meta: 10,
  /** Badge / small label text (ChoiceNode count, TerminalNode summary) */
  badge: 11,
  /** Large icon / emoji in terminal nodes and choice bullets */
  icon: 24,
} as const;
