import { useState } from 'react';
import { BaseEdge, Edge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { COSMOS_COLORS, COSMOS_DIMENSIONS, COSMOS_ANIMATIONS } from '@/config/cosmosConstants';

/** Data passed to CosmosChoiceEdge via edge.data */
type CosmosEdgeData = { label?: string };

const bubble = COSMOS_COLORS.choiceBubble;
const dim = COSMOS_DIMENSIONS.choiceBubble;

/**
 * CosmosChoiceEdge - Custom edge component for choice connections
 *
 * Features:
 * - Animated speech bubble label on hover
 * - Cosmic gradient styling
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
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      <EdgeLabelRenderer>
        {isHovered && choiceText && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              zIndex: dim.zIndex,
            }}
            className="cosmos-choice-bubble"
            role="tooltip"
            aria-label={`Choix : ${choiceText}`}
          >
            <div
              style={{
                background: bubble.gradient,
                border: `${bubble.borderWidth}px solid ${bubble.border}`,
                borderRadius: `${dim.borderRadius}px`,
                padding: dim.padding,
                boxShadow: bubble.shadow,
                maxWidth: `${dim.maxWidth}px`,
                position: 'relative',
                animation: COSMOS_ANIMATIONS.bubbleAppear,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: bubble.text,
                  fontSize: `${dim.fontSize}px`,
                  fontWeight: dim.fontWeight,
                  textAlign: 'center',
                  lineHeight: dim.lineHeight,
                  textShadow: bubble.textShadow,
                }}
              >
                <span aria-hidden="true">💬</span> {choiceText}
              </p>

              <svg
                style={{
                  position: 'absolute',
                  bottom: `-${dim.tailOffset}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `${dim.tailWidth}px`,
                  height: `${dim.tailHeight}px`,
                }}
                viewBox={`0 0 ${dim.tailWidth} ${dim.tailHeight}`}
                fill="none"
              >
                <path
                  d={`M0 0 L${dim.tailWidth / 2} ${dim.tailHeight} L${dim.tailWidth} 0 Z`}
                  fill={bubble.tailFill}
                  stroke={bubble.border}
                  strokeWidth={`${bubble.borderWidth}`}
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
