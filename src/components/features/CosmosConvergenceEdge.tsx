import { BaseEdge, EdgeLabelRenderer, EdgeProps, Edge, getSmoothStepPath } from '@xyflow/react';
import { COSMOS_COLORS, COSMOS_DIMENSIONS } from '@/config/cosmosConstants';

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

const { stepRange, ySpread } = COSMOS_DIMENSIONS.convergenceEdge;
const { convergence } = COSMOS_COLORS;

/**
 * CosmosConvergenceEdge — custom edge for "↩ rejoint" convergence connections
 *
 * Fan algorithm:
 * - stepPosition: varies the bend point along the path (0.3–0.7 range)
 * - Y_SPREAD: slightly shifts source/target Y per edge index
 * The combination creates a clean fan where all edges are visually distinct.
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

  // Fan stepPosition: single edge = 0.5, multiple = evenly in [0.3, 0.7]
  const stepPosition =
    parallelCount === 1
      ? 0.5
      : 0.3 + (parallelIndex / Math.max(parallelCount - 1, 1)) * stepRange;

  // Slight Y offset: centres the fan around the handle
  const spread = (parallelIndex - (parallelCount - 1) / 2) * ySpread;

  const dim = COSMOS_DIMENSIONS.convergenceEdge;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY: sourceY + spread,
    sourcePosition,
    targetX,
    targetY: targetY + spread,
    targetPosition,
    borderRadius: dim.borderRadius,
    offset: dim.offset,
    stepPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: convergence.stroke,
          strokeWidth: dim.strokeWidth,
          strokeDasharray: dim.strokeDasharray,
          ...style,
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: convergence.labelBg,
            border: `1px solid ${convergence.labelBorder}`,
            color: convergence.labelText,
            fontSize: dim.labelFontSize,
            fontWeight: dim.labelFontWeight,
            letterSpacing: '0.02em',
            padding: dim.labelPadding,
            borderRadius: dim.labelBorderRadius,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: convergence.labelShadow,
          }}
        >
          ↩ rejoint
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
