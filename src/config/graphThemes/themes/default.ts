/**
 * Default Theme - Professional dark mode with gradient headers
 *
 * Design language aligning with DialoguePropertiesPanel:
 * - Gradient headers (blue→violet for dialogue, violet→pink for choice)
 * - Deep dark bodies (#0d1117) with subtle blue-tinted borders
 * - Rich two-layer shadows with inner top highlight
 * - Glowing selected state matching the gradient accent
 */
import type { GraphTheme } from '../types';

/** Shared shadow formula: depth + ambient + inner top highlight */
const SHADOW_BASE =
  '0 1px 3px rgba(0,0,0,0.8), 0 8px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)';

export const defaultTheme: GraphTheme = {
  id: 'default',
  name: 'Défaut',
  description: 'Thème professionnel dark mode',

  background: {
    type: 'solid',
    value: '#080d18', // near-black with blue tint
  },

  nodes: {
    // ── Dialogue — bleu → violet ──────────────────────────────────────────
    dialogue: {
      bg: '#0d1422', // #0d1117 + ~5% blue tint pour reconnaissance de catégorie
      border: 'rgba(59, 130, 246, 0.45)',
      headerBg: '#2563eb', // solid — used for SVG handle strokes
      headerBgGradient: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
      text: '#e2e8f0',
      shadow: SHADOW_BASE,
      shadowHover:
        '0 1px 3px rgba(0,0,0,0.8), 0 12px 30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)',
      shadowSelected:
        '0 0 0 1px rgba(59,130,246,0.7), 0 0 22px rgba(59,130,246,0.28), 0 8px 20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)',
    },

    // ── Choice — violet → rose ────────────────────────────────────────────
    choice: {
      bg: '#110b1e', // #0d0a1a + ~5% violet tint
      border: 'rgba(139, 92, 246, 0.45)',
      headerBg: '#7c3aed',
      headerBgGradient: 'linear-gradient(135deg, #6d28d9 0%, #be185d 100%)',
      text: '#e9d5ff',
      shadow: SHADOW_BASE,
      shadowHover:
        '0 1px 3px rgba(0,0,0,0.8), 0 12px 30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)',
      shadowSelected:
        '0 0 0 1px var(--color-primary-70), 0 0 22px var(--color-primary-28), 0 8px 20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)',
    },

    // ── Terminal — gris ardoise ───────────────────────────────────────────
    terminal: {
      bg: '#0d1117',
      border: 'rgba(71, 85, 105, 0.6)',
      headerBg: '#374151',
      headerBgGradient: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
      text: '#94a3b8',
      shadow: SHADOW_BASE,
      shadowHover:
        '0 1px 3px rgba(0,0,0,0.8), 0 12px 30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
      shadowSelected:
        '0 0 0 1px rgba(100,116,139,0.7), 0 0 18px rgba(100,116,139,0.2), 0 8px 20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
    },

    // ── Response — émeraude → cyan ────────────────────────────────────────
    response: {
      bg: '#071610', // #050f0a + ~5% teal tint
      border: 'rgba(16, 185, 129, 0.45)',
      headerBg: '#059669',
      headerBgGradient: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
      text: '#6ee7b7',
      shadow: SHADOW_BASE,
      shadowHover:
        '0 1px 3px rgba(0,0,0,0.8), 0 12px 30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
      shadowSelected:
        '0 0 0 1px rgba(16,185,129,0.7), 0 0 22px rgba(16,185,129,0.28), 0 8px 20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
    },
  },

  edges: {
    linear: {
      stroke: '#334155',
      strokeWidth: 2,
      animated: false,
    },
    choice: {
      stroke: '#7c3aed',
      strokeWidth: 2,
      animated: true,
    },
    convergence: {
      stroke: '#10b981',
      strokeWidth: 2,
      strokeDasharray: '4,4',
      animated: false,
    },
    sceneJump: {
      stroke: '#f59e0b',
      strokeWidth: 2,
      strokeDasharray: '5,5',
      animated: true,
    },
  },

  sizes: {
    nodeWidth: 420,
    nodeMinHeight: 140,
    nodeBorderRadius: 12,
    handleSize: 16,
    fontSizeSpeaker: 13,
    fontSizeText: 12,
  },

  animations: {
    nodeHover: 'default-node-hover',
    nodeSelected: 'default-node-selected',
    nodeAppear: 'default-node-appear',
    edgeAnimated: 'default-edge-animated',
  },

  effects: {
    // No special effects for default theme
  },
};
