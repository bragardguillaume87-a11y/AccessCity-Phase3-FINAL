import { useMemo } from 'react';
import type { Edge } from '@xyflow/react';
import type { Dialogue, ValidationProblem, NodeColorTheme } from '@/types';
import { DEFAULTS } from '@/config/constants';
import type { GraphTheme } from '@/config/graphThemes/types';
import { useUIStore } from '@/stores/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { dialogueNodeId } from '@/config/handleConfig';
import type { GraphNode } from './graph-utils/types';
import { buildGraphEdges } from './graph-utils/buildGraphEdges';
import { applyDagreLayout } from './graph-utils/applyDagreLayout';
import { applySerpentineLayout, applySerpentineEdgeRouting, buildSerpentineTurnEdges } from './graph-utils/applySerpentineLayout';

/**
 * Return type of useDialogueGraph hook
 */
interface UseDialogueGraphReturn {
  nodes: GraphNode[];
  edges: Edge[];
}

/**
 * Validation object with optional errors structure
 */
interface ValidationWithErrors {
  errors?: {
    dialogues?: Record<string, ValidationProblem[]>;
  };
}

/**
 * useDialogueGraph - Transform dialogues into ReactFlow graph structure
 *
 * Orchestrates 3 stages:
 * 1. Build nodes from dialogues + build edges (with terminal nodes for scene jumps)
 * 2. Apply dagre auto-layout
 * 3. Optionally apply serpentine transformation
 *
 * @param dialogues - Array of dialogue objects from scene
 * @param sceneId - Scene ID for unique node IDs
 * @param validation - Optional validation object with issues
 * @param layoutDirection - 'TB' or 'LR' layout direction
 * @param theme - Optional theme for edge styles and node sizes
 * @returns Graph structure with nodes and edges for ReactFlow
 */
export function useDialogueGraph(
  dialogues: Dialogue[] = [],
  sceneId: string = '',
  validation: ValidationWithErrors | null = null,
  layoutDirection: 'TB' | 'LR' = 'TB',
  theme?: GraphTheme
): UseDialogueGraphReturn {
  const { serpentineEnabled, serpentineMode, serpentineGroupSize } = useUIStore(
    useShallow((state) => ({
      serpentineEnabled: state.serpentineEnabled,
      serpentineMode: state.serpentineMode,
      serpentineGroupSize: state.serpentineGroupSize,
    }))
  );

  return useMemo(() => {
    if (!dialogues || dialogues.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Step 1: Transform dialogues to nodes
    const nodes: GraphNode[] = dialogues.map((dialogue, index) => {
      const hasChoices = dialogue.choices && dialogue.choices.length > 0;
      return {
        id: dialogueNodeId(sceneId, index),
        type: hasChoices ? 'choiceNode' : 'dialogueNode',
        position: { x: 0, y: 0 },
        data: {
          dialogue,
          index,
          speaker: dialogue.speaker || DEFAULTS.DIALOGUE_SPEAKER,
          text: dialogue.text || '',
          speakerMood: dialogue.speakerMood || 'neutral',
          stageDirections: dialogue.stageDirections || '',
          choices: dialogue.choices || [],
          issues: validation?.errors?.dialogues?.[dialogue.id] || []
        }
      };
    });

    // Step 2: Build edges (may also push terminal nodes into the array)
    const edges = buildGraphEdges(dialogues, sceneId, nodes, theme);

    // Step 3: Apply dagre layout
    let layoutedNodes = applyDagreLayout(nodes, edges, layoutDirection, theme);
    let layoutedEdges = edges;

    // Step 4: Apply serpentine if enabled (LR mode only)
    if (layoutDirection === 'LR' && serpentineEnabled) {
      layoutedNodes = applySerpentineLayout(layoutedNodes, serpentineMode, serpentineGroupSize);
      layoutedEdges = applySerpentineEdgeRouting(layoutedEdges, layoutedNodes);
      layoutedEdges = buildSerpentineTurnEdges(layoutedNodes, layoutedEdges);
    }

    return { nodes: layoutedNodes, edges: layoutedEdges };
  }, [dialogues, sceneId, validation, layoutDirection, theme, serpentineEnabled, serpentineMode, serpentineGroupSize]);
}

/**
 * Get node color based on type and validation issues
 */
export function getNodeColorTheme(nodeType: string, issues: ValidationProblem[] = []): NodeColorTheme {
  const hasErrors = issues.some(issue => issue.type === 'error');
  const hasWarnings = issues.some(issue => issue.type === 'warning');

  if (hasErrors) {
    return { bg: '#7f1d1d', border: '#dc2626', text: '#fecaca' };
  }

  if (hasWarnings) {
    return { bg: '#78350f', border: '#f59e0b', text: '#fde68a' };
  }

  switch (nodeType) {
    case 'choiceNode':
      return { bg: '#4c1d95', border: '#8b5cf6', text: '#e9d5ff' };
    case 'terminalNode':
      return { bg: '#78350f', border: '#f59e0b', text: '#fde68a' };
    case 'dialogueNode':
    default:
      return { bg: '#1e3a8a', border: '#3b82f6', text: '#bfdbfe' };
  }
}
