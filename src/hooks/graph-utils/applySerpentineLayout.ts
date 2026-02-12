import type { Edge, MarkerType } from '@xyflow/react';
import type { SerpentineNodeData, DialogueNodeData, TerminalNodeData } from '@/types';
import { SERPENTINE_Y_THRESHOLD, extractSceneId, recalculateSerpentineEdges, buildNodeRowMap } from '@/config/handleConfig';
import { SERPENTINE_LAYOUT } from '@/config/layoutConfig';
import type { GraphNode } from './types';

/**
 * Apply serpentine (S-shaped) layout transformation
 *
 * Takes nodes positioned by Dagre in a left-to-right flow and transforms them
 * into a serpentine pattern with real row separation:
 *
 *   [1]─[2]─[3]─[4]
 *               ↓
 *   [8]─[7]─[6]─[5]
 *
 * @param nodes - Nodes with Dagre-calculated positions
 * @param mode - Layout mode: 'auto-y' | 'by-scene' | 'by-count'
 * @param groupSize - For 'by-count' mode: number of nodes per row
 * @returns Nodes with serpentine-adjusted positions
 */
export function applySerpentineLayout(
  nodes: GraphNode[],
  mode: 'auto-y' | 'by-scene' | 'by-count' = 'auto-y',
  groupSize: number = 6
): GraphNode[] {
  if (nodes.length === 0) return nodes;

  const { ROW_HEIGHT, NODE_SPACING, START_X, START_Y } = SERPENTINE_LAYOUT;

  // Separate dialogue nodes from terminal nodes.
  // Terminal nodes are injected by buildGraphEdges (scene-jump placeholders) and must
  // NOT participate in row grouping — including them corrupts isLastInRow/isFirstInRow
  // flags and causes turn-connectors to be drawn diagonally.
  const dialogueNodes = nodes.filter(n => n.type !== 'terminalNode');
  const terminalNodes  = nodes.filter(n => n.type === 'terminalNode');

  // Group only dialogue nodes into rows
  const rows = groupNodesIntoRows(dialogueNodes, mode, groupSize);

  // Apply serpentine transformation to dialogue nodes only
  const transformedNodes = new Map<string, GraphNode>();
  const maxNodesInRow = Math.max(...rows.map(r => r.length));
  const maxRowWidth = (maxNodesInRow - 1) * NODE_SPACING;
  const totalNodes = rows.reduce((sum, row) => sum + row.length, 0);
  let globalNodeIndex = 0;

  rows.forEach((row, rowIndex) => {
    // Always sort by narrative index — Dagre X is unreliable for branching structures.
    // groupNodesIntoRows already sorts ascending; we sort again here to guarantee it
    // regardless of mode, and to avoid the old position.x sort which broke RTL rows.
    const sortedRow = sortByDialogueIndex(row);
    const rowY = START_Y + (rowIndex * ROW_HEIGHT);
    const isReversedRow = rowIndex % 2 === 1;
    const flowDirection: 'ltr' | 'rtl' = isReversedRow ? 'rtl' : 'ltr';
    const rowLength = sortedRow.length;

    sortedRow.forEach((node, positionInRow) => {
      let nodeX: number;
      if (isReversedRow) {
        const rightEdgeX = START_X + maxRowWidth;
        nodeX = rightEdgeX - (positionInRow * NODE_SPACING);
      } else {
        nodeX = START_X + (positionInRow * NODE_SPACING);
      }

      const serpentineData: SerpentineNodeData = {
        rowIndex,
        positionInRow,
        rowLength,
        flowDirection,
        isFirst: globalNodeIndex === 0,
        isLast: globalNodeIndex === totalNodes - 1,
        isFirstInRow: positionInRow === 0,
        isLastInRow: positionInRow === rowLength - 1,
      };

      const transformedNode = {
        ...node,
        position: { x: nodeX, y: rowY },
        data: {
          ...node.data,
          serpentine: serpentineData,
        } as DialogueNodeData | TerminalNodeData
      } as GraphNode;

      transformedNodes.set(node.id, transformedNode);
      globalNodeIndex++;
    });
  });

  // Re-anchor terminal nodes next to their transformed source node.
  // Terminal IDs follow the pattern "<sourceNodeId>-terminal-<choiceIdx>".
  // After serpentine repositions the source, we place the terminal below-right so
  // the connecting edge stays short and readable.
  const NODE_WIDTH_APPROX = 200;
  const terminalTransformed = terminalNodes.map(terminal => {
    const sourceId = terminal.id.replace(/-terminal-\d+$/, '');
    const sourceNode = transformedNodes.get(sourceId);
    if (!sourceNode) return terminal; // fallback: keep Dagre position
    const terminalIndex = parseInt(terminal.id.split('-terminal-').pop() ?? '0', 10);
    return {
      ...terminal,
      position: {
        // Place terminal below the source node so it doesn't intrude on the row
        x: sourceNode.position.x + NODE_WIDTH_APPROX / 4,
        y: sourceNode.position.y + 100 + terminalIndex * 70,
      },
    } as GraphNode;
  });

  return nodes.map(node =>
    transformedNodes.get(node.id) ??
    terminalTransformed.find(t => t.id === node.id) ??
    node
  );
}

/**
 * Sort nodes by their narrative dialogue index.
 *
 * Dagre positions (X/Y) are unreliable for branching structures: choice nodes
 * create multiple branches at the same X, and Y varies by depth.
 * The `data.index` field reflects the author's intended reading order and is
 * always correct regardless of graph topology.
 */
function sortByDialogueIndex(nodes: GraphNode[]): GraphNode[] {
  return [...nodes].sort(
    (a, b) =>
      ((a.data as DialogueNodeData).index ?? 0) -
      ((b.data as DialogueNodeData).index ?? 0)
  );
}

/**
 * Group nodes into rows based on the selected mode
 */
function groupNodesIntoRows(
  nodes: GraphNode[],
  mode: 'auto-y' | 'by-scene' | 'by-count',
  groupSize: number
): GraphNode[][] {
  const rows: GraphNode[][] = [];

  if (mode === 'auto-y') {
    const yThreshold = SERPENTINE_Y_THRESHOLD;
    const sortedByY = [...nodes].sort((a, b) => a.position.y - b.position.y);
    const minY = sortedByY[0].position.y;
    const maxY = sortedByY[sortedByY.length - 1].position.y;
    const allSameRow = (maxY - minY) < yThreshold;

    if (allSameRow) {
      // All nodes at same Y: chunk by groupSize using narrative order
      const ordered = sortByDialogueIndex(nodes);
      for (let i = 0; i < ordered.length; i += groupSize) {
        rows.push(ordered.slice(i, i + groupSize));
      }
    } else {
      // Multiple Y levels from Dagre: group by Y proximity, sort each row by index
      let currentRow: GraphNode[] = [sortedByY[0]];
      let currentY = sortedByY[0].position.y;

      for (let i = 1; i < sortedByY.length; i++) {
        const node = sortedByY[i];
        if (Math.abs(node.position.y - currentY) < yThreshold) {
          currentRow.push(node);
        } else {
          rows.push(sortByDialogueIndex(currentRow));
          currentRow = [node];
          currentY = node.position.y;
        }
      }
      rows.push(sortByDialogueIndex(currentRow));
    }
  } else if (mode === 'by-scene') {
    const sceneGroups = new Map<string, GraphNode[]>();
    nodes.forEach(node => {
      const sceneId = extractSceneId(node.id);
      if (!sceneGroups.has(sceneId)) {
        sceneGroups.set(sceneId, []);
      }
      sceneGroups.get(sceneId)!.push(node);
    });
    rows.push(...Array.from(sceneGroups.values()));
  } else if (mode === 'by-count') {
    // Sort by narrative index — reliable for any graph topology
    const ordered = sortByDialogueIndex(nodes);
    for (let i = 0; i < ordered.length; i += groupSize) {
      rows.push(ordered.slice(i, i + groupSize));
    }
  }

  return rows;
}

/**
 * Apply serpentine edge routing using shared handle config
 *
 * @param edges - Original edges
 * @param nodes - Nodes with serpentine positions
 * @returns Edges with updated handle IDs for serpentine flow
 */
export function applySerpentineEdgeRouting(
  edges: Edge[],
  nodes: GraphNode[]
): Edge[] {
  // Exclude terminal nodes: they sit between rows (y = sourceRow.y + 100) and
  // would create phantom intermediate rows in buildNodeRowMap, corrupting the
  // row-index comparison inside getSerpentineHandles → diagonal convergence arrows.
  const dialogueNodesOnly = nodes.filter(n => n.type !== 'terminalNode');
  const routedEdges = recalculateSerpentineEdges(dialogueNodesOnly, edges);

  // Fix cross-row edge types: 'straight' draws a diagonal line between
  // BOTTOM and TOP handles when source/target are at different X positions.
  // 'smoothstep' routes via right-angle segments, keeping the path clean.
  const rowMap = buildNodeRowMap(dialogueNodesOnly);
  return routedEdges.map(edge => {
    if (edge.type !== 'straight') return edge;
    const src = rowMap.get(edge.source);
    const tgt = rowMap.get(edge.target);
    if (src && tgt && src.rowIndex !== tgt.rowIndex) {
      return { ...edge, type: 'smoothstep' };
    }
    return edge;
  });
}

/**
 * Build visual U-turn connector edges between serpentine rows.
 *
 * When the layout turns from one row to the next, no data edge usually
 * exists between the last node of row N and the first node of row N+1
 * (they may be connected via a choice, a scene jump, or not at all).
 * This function adds a visual-only dashed connector so the reader sees
 * where the flow "turns the corner".
 *
 * Edge format: `<sourceId>-serp-turn-<targetId>` — purely decorative.
 */
export function buildSerpentineTurnEdges(nodes: GraphNode[], edges: Edge[]): Edge[] {
  // Collect only nodes that have serpentine data, sorted by dialogue index
  const serpNodes = nodes
    .filter(n => !!(n.data as DialogueNodeData).serpentine)
    .sort((a, b) => (a.data as DialogueNodeData).index - (b.data as DialogueNodeData).index);

  if (serpNodes.length < 2) return edges;

  const existingEdgeIds = new Set(edges.map(e => e.id));
  const turnEdges: Edge[] = [];

  for (let i = 0; i < serpNodes.length - 1; i++) {
    const curr = serpNodes[i];
    const next = serpNodes[i + 1];
    const currSerp = (curr.data as DialogueNodeData).serpentine!;
    const nextSerp = (next.data as DialogueNodeData).serpentine!;

    // Only add a turn edge at row boundaries (last of row N → first of row N+1)
    if (currSerp.isLastInRow && nextSerp.isFirstInRow) {
      const turnId = `${curr.id}-serp-turn-${next.id}`;
      if (!existingEdgeIds.has(turnId)) {
        turnEdges.push({
          id: turnId,
          source: curr.id,
          target: next.id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'straight',
          style: {
            stroke: '#94a3b8',
            strokeWidth: 2.5,
            strokeDasharray: '6,4',
            opacity: 0.55,
          },
          markerEnd: {
            type: 'arrowclosed' as unknown as MarkerType,
            color: '#94a3b8',
            width: 14,
            height: 14,
          },
          animated: false,
          data: { isTurnConnector: true },
        } as Edge);
      }
    }
  }

  return [...edges, ...turnEdges];
}
