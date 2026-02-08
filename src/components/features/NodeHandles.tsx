import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { STANDARD_HANDLES, HANDLE_ID, choiceHandleId } from '@/config/handleConfig';
import type { DialogueChoice } from '@/types';

/**
 * NodeHandles - Shared handle component for all node types
 *
 * Eliminates handle JSX duplication across DialogueNode, ChoiceNode, TerminalNode.
 * Renders all 6 standard handles + optional choice handles.
 *
 * Standard handles:
 *   top (target), bottom (source), left (target), right (source),
 *   left-out (source, SERP-FIX), right-in (target, SERP-FIX)
 *
 * Choice handles (optional):
 *   choice-0, choice-1, ... (source, distributed vertically on right side)
 */

interface NodeHandlesProps {
  /** Primary color for handle background */
  color: string;
  /** Background color for handle border */
  bgColor: string;
  /** Handle size in px */
  handleSize: number;
  /** Border width for handles */
  borderWidth?: number;
  /** Show enhanced drag indicators (child-friendly themes) */
  showDragIndicators?: boolean;
  /** Choices array for rendering choice-specific handles on ChoiceNode */
  choices?: DialogueChoice[];
  /** Child-friendly link emoji on left handle */
  showLinkEmoji?: boolean;
}

/** Handle positions for horizontal/vertical centering */
const POSITION_STYLE: Record<string, React.CSSProperties> = {
  top: { left: '50%', transform: 'translateX(-50%)' },
  bottom: { left: '50%', transform: 'translateX(-50%)' },
  left: { top: '50%', transform: 'translateY(-50%)' },
  right: { top: '50%', transform: 'translateY(-50%)' },
};

/** Choice handle colors (repeating pattern) */
const CHOICE_COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

export const NodeHandles = React.memo(function NodeHandles({
  color,
  bgColor,
  handleSize,
  borderWidth = 3,
  showDragIndicators = false,
  choices,
  showLinkEmoji = false,
}: NodeHandlesProps) {
  const boxShadow = showDragIndicators
    ? '0 0 0 8px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)'
    : '0 2px 4px rgba(0,0,0,0.2)';

  return (
    <>
      {/* Standard 6-directional handles */}
      {STANDARD_HANDLES.map((handleDef) => {
        const posStyle = POSITION_STYLE[handleDef.id] || POSITION_STYLE[handleDef.position === Position.Left ? 'left' : 'right'];
        // SERP-FIX handles (left-out, right-in) don't need boxShadow or drag indicators
        const isSerpFix = handleDef.id === HANDLE_ID.LEFT_OUT || handleDef.id === HANDLE_ID.RIGHT_IN;

        return (
          <Handle
            key={handleDef.id}
            type={handleDef.type}
            position={handleDef.position}
            id={handleDef.id}
            className="react-flow__handle-hover"
            style={{
              ...posStyle,
              background: color,
              width: `${handleSize}px`,
              height: `${handleSize}px`,
              border: `${borderWidth}px solid ${bgColor}`,
              boxShadow: isSerpFix ? undefined : boxShadow,
              opacity: 0.2,
              transition: 'all 0.2s ease',
            }}
            aria-label={getHandleAriaLabel(handleDef.id)}
          >
            {/* Link emoji for left handle in child-friendly themes */}
            {handleDef.id === HANDLE_ID.LEFT && showLinkEmoji && (
              <span
                style={{
                  position: 'absolute',
                  left: '-22px',
                  top: '50%',
                  transform: 'translate(-100%, -50%)',
                  fontSize: '14px',
                  pointerEvents: 'none',
                  opacity: 0.7,
                }}
                className="cosmos-handle-indicator"
              >
                🔗
              </span>
            )}
          </Handle>
        );
      })}

      {/* Choice handles (ChoiceNode only) */}
      {choices && choices.map((choice, choiceIndex) => {
        const handleColor = CHOICE_COLORS[choiceIndex % CHOICE_COLORS.length];
        const topPosition = ((choiceIndex + 1) / (choices.length + 1)) * 100;

        return (
          <Handle
            key={choice.id}
            type="source"
            position={Position.Right}
            id={choiceHandleId(choiceIndex)}
            className="react-flow__handle-hover"
            style={{
              top: `${topPosition}%`,
              transform: 'translateY(-50%)',
              background: handleColor,
              width: `${handleSize}px`,
              height: `${handleSize}px`,
              border: '3px solid white',
              boxShadow: showDragIndicators
                ? '0 0 0 6px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.4)'
                : `0 0 8px ${handleColor}cc, 0 0 16px ${handleColor}80, 0 2px 4px rgba(0,0,0,0.3)`,
              opacity: 0.2,
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              zIndex: 10,
            }}
            aria-label={`Connexion pour le choix "${choice.text}"`}
          />
        );
      })}
    </>
  );
});

function getHandleAriaLabel(handleId: string): string {
  switch (handleId) {
    case HANDLE_ID.TOP: return 'Point de connexion entrant (haut)';
    case HANDLE_ID.BOTTOM: return 'Point de connexion sortant (bas)';
    case HANDLE_ID.LEFT: return 'Point de connexion entrant (gauche)';
    case HANDLE_ID.RIGHT: return 'Point de connexion sortant (droite)';
    default: return '';
  }
}
