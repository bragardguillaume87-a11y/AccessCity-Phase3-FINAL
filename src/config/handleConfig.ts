import { Position } from '@xyflow/react';

/**
 * handleConfig.ts - Single source of truth for ReactFlow handle IDs and routing
 *
 * SERP-FIX Architecture:
 * ReactFlow Handle has a single type (source OR target).
 * For serpentine RTL rows, we need additional handles:
 *   - 'left-out' : source at Left position (RTL outgoing)
 *   - 'right-in' : target at Right position (RTL incoming)
 *
 * Handle Map:
 * ┌──────────────────────────────────────────────────────┐
 * │  Position  │  Normal ID  │  Type   │  Serp RTL ID   │
 * │  Top       │  'top'      │ target  │  -              │
 * │  Bottom    │  'bottom'   │ source  │  -              │
 * │  Left      │  'left'     │ target  │  'left-out' src │
 * │  Right     │  'right'    │ source  │  'right-in' tgt │
 * └──────────────────────────────────────────────────────┘
 */

// ─── Handle IDs ──────────────────────────────────────────────
export const HANDLE_ID = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  /** SERP-FIX: source handle at Left position (for RTL row outgoing edges) */
  LEFT_OUT: 'left-out',
  /** SERP-FIX: target handle at Right position (for RTL row incoming edges) */
  RIGHT_IN: 'right-in',
} as const;

/** Prefix for choice handles on ChoiceNode (e.g. 'choice-0', 'choice-1') */
export const CHOICE_HANDLE_PREFIX = 'choice-';

/** Build a choice handle ID from index */
export function choiceHandleId(index: number): string {
  return `${CHOICE_HANDLE_PREFIX}${index}`;
}

/** Check if a handle ID is a choice handle */
export function isChoiceHandle(handleId: string | null | undefined): boolean {
  return !!handleId?.startsWith(CHOICE_HANDLE_PREFIX);
}

// ─── Handle Definitions ─────────────────────────────────────
// Used by NodeHandles component and for type-safety

export interface HandleDef {
  id: string;
  type: 'source' | 'target';
  position: Position;
}

/**
 * Standard handles present on ALL node types.
 * These 6 handles cover all serpentine routing scenarios.
 */
export const STANDARD_HANDLES: HandleDef[] = [
  { id: HANDLE_ID.TOP,       type: 'target', position: Position.Top },
  { id: HANDLE_ID.BOTTOM,    type: 'source', position: Position.Bottom },
  { id: HANDLE_ID.LEFT,      type: 'target', position: Position.Left },
  { id: HANDLE_ID.RIGHT,     type: 'source', position: Position.Right },
  { id: HANDLE_ID.LEFT_OUT,  type: 'source', position: Position.Left },
  { id: HANDLE_ID.RIGHT_IN,  type: 'target', position: Position.Right },
];

// ─── Serpentine Routing ──────────────────────────────────────

/** Y-threshold for detecting nodes in the same row */
export const SERPENTINE_Y_THRESHOLD = 100;

export interface NodeRowInfo {
  rowIndex: number;
  positionInRow: number;
}

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
