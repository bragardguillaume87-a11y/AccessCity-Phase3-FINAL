import { useState } from 'react';
import { BaseEdge, Edge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';

/** Data passed to CosmosChoiceEdge via edge.data */
type CosmosEdgeData = { label?: string };

/**
 * CosmosChoiceEdge - Custom edge component for choice connections
 *
 * Features:
 * - Animated speech bubble label on hover
 * - Cosmic gradient styling
 * - Child-friendly design
 * - Shows full choice text in bubble
 */
export function CosmosChoiceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps<Edge<CosmosEdgeData>>) {
  const [isHovered, setIsHovered] = useState(false);
  const choiceText = data?.label ?? '';

  // Calculate edge path and label position
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Base edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Animated speech bubble label */}
      <EdgeLabelRenderer>
        {isHovered && choiceText && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
            className="cosmos-choice-bubble"
            role="tooltip"
            aria-label={`Choix : ${choiceText}`}
          >
            {/* Speech bubble container */}
            <div
              style={{
                background: 'linear-gradient(135deg, #9D4EDD 0%, #FF006E 100%)',
                border: '3px solid #e9d5ff',
                borderRadius: '20px',
                padding: '12px 16px',
                boxShadow: '0 0 20px rgba(157, 78, 221, 0.6), 0 0 40px rgba(255, 0, 110, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
                maxWidth: '250px',
                position: 'relative',
                animation: 'cosmos-bubble-appear 0.3s ease-out',
              }}
            >
              {/* Choice text */}
              <p
                style={{
                  margin: 0,
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                <span aria-hidden="true">💬</span> {choiceText}
              </p>

              {/* Speech bubble tail (pointing down to edge) */}
              <svg
                style={{
                  position: 'absolute',
                  bottom: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '12px',
                }}
                viewBox="0 0 24 12"
                fill="none"
              >
                <path
                  d="M0 0 L12 12 L24 0 Z"
                  fill="#9D4EDD"
                  stroke="#e9d5ff"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
