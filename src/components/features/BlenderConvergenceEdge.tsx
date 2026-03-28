import React from 'react';
import { BaseEdge, EdgeProps, Edge, getBezierPath } from '@xyflow/react';
import type { CosmosConvergenceData } from './CosmosConvergenceEdge';

/**
 * BlenderConvergenceEdge — arête de convergence pour le thème Blender
 *
 * Design : pointillés verts avec un petit marqueur triangulaire animé
 * qui se déplace le long du chemin (SVG animateMotion + rotate="auto").
 * Aucun texte — le sens de lecture est communiqué visuellement.
 */
export const BlenderConvergenceEdge = React.memo(function BlenderConvergenceEdge({
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

  // Slight Y spread for parallel edges targeting the same node
  const spread = (parallelIndex - (parallelCount - 1) / 2) * 12;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY: sourceY + spread,
    sourcePosition,
    targetX,
    targetY: targetY + spread,
    targetPosition,
  });

  // Stagger animation for parallel edges so they don't all move in sync
  const animDelay = `${(parallelIndex / Math.max(parallelCount, 1)) * 1.2}s`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#5a9a7a',
          strokeWidth: 2,
          strokeDasharray: '6,4',
          ...style,
        }}
      />

      {/* Animated arrow marker moving along the path to show reading direction */}
      <path
        d="M-5,-3 L2,0 L-5,3 Z"
        fill="#5a9a7a"
        opacity="0.9"
        style={{ filter: 'drop-shadow(0 0 3px rgba(74,140,92,0.8))' }}
      >
        <animateMotion
          dur="2.4s"
          begin={animDelay}
          repeatCount="indefinite"
          rotate="auto"
          calcMode="linear"
        >
          <mpath href={`#${id}`} />
        </animateMotion>
      </path>
    </>
  );
});
