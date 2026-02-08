import { useMemo } from 'react';
import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Dialogue, ValidationProblem, DialogueNodeData, TerminalNodeData, NodeColorTheme, SerpentineNodeData } from '@/types';
import { DEFAULTS } from '@/config/constants';
import type { GraphTheme } from '@/config/graphThemes/types';
import { useUIStore } from '@/stores/uiStore';
import { HANDLE_ID, choiceHandleId, buildNodeRowMap, getSerpentineHandles, dialogueNodeId } from '@/config/handleConfig';

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
  // SERP-5: Read serpentine configuration from uiStore
  const serpentineEnabled = useUIStore((state) => state.serpentineEnabled);
  const serpentineMode = useUIStore((state) => state.serpentineMode);
  const serpentineGroupSize = useUIStore((state) => state.serpentineGroupSize);

  return useMemo(() => {
    if (!dialogues || dialogues.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Step 1: Transform dialogues to nodes
    const nodes: GraphNode[] = dialogues.map((dialogue, index) => {
      const hasChoices = dialogue.choices && dialogue.choices.length > 0;
      const nodeType = hasChoices ? 'choiceNode' : 'dialogueNode';

      return {
        id: dialogueNodeId(sceneId, index),
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
      const sourceId = dialogueNodeId(sceneId, index);
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
            sourceHandle: HANDLE_ID.RIGHT,
            target: dialogueNodeId(sceneId, targetIdx),
            targetHandle: HANDLE_ID.LEFT,
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
              sourceHandle: HANDLE_ID.RIGHT,
              target: dialogueNodeId(sceneId, targetIdx),
              targetHandle: HANDLE_ID.LEFT,
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

      // Choice edges: dialogue → target dialogue (from choice.nextDialogue)
      if (hasChoices) {
        dialogue.choices.forEach((choice, choiceIdx) => {
          if (choice.nextDialogueId) {
            // Find target dialogue by ID
            const targetIdx = dialogues.findIndex(d => d.id === choice.nextDialogueId);

            if (targetIdx !== -1) {
              const targetId = dialogueNodeId(sceneId, targetIdx);
              const edgeLabel = choice.text ? choice.text.substring(0, 20) + (choice.text.length > 20 ? '...' : '') : `Choice ${choiceIdx + 1}`;

              edges.push({
                id: `${sourceId}-choice-${choiceIdx}-to-${targetId}`,
                source: sourceId,
                sourceHandle: choiceHandleId(choiceIdx),
                target: targetId,
                targetHandle: HANDLE_ID.LEFT,
                type: theme.id === 'cosmos' ? 'cosmosChoice' : edgeType, // PHASE 10: Custom edge for cosmos
                animated: edgeStyles.choice.animated,
                label: edgeLabel,
                data: { label: edgeLabel }, // PHASE 10: Pass label to custom edge
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
            const terminalLabel = choice.text?.substring(0, 20) + '...' || 'Jump to scene';
            edges.push({
              id: `${sourceId}-choice-${choiceIdx}-to-terminal`,
              source: sourceId,
              sourceHandle: choiceHandleId(choiceIdx),
              target: terminalId,
              targetHandle: HANDLE_ID.LEFT,
              type: theme.id === 'cosmos' ? 'cosmosChoice' : edgeType, // PHASE 10: Custom edge for cosmos
              animated: edgeStyles.sceneJump.animated,
              label: terminalLabel,
              data: { label: terminalLabel }, // PHASE 10: Pass label to custom edge
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
    let layoutedNodes = calculateLayoutWithDagre(nodes, edges, layoutDirection, theme);
    let layoutedEdges = edges;

    // SERP-5: Apply serpentine layout if enabled in uiStore
    // Only apply in LR (horizontal) mode for best results
    const canApplySerpentine = layoutDirection === 'LR' && serpentineEnabled;

    if (canApplySerpentine) {
      // SERP-4: Apply serpentine node positioning
      layoutedNodes = applySerpentineLayout(layoutedNodes, serpentineMode, serpentineGroupSize);
      // SERP-3: Update edge handles for serpentine routing (4-directional)
      layoutedEdges = applySerpentineEdgeRouting(layoutedEdges, layoutedNodes, serpentineMode, serpentineGroupSize);
    }

    return {
      nodes: layoutedNodes,
      edges: layoutedEdges
    };
  }, [dialogues, sceneId, validation, layoutDirection, theme, serpentineEnabled, serpentineMode, serpentineGroupSize]);
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
    nodesep: layoutDirection === 'TB' ? 100 : 160,   // SERP-9: More breathing room between nodes
    ranksep: layoutDirection === 'TB' ? 260 : 220,  // SERP-9: More vertical spacing
    marginx: 60,
    marginy: 60
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
 * SERP-7 FIX: Apply serpentine (S-shaped) layout transformation
 *
 * Takes nodes positioned by Dagre in a left-to-right flow and transforms them
 * into a serpentine pattern with REAL row separation:
 *
 * BEFORE (Dagre LR):  [1]─[2]─[3]─[4]─[5]─[6]─[7]─[8]  (all same Y)
 *
 * AFTER (Serpentine):
 *   [1]─[2]─[3]─[4]
 *               ↓
 *   [8]─[7]─[6]─[5]
 *
 * @param nodes - Nodes with Dagre-calculated positions
 * @param mode - Layout mode: 'auto-y' (detect existing rows) or 'by-count' (force grouping)
 * @param groupSize - For 'by-count' mode: number of nodes per row
 * @returns Nodes with serpentine-adjusted positions (new X and Y)
 */
function applySerpentineLayout(
  nodes: GraphNode[],
  mode: 'auto-y' | 'by-scene' | 'by-count' = 'auto-y',
  groupSize: number = 6
): GraphNode[] {
  if (nodes.length === 0) return nodes;

  // Constants for layout - SERP-9: Increased for better readability (children 8+)
  const ROW_HEIGHT = 400; // Vertical spacing between rows (was 250)
  const NODE_SPACING = 600; // Horizontal spacing between nodes in a row (was 400)
  const START_X = 50; // Starting X position
  const START_Y = 50; // Starting Y position

  // Group nodes into rows based on selected mode
  let rows: GraphNode[][] = [];

  if (mode === 'auto-y') {
    // Mode 1: Automatic row detection by Y position
    // If all nodes are on same Y (LR layout), fall back to by-count with default groupSize
    const yThreshold = 100;
    const sortedByY = [...nodes].sort((a, b) => a.position.y - b.position.y);

    // Check if all nodes are on approximately the same Y (typical LR layout)
    const minY = sortedByY[0].position.y;
    const maxY = sortedByY[sortedByY.length - 1].position.y;
    const allSameRow = (maxY - minY) < yThreshold;

    if (allSameRow) {
      // All nodes on same row - use by-count logic instead
      const sortedByX = [...nodes].sort((a, b) => a.position.x - b.position.x);
      for (let i = 0; i < sortedByX.length; i += groupSize) {
        rows.push(sortedByX.slice(i, i + groupSize));
      }
    } else {
      // Existing rows detected - group by Y position
      let currentRow: GraphNode[] = [sortedByY[0]];
      let currentY = sortedByY[0].position.y;

      for (let i = 1; i < sortedByY.length; i++) {
        const node = sortedByY[i];
        if (Math.abs(node.position.y - currentY) < yThreshold) {
          currentRow.push(node);
        } else {
          rows.push(currentRow);
          currentRow = [node];
          currentY = node.position.y;
        }
      }
      rows.push(currentRow);
    }

  } else if (mode === 'by-scene') {
    // Mode 2: Group by scene (extract scene from node ID: "scene1-d-0")
    const sceneGroups = new Map<string, GraphNode[]>();
    nodes.forEach(node => {
      const sceneId = node.id.split('-')[0];
      if (!sceneGroups.has(sceneId)) {
        sceneGroups.set(sceneId, []);
      }
      sceneGroups.get(sceneId)!.push(node);
    });
    rows = Array.from(sceneGroups.values());

  } else if (mode === 'by-count') {
    // Mode 3: Group every X nodes into a row
    const sortedByX = [...nodes].sort((a, b) => a.position.x - b.position.x);
    for (let i = 0; i < sortedByX.length; i += groupSize) {
      rows.push(sortedByX.slice(i, i + groupSize));
    }
  }

  // SERP-7 FIX: Apply serpentine transformation with REAL Y positioning
  const transformedNodes = new Map<string, GraphNode>();

  // Calculate max row width for proper alignment
  const maxNodesInRow = Math.max(...rows.map(r => r.length));
  const maxRowWidth = (maxNodesInRow - 1) * NODE_SPACING;

  // Calculate total number of nodes for isFirst/isLast detection
  const totalNodes = rows.reduce((sum, row) => sum + row.length, 0);
  let globalNodeIndex = 0; // Track position across all rows

  rows.forEach((row, rowIndex) => {
    // Sort row by X position (left to right)
    const sortedRow = [...row].sort((a, b) => a.position.x - b.position.x);

    // Calculate Y position for this row
    const rowY = START_Y + (rowIndex * ROW_HEIGHT);

    // Determine if this row flows left-to-right (even) or right-to-left (odd)
    const isReversedRow = rowIndex % 2 === 1;
    const flowDirection: 'ltr' | 'rtl' = isReversedRow ? 'rtl' : 'ltr';
    const rowLength = sortedRow.length;

    sortedRow.forEach((node, positionInRow) => {
      // Calculate X position based on flow direction
      let nodeX: number;
      if (isReversedRow) {
        // Odd rows: RIGHT-TO-LEFT, aligned to the RIGHT edge
        // Start from the right side and go left
        // Position 0 in sortedRow = rightmost position in display
        const rightEdgeX = START_X + maxRowWidth;
        nodeX = rightEdgeX - (positionInRow * NODE_SPACING);
      } else {
        // Even rows: left-to-right (normal position)
        nodeX = START_X + (positionInRow * NODE_SPACING);
      }

      // SERP-8: Build serpentine metadata for this node
      const serpentineData: SerpentineNodeData = {
        rowIndex,
        positionInRow,
        rowLength,
        flowDirection,
        // First node in entire flow = first node of first row
        isFirst: globalNodeIndex === 0,
        // Last node in entire flow = last node of last row
        isLast: globalNodeIndex === totalNodes - 1,
        // First in row depends on flow direction
        isFirstInRow: positionInRow === 0,
        // Last in row depends on flow direction
        isLastInRow: positionInRow === rowLength - 1,
      };

      // Create transformed node with serpentine metadata
      // We need to cast because node.data can be DialogueNodeData or TerminalNodeData
      const transformedNode = {
        ...node,
        position: {
          x: nodeX,
          y: rowY
        },
        data: {
          ...node.data,
          serpentine: serpentineData,
        } as DialogueNodeData | TerminalNodeData
      } as GraphNode;

      transformedNodes.set(node.id, transformedNode);

      globalNodeIndex++;
    });
  });

  // Return nodes in original order with updated positions
  return nodes.map(node => transformedNodes.get(node.id) || node);
}

/**
 * SERP-7 FIX: Apply serpentine edge routing
 * Uses shared buildNodeRowMap and getSerpentineHandles from handleConfig.ts
 *
 * @param edges - Original edges array
 * @param nodes - Nodes with serpentine-adjusted positions (AFTER applySerpentineLayout)
 * @returns Edges with updated handle IDs
 */
function applySerpentineEdgeRouting(
  edges: Edge[],
  nodes: GraphNode[],
  _mode?: string,
  _groupSize?: number
): Edge[] {
  if (nodes.length === 0) return edges;

  const nodeRowMap = buildNodeRowMap(nodes);

  return edges.map(edge => {
    const sourceInfo = nodeRowMap.get(edge.source);
    const targetInfo = nodeRowMap.get(edge.target);

    if (!sourceInfo || !targetInfo) return edge;

    const { sourceHandle, targetHandle } = getSerpentineHandles(
      sourceInfo.rowIndex,
      targetInfo.rowIndex,
      edge.sourceHandle
    );

    return { ...edge, sourceHandle, targetHandle };
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
