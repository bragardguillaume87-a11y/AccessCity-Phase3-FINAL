import { BaseEdge, EdgeLabelRenderer, EdgeProps, Edge, getSmoothStepPath } from '@xyflow/react';

/**
 * Data injected into each convergence edge by buildGraphEdges post-processing.
 * Used to spread parallel edges that all target the same node.
 */
// Extends Record<string, unknown> to satisfy xyflow's EdgeBase generic constraint.
export interface CosmosConvergenceData extends Record<string, unknown> {
  /** 0-based index within the group of parallel edges targeting the same node */
  parallelIndex?: number;
  /** Total number of parallel convergence edges targeting the same node */
  parallelCount?: number;
  /** Marker for edge identity (used in buildGraphEdges post-processing) */
  isConvergence?: boolean;
}

/**
 * Visual constants for the fan effect.
 *
 * Fan algorithm:
 * - stepPosition: varies the bend point along the path (0.3–0.7 range)
 *   → separates the mid-section routes so they don't overlap on long paths
 * - Y_SPREAD: slightly shifts source/target Y per edge index
 *   → separates the arrival/departure points at the node handles
 *
 * The combination creates a clean fan where all edges are visually distinct
 * even when originating from nodes at different distances.
 */
const STEP_RANGE = 0.4;   // spread of stepPosition: [0.3 … 0.7]
const Y_SPREAD_PX = 9;    // px of Y shift per edge at source/target

/**
 * CosmosConvergenceEdge — custom edge for "↩ rejoint" convergence connections
 *
 * Replaces the built-in 'straight'/'smoothstep' type for Cosmos theme convergence
 * edges. Key improvements over the built-in types:
 *
 * 1. Fan spreading: when multiple edges target the same node, their paths are
 *    fanned using varying stepPosition values and small Y offsets, preventing overlap.
 * 2. Smooth corners: borderRadius:20 for rounded steps.
 * 3. Permanent label: "↩ rejoint" always visible (not hover-dependent).
 * 4. Cross-row awareness: correctly routes via getSmoothStepPath regardless of
 *    whether source/target are in the same serpentine row (handles already set
 *    correctly by recalculateSerpentineEdges upstream).
 */
export function CosmosConvergenceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<Edge<CosmosConvergenceData>>) {
  const parallelIndex = data?.parallelIndex ?? 0;
  const parallelCount = data?.parallelCount ?? 1;

  // ── Fan parameters ──────────────────────────────────────────────────────────
  // For 1 edge: stepPosition = 0.5 (midpoint bend — normal)
  // For n edges: evenly distributed in [0.3, 0.7]
  const stepPosition =
    parallelCount === 1
      ? 0.5
      : 0.3 + (parallelIndex / Math.max(parallelCount - 1, 1)) * STEP_RANGE;

  // Slight Y offset: centres the fan around the handle, so edges spread
  // ±(n/2 * Y_SPREAD) around the natural handle Y.
  const spread = (parallelIndex - (parallelCount - 1) / 2) * Y_SPREAD_PX;

  // ── Path computation ────────────────────────────────────────────────────────
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY: sourceY + spread,
    sourcePosition,
    targetX,
    targetY: targetY + spread,
    targetPosition,
    borderRadius: 20,
    offset: 24,
    stepPosition,
  });

  return (
    <>
      {/* Edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#22c55e',
          strokeWidth: 2,
          strokeDasharray: '5,4',
          ...style,
        }}
      />

      {/* Permanent "↩ rejoint" label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(34, 197, 94, 0.45)',
            color: '#86efac',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.02em',
            padding: '2px 7px',
            borderRadius: 5,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.25)',
          }}
        >
          ↩ rejoint
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
