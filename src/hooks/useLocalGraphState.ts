import { useCallback, useEffect, useState, useRef } from 'react';
import {
  Node,
  Edge,
  NodeChange,
  applyNodeChanges,
  reconnectEdge,
  Connection,
} from '@xyflow/react';
import type { GraphNode } from './graph-utils/types';

/**
 * Return type of useLocalGraphState hook
 */
interface UseLocalGraphStateReturn {
  localNodes: GraphNode[];
  localEdges: Edge[];
  onNodesChange: (changes: NodeChange<GraphNode>[]) => void;
  onNodeDragStop: (event: React.MouseEvent, node: Node, nodes: Node[]) => void;
  reconnectLocalEdge: (oldEdge: Edge, newConnection: Connection) => void;
}

/**
 * useLocalGraphState — Manages local node/edge state for ReactFlow
 *
 * Encapsulates:
 * - Local nodes state (synced from Dagre on initial render + dialogues count change)
 * - Local edges state (always synced from Dagre) + ref to avoid stale closures
 * - onNodesChange handler (drag/select)
 * - onNodeDragStop handler (serpentine edge recalculation)
 * - reconnectLocalEdge helper (edge drag-to-reconnect)
 */
export function useLocalGraphState(
  dagreNodes: GraphNode[],
  edges: Edge[],
  dialoguesLength: number,
  serpentineEnabled: boolean,
  editMode: boolean,
  recalculateEdges: (nodes: Node[], edges: Edge[]) => Edge[],
): UseLocalGraphStateReturn {
  // Local state for node positions (enables manual dragging)
  const [localNodes, setLocalNodes] = useState<GraphNode[]>(dagreNodes);

  // Local state for edges + ref to avoid stale closure race condition
  const [localEdges, setLocalEdges] = useState<Edge[]>(edges);
  const localEdgesRef = useRef<Edge[]>(edges);

  const isInitialRender = useRef(true);
  const prevDialoguesLength = useRef(dialoguesLength);

  // Sync local nodes with Dagre on initial render + dialogues count change
  useEffect(() => {
    const dialoguesChanged = prevDialoguesLength.current !== dialoguesLength;

    if (isInitialRender.current || dialoguesChanged) {
      setLocalNodes(dagreNodes);
      isInitialRender.current = false;
      prevDialoguesLength.current = dialoguesLength;
    }
  }, [dagreNodes, dialoguesLength]);

  // Always sync edges from Dagre (edges don't have user-draggable positions)
  useEffect(() => {
    setLocalEdges(edges);
    localEdgesRef.current = edges;
  }, [edges]);

  // Handle node changes (position, selection) for manual dragging
  const onNodesChange = useCallback((changes: NodeChange<GraphNode>[]) => {
    setLocalNodes((nds) => applyNodeChanges(changes, nds) as GraphNode[]);
  }, []);

  // Handle node drag stop — recalculate serpentine edge handles
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: Node, nodes: Node[]) => {
      if (serpentineEnabled && editMode) {
        const updatedEdges = recalculateEdges(nodes as Node[], localEdgesRef.current);
        setLocalEdges(updatedEdges);
        localEdgesRef.current = updatedEdges;
      }
    },
    [serpentineEnabled, editMode, recalculateEdges]
  );

  // Helper for drag-to-reconnect on existing edges
  const reconnectLocalEdge = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setLocalEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      localEdgesRef.current = reconnectEdge(oldEdge, newConnection, localEdgesRef.current);
    },
    []
  );

  return { localNodes, localEdges, onNodesChange, onNodeDragStop, reconnectLocalEdge };
}
