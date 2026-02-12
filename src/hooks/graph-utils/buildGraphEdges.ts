import type { Edge } from '@xyflow/react';
import type { Dialogue } from '@/types';
import type { GraphTheme, EdgeStyle } from '@/config/graphThemes/types';
import { HANDLE_ID, choiceHandleId, dialogueNodeId } from '@/config/handleConfig';
import { COSMOS_THEME_ID } from '@/config/layoutConfig';
import type { GraphNode } from './types';

/**
 * Edge type for Cosmos-theme convergence edges (custom component with fan routing).
 * Registered in DialogueGraph.tsx edgeTypes map.
 */
const COSMOS_CONVERGENCE_EDGE_TYPE = 'cosmosConvergence';

/**
 * Default edge style values (fallbacks when no theme is provided)
 */
const DEFAULT_EDGE_STYLES: Record<string, EdgeStyle> = {
  linear: { stroke: '#64748b', strokeWidth: 2, animated: false },
  choice: { stroke: '#8b5cf6', strokeWidth: 2, animated: true },
  convergence: { stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '4,4', animated: false },
  sceneJump: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5', animated: true }
};

const LABEL_STYLE = { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 };
const LABEL_BG_STYLE = { fill: '#1e293b', fillOpacity: 0.8 };
const CONVERGENCE_LABEL_STYLE = { fill: '#86efac', fontSize: 11, fontWeight: 500 };

/**
 * Build edges from dialogue array and optionally create terminal nodes for scene jumps.
 *
 * @param dialogues - Dialogue data
 * @param sceneId - Current scene ID
 * @param nodes - Mutable node array (terminal nodes are pushed here)
 * @param theme - Optional graph theme for edge styling
 * @returns Array of edges
 */
export function buildGraphEdges(
  dialogues: Dialogue[],
  sceneId: string,
  nodes: GraphNode[],
  theme?: GraphTheme
): Edge[] {
  const edges: Edge[] = [];

  // Pre-build lookup map for O(1) dialogue ID → index resolution
  const dialogueIdToIndex = new Map<string, number>();
  dialogues.forEach((d, i) => dialogueIdToIndex.set(d.id, i));

  const edgeStyles = {
    linear: theme?.edges.linear || DEFAULT_EDGE_STYLES.linear,
    choice: theme?.edges.choice || DEFAULT_EDGE_STYLES.choice,
    convergence: theme?.edges.convergence || DEFAULT_EDGE_STYLES.convergence,
    sceneJump: theme?.edges.sceneJump || DEFAULT_EDGE_STYLES.sceneJump
  };

  const edgeType = theme?.shapes?.edgeType || 'step';
  // Cosmos theme uses a dedicated custom edge component for convergence edges,
  // which applies fan-routing to separate parallel paths to the same target.
  const convergenceEdgeType =
    theme?.id === COSMOS_THEME_ID ? COSMOS_CONVERGENCE_EDGE_TYPE : edgeType;

  dialogues.forEach((dialogue, index) => {
    const sourceId = dialogueNodeId(sceneId, index);
    const hasChoices = dialogue.choices && dialogue.choices.length > 0;

    // Convergence edge: dialogue has explicit nextDialogueId
    if (dialogue.nextDialogueId) {
      const targetIdx = dialogueIdToIndex.get(dialogue.nextDialogueId!) ?? -1;
      if (targetIdx !== -1) {
        edges.push({
          id: `${sourceId}-converge-to-${sceneId}-d-${targetIdx}`,
          source: sourceId,
          sourceHandle: HANDLE_ID.RIGHT,
          target: dialogueNodeId(sceneId, targetIdx),
          targetHandle: HANDLE_ID.LEFT,
          type: convergenceEdgeType,
          animated: edgeStyles.convergence.animated,
          label: convergenceEdgeType === COSMOS_CONVERGENCE_EDGE_TYPE ? undefined : '↩ rejoint',
          data: { isConvergence: true },
          style: {
            stroke: edgeStyles.convergence.stroke,
            strokeWidth: edgeStyles.convergence.strokeWidth,
            strokeDasharray: edgeStyles.convergence.strokeDasharray,
            filter: edgeStyles.convergence.filter
          },
          labelStyle: CONVERGENCE_LABEL_STYLE,
          labelBgStyle: LABEL_BG_STYLE
        });
      }
    }
    // Response convergence: if dialogue is a response, find next non-response
    else if (dialogue.isResponse) {
      for (let targetIdx = index + 1; targetIdx < dialogues.length; targetIdx++) {
        if (!dialogues[targetIdx].isResponse) {
          edges.push({
            id: `${sourceId}-response-converge-to-${sceneId}-d-${targetIdx}`,
            source: sourceId,
            sourceHandle: HANDLE_ID.RIGHT,
            target: dialogueNodeId(sceneId, targetIdx),
            targetHandle: HANDLE_ID.LEFT,
            type: convergenceEdgeType,
            animated: edgeStyles.convergence.animated,
            label: convergenceEdgeType === COSMOS_CONVERGENCE_EDGE_TYPE ? undefined : '↩ rejoint',
            data: { isConvergence: true },
            style: {
              stroke: edgeStyles.convergence.stroke,
              strokeWidth: edgeStyles.convergence.strokeWidth,
              strokeDasharray: edgeStyles.convergence.strokeDasharray,
              filter: edgeStyles.convergence.filter
            },
            labelStyle: CONVERGENCE_LABEL_STYLE,
            labelBgStyle: LABEL_BG_STYLE
          });
          break;
        }
      }
    }
    // Linear edge: dialogue → next dialogue
    else if (!hasChoices && index < dialogues.length - 1) {
      edges.push({
        id: `${sourceId}-to-${sceneId}-d-${index + 1}`,
        source: sourceId,
        sourceHandle: HANDLE_ID.RIGHT,
        target: dialogueNodeId(sceneId, index + 1),
        targetHandle: HANDLE_ID.LEFT,
        type: edgeType,
        animated: edgeStyles.linear.animated,
        style: {
          stroke: edgeStyles.linear.stroke,
          strokeWidth: edgeStyles.linear.strokeWidth,
          filter: edgeStyles.linear.filter
        }
      });
    }

    // Choice edges
    if (hasChoices) {
      dialogue.choices.forEach((choice, choiceIdx) => {
        if (choice.nextDialogueId) {
          const targetIdx = dialogueIdToIndex.get(choice.nextDialogueId!) ?? -1;
          if (targetIdx !== -1) {
            const targetId = dialogueNodeId(sceneId, targetIdx);
            const edgeLabel = choice.text ? choice.text.substring(0, 20) + (choice.text.length > 20 ? '...' : '') : `Choice ${choiceIdx + 1}`;

            edges.push({
              id: `${sourceId}-choice-${choiceIdx}-to-${targetId}`,
              source: sourceId,
              sourceHandle: choiceHandleId(choiceIdx),
              target: targetId,
              targetHandle: HANDLE_ID.LEFT,
              type: theme?.id === COSMOS_THEME_ID ? 'cosmosChoice' : edgeType,
              animated: edgeStyles.choice.animated,
              label: edgeLabel,
              data: { label: edgeLabel },
              style: {
                stroke: edgeStyles.choice.stroke,
                strokeWidth: edgeStyles.choice.strokeWidth,
                filter: edgeStyles.choice.filter
              },
              labelStyle: LABEL_STYLE,
              labelBgStyle: LABEL_BG_STYLE
            });
          }
        }

        // Scene jump edge
        if (choice.nextSceneId) {
          const terminalId = `${sourceId}-terminal-${choiceIdx}`;

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

          const terminalLabel = choice.text?.substring(0, 20) + '...' || 'Jump to scene';
          edges.push({
            id: `${sourceId}-choice-${choiceIdx}-to-terminal`,
            source: sourceId,
            sourceHandle: choiceHandleId(choiceIdx),
            target: terminalId,
            targetHandle: HANDLE_ID.LEFT,
            type: theme?.id === COSMOS_THEME_ID ? 'cosmosChoice' : edgeType,
            animated: edgeStyles.sceneJump.animated,
            label: terminalLabel,
            data: { label: terminalLabel },
            style: {
              stroke: edgeStyles.sceneJump.stroke,
              strokeWidth: edgeStyles.sceneJump.strokeWidth,
              strokeDasharray: edgeStyles.sceneJump.strokeDasharray,
              filter: edgeStyles.sceneJump.filter
            },
            labelStyle: LABEL_STYLE,
            labelBgStyle: LABEL_BG_STYLE
          });
        }
      });
    }
  });

  // ── Post-process: assign parallel fan indices to convergence edges ────────
  // When multiple convergence edges target the same node (e.g. several isResponse
  // dialogues all pointing to the same "next main" node), they must be visually
  // separated so they don't draw on top of each other.
  // CosmosConvergenceEdge uses parallelIndex/parallelCount to compute stepPosition
  // and Y-spread, producing a fan effect at both source and target.
  if (convergenceEdgeType === COSMOS_CONVERGENCE_EDGE_TYPE) {
    const byTarget = new Map<string, number[]>();
    edges.forEach((edge, i) => {
      if ((edge.data as { isConvergence?: boolean } | undefined)?.isConvergence) {
        if (!byTarget.has(edge.target)) byTarget.set(edge.target, []);
        byTarget.get(edge.target)!.push(i);
      }
    });
    byTarget.forEach(indices => {
      const parallelCount = indices.length;
      indices.forEach((edgeIdx, parallelIndex) => {
        edges[edgeIdx] = {
          ...edges[edgeIdx],
          data: { ...edges[edgeIdx].data, parallelIndex, parallelCount },
        };
      });
    });
  }

  return edges;
}
