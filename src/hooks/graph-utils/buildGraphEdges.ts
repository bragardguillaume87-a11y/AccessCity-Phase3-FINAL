import type { Edge } from '@xyflow/react';
import type { Dialogue } from '@/types';
import type { GraphTheme, EdgeStyle } from '@/config/graphThemes/types';
import { HANDLE_ID, choiceHandleId, dialogueNodeId } from '@/config/handleConfig';
import { getEdgeTypeForCategory } from '@/config/edgeRegistry';
import { truncateEdgeLabel } from '@/utils/textHelpers';
import { createEdge, type ResolvedEdgeStyles, type EdgeCategory } from './edgeFactory';
import type { GraphNode } from './types';

/**
 * Default edge style values (fallbacks when no theme is provided)
 */
const DEFAULT_EDGE_STYLES: Record<string, EdgeStyle> = {
  linear: { stroke: '#64748b', strokeWidth: 2, animated: false },
  choice: { stroke: '#8b5cf6', strokeWidth: 2, animated: true },
  convergence: { stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '4,4', animated: false },
  sceneJump: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5', animated: true }
};

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

  const styles: ResolvedEdgeStyles = {
    linear: theme?.edges.linear || DEFAULT_EDGE_STYLES.linear,
    choice: theme?.edges.choice || DEFAULT_EDGE_STYLES.choice,
    convergence: theme?.edges.convergence || DEFAULT_EDGE_STYLES.convergence,
    sceneJump: theme?.edges.sceneJump || DEFAULT_EDGE_STYLES.sceneJump
  };

  const edgeType = theme?.shapes?.edgeType || 'step';
  const themeId = theme?.id ?? '';

  // Category → edge type overrides resolved from the registry
  const typeOverrides: Partial<Record<EdgeCategory, string>> | undefined = themeId
    ? {
        convergence: getEdgeTypeForCategory(themeId, 'convergence', edgeType),
        choice: getEdgeTypeForCategory(themeId, 'choice', edgeType),
      }
    : undefined;

  // Does the theme provide a custom convergence edge (with its own label + fan routing)?
  const hasCustomConvergence = typeOverrides?.convergence !== undefined
    && typeOverrides.convergence !== edgeType;

  /** Helper: push an edge using the factory */
  const pushEdge = (
    id: string,
    source: string,
    sourceHandle: string,
    target: string,
    category: EdgeCategory,
    label?: string,
    data?: Record<string, unknown>
  ) => {
    edges.push(createEdge(
      { id, source, sourceHandle, target, targetHandle: HANDLE_ID.LEFT, category, label, data },
      styles,
      edgeType,
      typeOverrides
    ));
  };

  dialogues.forEach((dialogue, index) => {
    const sourceId = dialogueNodeId(sceneId, index);
    const hasChoices = dialogue.choices && dialogue.choices.length > 0;

    // Convergence edge: dialogue has explicit nextDialogueId
    if (dialogue.nextDialogueId) {
      const targetIdx = dialogueIdToIndex.get(dialogue.nextDialogueId!) ?? -1;
      if (targetIdx !== -1) {
        const convergenceLabel = hasCustomConvergence ? undefined : '↩ rejoint';
        pushEdge(
          `${sourceId}-converge-to-${sceneId}-d-${targetIdx}`,
          sourceId, HANDLE_ID.RIGHT,
          dialogueNodeId(sceneId, targetIdx),
          'convergence', convergenceLabel,
          { isConvergence: true }
        );
      }
    }
    // Response convergence: if dialogue is a response, find next non-response
    else if (dialogue.isResponse) {
      for (let targetIdx = index + 1; targetIdx < dialogues.length; targetIdx++) {
        if (!dialogues[targetIdx].isResponse) {
          const convergenceLabel = hasCustomConvergence ? undefined : '↩ rejoint';
          pushEdge(
            `${sourceId}-response-converge-to-${sceneId}-d-${targetIdx}`,
            sourceId, HANDLE_ID.RIGHT,
            dialogueNodeId(sceneId, targetIdx),
            'convergence', convergenceLabel,
            { isConvergence: true }
          );
          break;
        }
      }
    }
    // Linear edge: dialogue → next dialogue
    else if (!hasChoices && index < dialogues.length - 1) {
      pushEdge(
        `${sourceId}-to-${sceneId}-d-${index + 1}`,
        sourceId, HANDLE_ID.RIGHT,
        dialogueNodeId(sceneId, index + 1),
        'linear'
      );
    }

    // Choice edges
    if (hasChoices) {
      dialogue.choices.forEach((choice, choiceIdx) => {
        if (choice.nextDialogueId) {
          const targetIdx = dialogueIdToIndex.get(choice.nextDialogueId!) ?? -1;
          if (targetIdx !== -1) {
            const targetId = dialogueNodeId(sceneId, targetIdx);
            const edgeLabel = truncateEdgeLabel(choice.text, `Choice ${choiceIdx + 1}`);
            pushEdge(
              `${sourceId}-choice-${choiceIdx}-to-${targetId}`,
              sourceId, choiceHandleId(choiceIdx),
              targetId,
              'choice', edgeLabel,
              { label: edgeLabel }
            );
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

          const terminalLabel = truncateEdgeLabel(choice.text, 'Jump to scene');
          pushEdge(
            `${sourceId}-choice-${choiceIdx}-to-terminal`,
            sourceId, choiceHandleId(choiceIdx),
            terminalId,
            'sceneJump', terminalLabel,
            { label: terminalLabel }
          );
        }
      });
    }
  });

  // ── Post-process: assign parallel fan indices to convergence edges ────────
  if (hasCustomConvergence) {
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
