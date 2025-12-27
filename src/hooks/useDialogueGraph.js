import { useMemo } from 'react';
import dagre from 'dagre';

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
 * @param {Array} dialogues - Array of dialogue objects from scene
 * @param {string} sceneId - Scene ID for unique node IDs
 * @param {Object} validation - Optional validation object with issues
 * @returns {Object} {nodes, edges} for ReactFlow
 */
export function useDialogueGraph(dialogues = [], sceneId = '', validation = null) {
  return useMemo(() => {
    if (!dialogues || dialogues.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Step 1: Transform dialogues to nodes
    const nodes = dialogues.map((dialogue, index) => {
      const hasChoices = dialogue.choices && dialogue.choices.length > 0;
      const nodeType = hasChoices ? 'choiceNode' : 'dialogueNode';

      return {
        id: `${sceneId}-d-${index}`,
        type: nodeType,
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        data: {
          dialogue,
          index,
          speaker: dialogue.speaker || 'narrator',
          text: dialogue.text || '',
          speakerMood: dialogue.speakerMood || 'neutral',
          choices: dialogue.choices || [],
          // Enrich with validation issues if available
          issues: validation?.errors?.dialogues?.[dialogue.id] || []
        }
      };
    });

    // Step 2: Create edges
    const edges = [];

    dialogues.forEach((dialogue, index) => {
      const sourceId = `${sceneId}-d-${index}`;
      const hasChoices = dialogue.choices && dialogue.choices.length > 0;

      // Linear edge: dialogue → next dialogue (if no choices)
      if (!hasChoices && index < dialogues.length - 1) {
        edges.push({
          id: `${sourceId}-to-${sceneId}-d-${index + 1}`,
          source: sourceId,
          target: `${sceneId}-d-${index + 1}`,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#64748b', strokeWidth: 2 }
        });
      }

      // Choice edges: dialogue → target dialogue (from choice.nextDialogue)
      if (hasChoices) {
        dialogue.choices.forEach((choice, choiceIdx) => {
          if (choice.nextDialogue) {
            // Find target dialogue by ID
            const targetIdx = dialogues.findIndex(d => d.id === choice.nextDialogue);

            if (targetIdx !== -1) {
              const targetId = `${sceneId}-d-${targetIdx}`;
              const edgeLabel = choice.text ? choice.text.substring(0, 20) + (choice.text.length > 20 ? '...' : '') : `Choice ${choiceIdx + 1}`;

              edges.push({
                id: `${sourceId}-choice-${choiceIdx}-to-${targetId}`,
                source: sourceId,
                target: targetId,
                type: 'smoothstep',
                animated: true,
                label: edgeLabel,
                style: { stroke: '#8b5cf6', strokeWidth: 2 },
                labelStyle: { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 },
                labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 }
              });
            }
          }

          // Scene jump edge (nextScene)
          if (choice.nextScene) {
            // For scene jumps, create a special terminal node
            const terminalId = `${sourceId}-terminal-${choiceIdx}`;

            // Add terminal node
            nodes.push({
              id: terminalId,
              type: 'terminalNode',
              position: { x: 0, y: 0 },
              data: {
                sceneId: choice.nextScene,
                label: `→ Scene: ${choice.nextScene}`,
                choiceText: choice.text
              }
            });

            // Add edge to terminal
            edges.push({
              id: `${sourceId}-choice-${choiceIdx}-to-terminal`,
              source: sourceId,
              target: terminalId,
              type: 'smoothstep',
              animated: true,
              label: choice.text?.substring(0, 20) + '...' || 'Jump to scene',
              style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
              labelStyle: { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 },
              labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 }
            });
          }
        });
      }
    });

    // Step 3: Calculate layout with dagre
    const layoutedNodes = calculateLayoutWithDagre(nodes, edges);

    return {
      nodes: layoutedNodes,
      edges
    };
  }, [dialogues, sceneId, validation]);
}

/**
 * Calculate auto-layout positions using dagre algorithm
 *
 * @param {Array} nodes - ReactFlow nodes (without positions)
 * @param {Array} edges - ReactFlow edges
 * @returns {Array} Nodes with calculated positions
 */
function calculateLayoutWithDagre(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();

  // Configure graph layout
  dagreGraph.setGraph({
    rankdir: 'TB', // Top to Bottom
    nodesep: 120,  // Horizontal spacing between nodes
    ranksep: 180,  // Vertical spacing between ranks
    marginx: 50,
    marginy: 50
  });

  // Set default edge config
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Add nodes to dagre graph
  nodes.forEach(node => {
    // Node dimensions
    const width = node.type === 'terminalNode' ? 200 : 320;
    const height = node.type === 'terminalNode' ? 60 : 140;

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
 * @param {string} nodeType - Type of node (dialogueNode, choiceNode, terminalNode)
 * @param {Array} issues - Validation issues array
 * @returns {Object} Color theme for node
 */
export function getNodeColorTheme(nodeType, issues = []) {
  const hasErrors = issues.some(issue => issue.severity === 'error');
  const hasWarnings = issues.some(issue => issue.severity === 'warning');

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
