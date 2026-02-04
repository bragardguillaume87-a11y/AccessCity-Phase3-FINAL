/**
 * Default Theme - Professional dark mode
 *
 * Extracts current values from the codebase to maintain
 * backwards compatibility with the existing graph appearance.
 */
import type { GraphTheme } from '../types';

export const defaultTheme: GraphTheme = {
  id: 'default',
  name: 'Défaut',
  description: 'Thème professionnel dark mode',

  background: {
    type: 'solid',
    value: '#0f172a', // slate-900
  },

  nodes: {
    dialogue: {
      bg: '#1e293b',
      border: '#3b82f6',
      text: '#bfdbfe',
      shadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      shadowHover: '0 8px 16px rgba(0, 0, 0, 0.4)',
      shadowSelected: '0 8px 16px rgba(0, 0, 0, 0.4)',
    },
    choice: {
      bg: 'rgba(139, 92, 246, 0.2)',
      border: '#8b5cf6',
      text: '#c4b5fd',
      shadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      shadowHover: '0 8px 16px rgba(0, 0, 0, 0.4)',
      shadowSelected: '0 8px 16px rgba(0, 0, 0, 0.4)',
    },
    terminal: {
      bg: '#1e293b',
      border: '#475569',
      text: '#94a3b8',
      shadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      shadowHover: '0 8px 16px rgba(0, 0, 0, 0.4)',
      shadowSelected: '0 8px 16px rgba(0, 0, 0, 0.4)',
    },
    response: {
      bg: '#1e293b',
      border: '#10b981',
      text: '#6ee7b7',
      shadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      shadowHover: '0 8px 16px rgba(0, 0, 0, 0.4)',
      shadowSelected: '0 8px 16px rgba(0, 0, 0, 0.4)',
    },
  },

  edges: {
    linear: {
      stroke: '#64748b',
      strokeWidth: 2,
      animated: false,
    },
    choice: {
      stroke: '#8b5cf6',
      strokeWidth: 2,
      animated: true,
    },
    convergence: {
      stroke: '#22c55e',
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
    nodeWidth: 320,
    nodeMinHeight: 140,
    nodeBorderRadius: 12,
    handleSize: 12,
    fontSizeSpeaker: 14,
    fontSizeText: 13,
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
