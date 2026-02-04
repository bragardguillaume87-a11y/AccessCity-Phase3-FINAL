import { useMemo } from 'react';
import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Dialogue, ValidationProblem, DialogueNodeData, TerminalNodeData, NodeColorTheme } from '@/types';
import { DEFAULTS } from '@/config/constants';
import type { GraphTheme } from '@/config/graphThemes/types';

/**
 * Union type for all graph node types
 */
type GraphNode = Node<DialogueNodeData> | Node<TerminalNodeData>;

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
 * Features:
 * - Converts dialogue array to {nodes, edges} for ReactFlow
 * - Auto-layout with dagre algorithm (intelligent positioning)
 * - Supports dialogue nodes and choice nodes
 * - Handles linear flow and branching choices
 * - Enriches with validation issues (if provided)
 *
 * @param dialogues - Array of dialogue objects from scene
 * @param sceneId - Scene ID for unique node IDs
 * @param validation - Optional validation object with issues
 * @returns Graph structure with nodes and edges for ReactFlow
 *
 * @example
 * ```tsx
 * const { nodes, edges } = useDialogueGraph(scene.dialogues, scene.id, validation);
 * return <ReactFlow nodes={nodes} edges={edges} />;
 * ```
 */
export function useDialogueGraph(
  dialogues: Dialogue[] = [],
  sceneId: string = '',
  validation: ValidationWithErrors | null = null,
  layoutDirection: 'TB' | 'LR' = 'TB',  // PHASE 3.5: Layout direction parameter
  theme?: GraphTheme  // PHASE 4: Optional theme for dynamic edge styles
): UseDialogueGraphReturn {
  return useMemo(() => {
    if (!dialogues || dialogues.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Step 1: Transform dialogues to nodes
    const nodes: GraphNode[] = dialogues.map((dialogue, index) => {
      const hasChoices = dialogue.choices && dialogue.choices.length > 0;
      const nodeType = hasChoices ? 'choiceNode' : 'dialogueNode';

      return {
        id: `${sceneId}-d-${index}`,
        type: nodeType,
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        data: {
          dialogue,
          index,
          speaker: dialogue.speaker || DEFAULTS.DIALOGUE_SPEAKER,
          text: dialogue.text || '',
          speakerMood: dialogue.speakerMood || 'neutral',
          stageDirections: dialogue.stageDirections || '',
          choices: dialogue.choices || [],
          // Enrich with validation issues if available
          issues: validation?.errors?.dialogues?.[dialogue.id] || []
        }
      };
    });

    // Step 2: Create edges
    const edges: Edge[] = [];

    dialogues.forEach((dialogue, index) => {
      const sourceId = `${sceneId}-d-${index}`;
      const hasChoices = dialogue.choices && dialogue.choices.length > 0;

      // PHASE 4: Edge styles from theme (with fallback to defaults)
      const edgeStyles = {
        linear: theme?.edges.linear || { stroke: '#64748b', strokeWidth: 2, animated: false },
        choice: theme?.edges.choice || { stroke: '#8b5cf6', strokeWidth: 2, animated: true },
        convergence: theme?.edges.convergence || { stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '4,4', animated: false },
        sceneJump: theme?.edges.sceneJump || { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5', animated: true }
      };

      // PHASE 6: Edge type from theme (bezier for cosmos, step for default)
      const edgeType = theme?.shapes?.edgeType || 'step';

      // Convergence edge: dialogue has explicit nextDialogueId (e.g. manual linking)
      if (dialogue.nextDialogueId) {
        const targetIdx = dialogues.findIndex(d => d.id === dialogue.nextDialogueId);
        if (targetIdx !== -1) {
          edges.push({
            id: `${sourceId}-converge-to-${sceneId}-d-${targetIdx}`,
            source: sourceId,
            target: `${sceneId}-d-${targetIdx}`,
            type: edgeType,
            animated: edgeStyles.convergence.animated,
            label: '↩ rejoint',
            style: {
              stroke: edgeStyles.convergence.stroke,
              strokeWidth: edgeStyles.convergence.strokeWidth,
              strokeDasharray: edgeStyles.convergence.strokeDasharray,
              filter: edgeStyles.convergence.filter
            },
            labelStyle: { fill: '#86efac', fontSize: 11, fontWeight: 500 },
            labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 }
          });
        }
      }
      // Response convergence: if dialogue is a response, find next non-response dialogue
      else if (dialogue.isResponse) {
        // Find the next dialogue that is NOT a response (convergence point)
        for (let targetIdx = index + 1; targetIdx < dialogues.length; targetIdx++) {
          if (!dialogues[targetIdx].isResponse) {
            edges.push({
              id: `${sourceId}-response-converge-to-${sceneId}-d-${targetIdx}`,
              source: sourceId,
              target: `${sceneId}-d-${targetIdx}`,
              type: edgeType,
              animated: edgeStyles.convergence.animated,
              label: '↩ rejoint',
              style: {
                stroke: edgeStyles.convergence.stroke,
                strokeWidth: edgeStyles.convergence.strokeWidth,
                strokeDasharray: edgeStyles.convergence.strokeDasharray,
                filter: edgeStyles.convergence.filter
              },
              labelStyle: { fill: '#86efac', fontSize: 11, fontWeight: 500 },
              labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 }
            });
            break; // Only create edge to the FIRST non-response dialogue
          }
        }
        // If no convergence point found, response leads to end of scene (no edge)
      }
      // Linear edge: dialogue → next dialogue (if no choices, not a response, and no explicit next)
      else if (!hasChoices && index < dialogues.length - 1) {
        edges.push({
          id: `${sourceId}-to-${sceneId}-d-${index + 1}`,
          source: sourceId,
          target: `${sceneId}-d-${index + 1}`,
          type: edgeType,
          animated: edgeStyles.linear.animated,
          style: {
            stroke: edgeStyles.linear.stroke,
            strokeWidth: edgeStyles.linear.strokeWidth,
            filter: edgeStyles.linear.filter
          }
        });
      }

      // Choice edges: dialogue → target dialogue (from choice.nextDialogue)
      if (hasChoices) {
        dialogue.choices.forEach((choice, choiceIdx) => {
          if (choice.nextDialogueId) {
            // Find target dialogue by ID
            const targetIdx = dialogues.findIndex(d => d.id === choice.nextDialogueId);

            if (targetIdx !== -1) {
              const targetId = `${sceneId}-d-${targetIdx}`;
              const edgeLabel = choice.text ? choice.text.substring(0, 20) + (choice.text.length > 20 ? '...' : '') : `Choice ${choiceIdx + 1}`;

              edges.push({
                id: `${sourceId}-choice-${choiceIdx}-to-${targetId}`,
                source: sourceId,
                sourceHandle: `choice-${choiceIdx}`, // PHASE 2: Multi-handles support
                target: targetId,
                type: edgeType,
                animated: edgeStyles.choice.animated,
                label: edgeLabel,
                style: {
                  stroke: edgeStyles.choice.stroke,
                  strokeWidth: edgeStyles.choice.strokeWidth,
                  filter: edgeStyles.choice.filter
                },
                labelStyle: { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 },
                labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 }
              });
            }
          }

          // Scene jump edge (nextScene)
          if (choice.nextSceneId) {
            // For scene jumps, create a special terminal node
            const terminalId = `${sourceId}-terminal-${choiceIdx}`;

            // Add terminal node
            nodes.push({
              id: terminalId,
              type: 'terminalNode',
              position: { x: 0, y: 0 },
              data: {
                sceneId: choice.nextSceneId,
                label: `→ Scene: ${choice.nextSceneId}`,
                choiceText: choice.text
              }
            });

            // Add edge to terminal
            edges.push({
              id: `${sourceId}-choice-${choiceIdx}-to-terminal`,
              source: sourceId,
              sourceHandle: `choice-${choiceIdx}`, // PHASE 2: Multi-handles support
              target: terminalId,
              type: edgeType,
              animated: edgeStyles.sceneJump.animated,
              label: choice.text?.substring(0, 20) + '...' || 'Jump to scene',
              style: {
                stroke: edgeStyles.sceneJump.stroke,
                strokeWidth: edgeStyles.sceneJump.strokeWidth,
                strokeDasharray: edgeStyles.sceneJump.strokeDasharray,
                filter: edgeStyles.sceneJump.filter
              },
              labelStyle: { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 },
              labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 }
            });
          }
        });
      }
    });

    // Step 3: Calculate layout with dagre (pass theme for dynamic node sizes)
    const layoutedNodes = calculateLayoutWithDagre(nodes, edges, layoutDirection, theme);

    return {
      nodes: layoutedNodes,
      edges
    };
  }, [dialogues, sceneId, validation, layoutDirection, theme]);
}

/**
 * Calculate auto-layout positions using dagre algorithm
 *
 * @param nodes - ReactFlow nodes (without positions)
 * @param edges - ReactFlow edges
 * @param layoutDirection - 'TB' (vertical) or 'LR' (horizontal)
 * @param theme - Optional theme for dynamic node sizes
 * @returns Nodes with calculated positions
 */
function calculateLayoutWithDagre(
  nodes: GraphNode[],
  edges: Edge[],
  layoutDirection: 'TB' | 'LR' = 'TB',  // PHASE 3.5: Layout direction
  theme?: GraphTheme  // PHASE 4: Theme for dynamic node sizes
): GraphNode[] {
  const dagreGraph = new dagre.graphlib.Graph();

  // Configure graph layout
  dagreGraph.setGraph({
    rankdir: layoutDirection, // PHASE 3.5: Dynamic direction (TB=vertical, LR=horizontal)
    nodesep: layoutDirection === 'TB' ? 80 : 120,   // Reduce horizontal spacing for TB
    ranksep: layoutDirection === 'TB' ? 220 : 180,  // Increase vertical spacing for TB
    marginx: 50,
    marginy: 50
  });

  // Set default edge config
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // PHASE 4: Use theme sizes if available, otherwise use defaults
  const defaultNodeWidth = theme?.sizes.nodeWidth ?? 320;
  const defaultNodeHeight = theme?.sizes.nodeMinHeight ?? 140;

  // Add nodes to dagre graph
  nodes.forEach(node => {
    // Node dimensions: terminal nodes are smaller, others use theme sizes
    const width = node.type === 'terminalNode' ? 200 : defaultNodeWidth;
    const height = node.type === 'terminalNode' ? 60 : defaultNodeHeight;

    dagreGraph.setNode(node.id, { width, height });
  });

  // Add edges to dagre graph
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  return nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = nodeWithPosition.width;
    const height = nodeWithPosition.height;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2
      }
    };
  });
}

/**
 * Helper: Get node color based on type and issues
 *
 * @param nodeType - Type of node (dialogueNode, choiceNode, terminalNode)
 * @param issues - Validation issues array
 * @returns Color theme for node
 */
export function getNodeColorTheme(nodeType: string, issues: ValidationProblem[] = []): NodeColorTheme {
  const hasErrors = issues.some(issue => issue.type === 'error');
  const hasWarnings = issues.some(issue => issue.type === 'warning');

  // Error state (red)
  if (hasErrors) {
    return {
      bg: '#7f1d1d',
      border: '#dc2626',
      text: '#fecaca'
    };
  }

  // Warning state (amber)
  if (hasWarnings) {
    return {
      bg: '#78350f',
      border: '#f59e0b',
      text: '#fde68a'
    };
  }

  // Default colors by type
  switch (nodeType) {
    case 'choiceNode':
      return {
        bg: '#4c1d95',
        border: '#8b5cf6',
        text: '#e9d5ff'
      };
    case 'terminalNode':
      return {
        bg: '#78350f',
        border: '#f59e0b',
        text: '#fde68a'
      };
    case 'dialogueNode':
    default:
      return {
        bg: '#1e3a8a',
        border: '#3b82f6',
        text: '#bfdbfe'
      };
  }
}
