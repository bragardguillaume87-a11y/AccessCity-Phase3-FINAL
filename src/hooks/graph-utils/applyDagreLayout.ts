import dagre from 'dagre';
import type { Edge } from '@xyflow/react';
import type { GraphTheme } from '@/config/graphThemes/types';
import { DAGRE_LAYOUT } from '@/config/layoutConfig';
import type { GraphNode } from './types';

/**
 * Calculate auto-layout positions using dagre algorithm
 *
 * @param nodes - ReactFlow nodes (without positions)
 * @param edges - ReactFlow edges
 * @param layoutDirection - 'TB' (vertical) or 'LR' (horizontal)
 * @param theme - Optional theme for dynamic node sizes
 * @returns Nodes with calculated positions
 */
export function applyDagreLayout(
  nodes: GraphNode[],
  edges: Edge[],
  layoutDirection: 'TB' | 'LR' = 'TB',
  theme?: GraphTheme
): GraphNode[] {
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setGraph({
    rankdir: layoutDirection,
    nodesep: DAGRE_LAYOUT[layoutDirection].nodesep,
    ranksep: DAGRE_LAYOUT[layoutDirection].ranksep,
    marginx: DAGRE_LAYOUT.marginx,
    marginy: DAGRE_LAYOUT.marginy
  });

  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const defaultNodeWidth = theme?.sizes.nodeWidth ?? 320;
  const defaultNodeHeight = theme?.sizes.nodeMinHeight ?? 140;

  nodes.forEach(node => {
    const width = node.type === 'terminalNode' ? 200 : defaultNodeWidth;
    const height = node.type === 'terminalNode' ? 60 : defaultNodeHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

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
