import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useUIStore } from '@/stores/uiStore';
import { buildNodeRowMap, recalculateSerpentineEdges } from '@/config/handleConfig';
import { isTerminalNode } from '@/utils/textHelpers';

/**
 * useSerpentineSync - Hook for dynamic serpentine edge handle recalculation
 *
 * Uses shared recalculateSerpentineEdges from handleConfig.ts (single source of truth).
 *
 * Problem solved:
 * - When user manually drags nodes, edge handles don't update
 * - The useMemo in useDialogueGraph only calculates on initial render
 * - This hook provides real-time edge recalculation based on current node positions
 */
export function useSerpentineSync() {
  const serpentineEnabled = useUIStore((state) => state.serpentineEnabled);
  const serpentineMode = useUIStore((state) => state.serpentineMode);
  const serpentineGroupSize = useUIStore((state) => state.serpentineGroupSize);

  /**
   * Recalculate edge handles based on current node positions.
   * Delegates to shared pure function in handleConfig.ts.
   */
  const recalculateEdges = useCallback(
    (nodes: Node[], edges: Edge[]): Edge[] => {
      if (!serpentineEnabled || nodes.length === 0) return edges;
      const dialogueOnly = nodes.filter(n => !isTerminalNode(n));
      return recalculateSerpentineEdges(dialogueOnly, edges);
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

      const oldMap = buildNodeRowMap(oldNodes.filter(n => !isTerminalNode(n)));
      const newMap = buildNodeRowMap(newNodes.filter(n => !isTerminalNode(n)));

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
 * Delegates to shared pure function in handleConfig.ts.
 */
export function calculateSerpentineEdges(
  nodes: Node[],
  edges: Edge[]
): Edge[] {
  return recalculateSerpentineEdges(nodes.filter(n => !isTerminalNode(n)), edges);
}
