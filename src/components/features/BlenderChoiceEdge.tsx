import { BaseEdge, EdgeProps, Edge, getBezierPath } from '@xyflow/react';

/**
 * BlenderChoiceEdge — arête de choix pour le thème Blender
 *
 * Ligne violette pleine avec un marqueur triangulaire animé
 * qui se déplace le long du chemin (SVG animateMotion + rotate="auto").
 */
export function BlenderChoiceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps<Edge>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#9a7abf',
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 4px rgba(123,94,167,0.7))',
          ...style,
        }}
      />

      {/* Animated arrow marker */}
      <path
        d="M-5,-3 L2,0 L-5,3 Z"
        fill="#9a7abf"
        opacity="0.9"
        style={{ filter: 'drop-shadow(0 0 3px rgba(123,94,167,0.9))' }}
      >
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          rotate="auto"
          calcMode="linear"
        >
          <mpath href={`#${id}`} />
        </animateMotion>
      </path>
    </>
  );
}
