import { useMemo } from 'react';
import type { Edge } from '@xyflow/react';
import type { Dialogue, ValidationProblem, NodeColorTheme, ClusterNodeData } from '@/types';
import { DEFAULTS } from '@/config/constants';
import { NODE_COLORS } from '@/config/colors';
import type { GraphTheme } from '@/config/graphThemes/types';
import { useUIStore } from '@/stores/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { dialogueNodeId } from '@/config/handleConfig';
import type { GraphNode } from './graph-utils/types';
import { buildGraphEdges } from './graph-utils/buildGraphEdges';
import { applyDagreLayout } from './graph-utils/applyDagreLayout';
import { applySerpentineLayout, applySerpentineEdgeRouting } from './graph-utils/applySerpentineLayout';

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
  const {
    serpentineEnabled, serpentineMode, serpentineDirection, serpentineGroupSize,
    proModeEnabled, proCollapseEnabled, proExpandedClusters,
    proPaginationEnabled, proPageSize, proCurrentPage,
  } = useUIStore(
    useShallow((state) => ({
      serpentineEnabled: state.serpentineEnabled,
      serpentineMode: state.serpentineMode,
      serpentineDirection: state.serpentineDirection,
      serpentineGroupSize: state.serpentineGroupSize,
      proModeEnabled: state.proModeEnabled,
      proCollapseEnabled: state.proCollapseEnabled,
      proExpandedClusters: state.proExpandedClusters,
      proPaginationEnabled: state.proPaginationEnabled,
      proPageSize: state.proPageSize,
      proCurrentPage: state.proCurrentPage,
    }))
  );

  return useMemo(() => {
    if (!dialogues || dialogues.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Step 0: Pagination — slice dialogues if Pro mode + pagination enabled
    // Pagination works on the dialogue array BEFORE node construction.
    // We keep the original indices for display (data.index) but use local indices for IDs
    // so buildGraphEdges (which iterates the same array) produces matching source/target IDs.
    const shouldPaginate = proModeEnabled && proPaginationEnabled && dialogues.length > proPageSize;
    const pageStart = shouldPaginate ? proCurrentPage * proPageSize : 0;
    const pageDialogues = shouldPaginate
      ? dialogues.slice(pageStart, pageStart + proPageSize)
      : dialogues;

    // Step 1: Transform dialogues to nodes
    const allNodes: GraphNode[] = pageDialogues.map((dialogue, index) => {
      const hasChoices = dialogue.choices && dialogue.choices.length > 0;
      const displayIndex = pageStart + index; // original index for display in node badge
      return {
        id: dialogueNodeId(sceneId, index),
        type: hasChoices ? 'choiceNode' : 'dialogueNode',
        position: { x: 0, y: 0 },
        data: {
          dialogue,
          index: displayIndex,
          speaker: dialogue.speaker || DEFAULTS.DIALOGUE_SPEAKER,
          text: dialogue.text || '',
          speakerMood: dialogue.speakerMood || 'neutral',
          stageDirections: dialogue.stageDirections || '',
          choices: dialogue.choices || [],
          issues: validation?.errors?.dialogues?.[dialogue.id] || []
        }
      };
    });

    // Step 1b: Pro mode cluster collapse — replace choice+response groups with ClusterNodes
    const shouldCollapse = proModeEnabled && proCollapseEnabled;
    const collapseResult = shouldCollapse
      ? collapseChoiceClusters(allNodes, pageDialogues, sceneId, proExpandedClusters)
      : { nodes: allNodes, collapsedNodeIds: new Set<string>(), nodeToCluster: new Map<string, string>() };
    const nodes = collapseResult.nodes;

    // Step 2: Build edges from page dialogues (terminal nodes pushed into allNodes)
    let edges = buildGraphEdges(pageDialogues, sceneId, allNodes, theme);

    // Step 2b: Reroute edges to cluster nodes, remove internal cluster edges
    if (collapseResult.collapsedNodeIds.size > 0) {
      const { collapsedNodeIds, nodeToCluster } = collapseResult;
      edges = edges.reduce<Edge[]>((acc, edge) => {
        const srcCollapsed = collapsedNodeIds.has(edge.source);
        const tgtCollapsed = collapsedNodeIds.has(edge.target);

        if (srcCollapsed && tgtCollapsed) {
          // Both inside same or different clusters — check if same cluster
          const srcCluster = nodeToCluster.get(edge.source);
          const tgtCluster = nodeToCluster.get(edge.target);
          if (srcCluster === tgtCluster) return acc; // internal edge, drop
          // Cross-cluster: reroute both ends
          acc.push({ ...edge, source: srcCluster!, target: tgtCluster!, id: `${edge.id}-rerouted` });
        } else if (srcCollapsed) {
          // Source collapsed: reroute source to cluster
          const clusterId = nodeToCluster.get(edge.source)!;
          acc.push({ ...edge, source: clusterId, id: `${edge.id}-rerouted` });
        } else if (tgtCollapsed) {
          // Target collapsed: reroute target to cluster
          const clusterId = nodeToCluster.get(edge.target)!;
          acc.push({ ...edge, target: clusterId, id: `${edge.id}-rerouted` });
        } else {
          acc.push(edge);
        }
        return acc;
      }, []);
      // Deduplicate rerouted edges (multiple edges can converge to same cluster)
      const seen = new Set<string>();
      edges = edges.filter(e => {
        const key = `${e.source}→${e.target}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Step 3: Apply dagre layout
    let layoutedNodes = applyDagreLayout(nodes, edges, layoutDirection, theme);
    let layoutedEdges = edges;

    // Step 4: Apply serpentine if enabled (LR mode only)
    if (layoutDirection === 'LR' && serpentineEnabled) {
      layoutedNodes = applySerpentineLayout(layoutedNodes, serpentineMode, serpentineGroupSize, serpentineDirection);
      layoutedEdges = applySerpentineEdgeRouting(layoutedEdges, layoutedNodes);
      // Turn connector edges removed: row separators ("Ligne N") + SUITE indicator
      // already communicate row transitions clearly. The dashed diagonal lines
      // added visual clutter without additional value for children 8+.
    }

    return { nodes: layoutedNodes, edges: layoutedEdges };
  }, [dialogues, sceneId, validation, layoutDirection, theme, serpentineEnabled, serpentineMode, serpentineDirection, serpentineGroupSize, proModeEnabled, proCollapseEnabled, proExpandedClusters, proPaginationEnabled, proPageSize, proCurrentPage]);
}

/**
 * Collapse choice+response clusters into synthetic ClusterNodes.
 *
 * A cluster is a choice dialogue followed by consecutive isResponse dialogues.
 * Collapsed clusters are replaced by a single compact ClusterNode.
 * Expanded clusters (listed in expandedClusters) are left untouched.
 *
 * @returns The filtered node list + set of collapsed IDs + map from collapsed node ID to cluster ID
 */
function collapseChoiceClusters(
  nodes: GraphNode[],
  dialogues: Dialogue[],
  sceneId: string,
  expandedClusters: string[],
): { nodes: GraphNode[]; collapsedNodeIds: Set<string>; nodeToCluster: Map<string, string> } {
  const expandedSet = new Set(expandedClusters);
  const result: GraphNode[] = [];
  const collapsedNodeIds = new Set<string>();
  const nodeToCluster = new Map<string, string>();
  let i = 0;

  while (i < dialogues.length) {
    const dialogue = dialogues[i];
    const hasChoices = dialogue.choices && dialogue.choices.length > 0;

    if (hasChoices) {
      // Collect consecutive isResponse dialogues after this choice
      const clusterIndices = [i];
      let j = i + 1;
      while (j < dialogues.length && dialogues[j].isResponse) {
        clusterIndices.push(j);
        j++;
      }

      const responseCount = clusterIndices.length - 1; // exclude the choice itself
      const clusterId = `cluster-${i}`;

      if (responseCount > 0 && !expandedSet.has(clusterId)) {
        // Collapse: replace N nodes with 1 ClusterNode
        for (const idx of clusterIndices) {
          const nodeId = dialogueNodeId(sceneId, idx);
          collapsedNodeIds.add(nodeId);
          nodeToCluster.set(nodeId, clusterId);
        }

        const choicePreview = dialogue.choices!.length > 0
          ? dialogue.choices!.slice(0, 2).map(c => c.text || '...').join(' / ')
          : 'Choix';

        result.push({
          id: clusterId,
          type: 'clusterNode',
          position: { x: 0, y: 0 },
          data: {
            clusterId,
            speaker: dialogue.speaker || 'Joueur',
            responseCount,
            choicePreview: choicePreview.length > 40 ? choicePreview.slice(0, 37) + '...' : choicePreview,
            containedIndices: clusterIndices,
          } as ClusterNodeData,
        } as GraphNode);

        i = j;
      } else {
        // Expanded or no responses: keep original nodes
        result.push(nodes[i]);
        i++;
      }
    } else {
      result.push(nodes[i]);
      i++;
    }
  }

  return { nodes: result, collapsedNodeIds, nodeToCluster };
}

/**
 * Get node color based on type and validation issues
 *
 * Note: In BaseNode, the node-type colors are overridden by theme colors.
 * Only error/warning colors from this function are actually displayed.
 */
export function getNodeColorTheme(nodeType: string, issues: ValidationProblem[] = []): NodeColorTheme {
  const hasErrors = issues.some(issue => issue.type === 'error');
  const hasWarnings = issues.some(issue => issue.type === 'warning');

  if (hasErrors) return NODE_COLORS.error;
  if (hasWarnings) return NODE_COLORS.warning;

  switch (nodeType) {
    case 'choiceNode':
      return NODE_COLORS.choiceNode;
    case 'terminalNode':
      return NODE_COLORS.terminalNode;
    case 'dialogueNode':
    default:
      return NODE_COLORS.dialogueNode;
  }
}
