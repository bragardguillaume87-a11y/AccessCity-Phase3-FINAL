import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useUIStore } from '@/stores/uiStore';
import { buildNodeRowMap, getSerpentineHandles } from '@/config/handleConfig';

/**
 * useSerpentineSync - Hook for dynamic serpentine edge handle recalculation
 *
 * Uses shared routing logic from handleConfig.ts (single source of truth).
 *
 * Problem solved:
 * - When user manually drags nodes, edge handles don't update
 * - The useMemo in useDialogueGraph only calculates on initial render
 * - This hook provides real-time edge recalculation based on current node positions
 */

/**
 * useSerpentineSync Hook
 *
 * Returns a function to recalculate edge handles based on current node positions.
 * Call this in onNodeDragStop or whenever nodes are repositioned.
 *
 * @example
 * ```tsx
 * const { recalculateEdges } = useSerpentineSync();
 *
 * const onNodeDragStop = useCallback((event, node) => {
 *   if (serpentineEnabled) {
 *     setLocalEdges(edges => recalculateEdges(localNodes, edges));
 *   }
 * }, [localNodes, serpentineEnabled, recalculateEdges]);
 * ```
 */
export function useSerpentineSync() {
  const serpentineEnabled = useUIStore((state) => state.serpentineEnabled);
  const serpentineMode = useUIStore((state) => state.serpentineMode);
  const serpentineGroupSize = useUIStore((state) => state.serpentineGroupSize);

  /**
   * Recalculate edge handles based on current node positions.
   * Uses shared buildNodeRowMap + getSerpentineHandles from handleConfig.ts.
   */
  const recalculateEdges = useCallback(
    (nodes: Node[], edges: Edge[]): Edge[] => {
      if (!serpentineEnabled || nodes.length === 0) {
        return edges;
      }

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
    },
    [serpentineEnabled]
  );

  /**
   * Check if a specific node moved between rows.
   * Useful for optimizing when to recalculate.
   */
  const didNodeChangeRow = useCallback(
    (nodeId: string, oldNodes: Node[], newNodes: Node[]): boolean => {
      if (!serpentineEnabled) return false;

      const oldMap = buildNodeRowMap(oldNodes);
      const newMap = buildNodeRowMap(newNodes);

      const oldInfo = oldMap.get(nodeId);
      const newInfo = newMap.get(nodeId);

      if (!oldInfo || !newInfo) return true;
      return oldInfo.rowIndex !== newInfo.rowIndex;
    },
    [serpentineEnabled]
  );

  return {
    recalculateEdges,
    didNodeChangeRow,
    serpentineEnabled,
    serpentineMode,
    serpentineGroupSize,
  };
}

/**
 * Standalone utility for edge recalculation (non-hook version).
 * Use this when you need to recalculate outside of React components.
 */
export function calculateSerpentineEdges(
  nodes: Node[],
  edges: Edge[]
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
