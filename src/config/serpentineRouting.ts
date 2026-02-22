/**
 * serpentineRouting.ts — Serpentine layout edge routing logic
 *
 * Pure functions with no React dependencies.
 * Used by useSerpentineSync, applySerpentineLayout, and applySerpentineEdgeRouting.
 */

import { isChoiceHandle } from './handleConfig';

// ─── Handle IDs (re-imported from handleConfig to avoid circular deps) ───
// We import the minimal set needed for routing decisions.
const HANDLE_ID = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  LEFT_OUT: 'left-out',
  RIGHT_IN: 'right-in',
} as const;

// ─── Constants ───────────────────────────────────────────────

/** Y-threshold for detecting nodes in the same row */
export const SERPENTINE_Y_THRESHOLD = 100;

// ─── Types ───────────────────────────────────────────────────

export interface NodeRowInfo {
  rowIndex: number;
  positionInRow: number;
}

// ─── Row Map Builder ─────────────────────────────────────────

/**
 * Build a map of nodeId -> row information based on Y positions.
 * Single source of truth for row detection (used by both initial layout and drag sync).
 */
export function buildNodeRowMap<T extends { id: string; position: { x: number; y: number } }>(
  nodes: T[]
): Map<string, NodeRowInfo> {
  const nodeRowMap = new Map<string, NodeRowInfo>();
  if (nodes.length === 0) return nodeRowMap;

  const sortedByY = [...nodes].sort((a, b) => a.position.y - b.position.y);

  const rows: T[][] = [];
  let currentRow: T[] = [sortedByY[0]];
  let currentY = sortedByY[0].position.y;

  for (let i = 1; i < sortedByY.length; i++) {
    const node = sortedByY[i];
    if (Math.abs(node.position.y - currentY) < SERPENTINE_Y_THRESHOLD) {
      currentRow.push(node);
    } else {
      rows.push(currentRow);
      currentRow = [node];
      currentY = node.position.y;
    }
  }
  rows.push(currentRow);

  rows.forEach((row, rowIndex) => {
    const sortedRow = [...row].sort((a, b) => a.position.x - b.position.x);
    sortedRow.forEach((node, positionInRow) => {
      nodeRowMap.set(node.id, { rowIndex, positionInRow });
    });
  });

  return nodeRowMap;
}

// ─── Handle Resolution ───────────────────────────────────────

/**
 * Determine the correct source/target handle IDs for an edge
 * based on serpentine row positions of its source and target nodes.
 *
 * Rules:
 * - Same row, even (0,2,4): LTR flow → source:right, target:left
 * - Same row, odd (1,3,5): RTL flow → source:left-out, target:right-in
 * - Different rows: vertical → source:bottom, target:top
 */
export function getSerpentineHandles(
  sourceRowIndex: number,
  targetRowIndex: number,
  currentSourceHandle: string | null | undefined
): { sourceHandle: string; targetHandle: string } {
  const sameRow = sourceRowIndex === targetRowIndex;
  const isEvenRow = sourceRowIndex % 2 === 0;
  const isChoice = isChoiceHandle(currentSourceHandle);

  if (sameRow) {
    if (isEvenRow) {
      return {
        sourceHandle: isChoice ? currentSourceHandle! : HANDLE_ID.RIGHT,
        targetHandle: HANDLE_ID.LEFT,
      };
    } else {
      return {
        sourceHandle: isChoice ? currentSourceHandle! : HANDLE_ID.LEFT_OUT,
        targetHandle: HANDLE_ID.RIGHT_IN,
      };
    }
  } else {
    return {
      sourceHandle: isChoice ? currentSourceHandle! : HANDLE_ID.BOTTOM,
      targetHandle: HANDLE_ID.TOP,
    };
  }
}

// ─── Serpentine Edge Recalculation ───────────────────────────

/**
 * Recalculate edge handles for serpentine routing based on node positions.
 * Pure function — no React dependencies. Used by both useSerpentineSync hook
 * and applySerpentineEdgeRouting utility.
 */
export function recalculateSerpentineEdges<
  E extends { source: string; target: string; sourceHandle?: string | null }
>(
  nodes: Array<{ id: string; position: { x: number; y: number } }>,
  edges: E[]
): E[] {
  if (nodes.length === 0) return edges;
  const nodeRowMap = buildNodeRowMap(nodes);
  return edges.map(edge => {
    const sourceInfo = nodeRowMap.get(edge.source);
    const targetInfo = nodeRowMap.get(edge.target);
    if (!sourceInfo || !targetInfo) return edge;
    const { sourceHandle, targetHandle } = getSerpentineHandles(
      sourceInfo.rowIndex, targetInfo.rowIndex, edge.sourceHandle
    );
    return { ...edge, sourceHandle, targetHandle };
  });
}
