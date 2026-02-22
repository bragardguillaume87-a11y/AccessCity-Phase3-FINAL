/**
 * handleConfig.ts — Barrel module for handle IDs, node IDs, and serpentine routing
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
 *
 * Split into 3 focused modules (Phase 3.3):
 * - handleConfig.ts (this file) — Handle IDs, definitions, choice handles
 * - nodeIdCodec.ts — Dialogue node ID encode/decode
 * - serpentineRouting.ts — Row detection + edge handle resolution
 */

import { Position } from '@xyflow/react';

// ─── Re-exports from sub-modules (backward compatibility) ────
export {
  dialogueNodeId,
  extractDialogueIndex,
  safeExtractDialogueIndex,
  extractSceneId,
} from './nodeIdCodec';

export {
  SERPENTINE_Y_THRESHOLD,
  buildNodeRowMap,
  getSerpentineHandles,
  recalculateSerpentineEdges,
} from './serpentineRouting';

export type { NodeRowInfo } from './serpentineRouting';

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
