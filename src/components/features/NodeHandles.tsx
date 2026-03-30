import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { STANDARD_HANDLES, HANDLE_ID, choiceHandleId } from '@/config/handleConfig';
import type { DialogueChoice } from '@/types';
import { CHOICE_COLORS } from './graph-nodes/styles';

/**
 * NodeHandles - Shared handle component for all node types
 *
 * Eliminates handle JSX duplication across DialogueNode, ChoiceNode, TerminalNode.
 * Renders all 6 standard handles + optional choice handles.
 *
 * Choice handle position is determined by the layout hook (useNodeLayout)
 * and passed via choiceHandlePosition — no directional logic here.
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
  /** Position for choice handles (from layout hook) */
  choiceHandlePosition?: Position;
  /** Color for input (target) handles — defaults to color */
  inputColor?: string;
  /** Color for output (source) handles — defaults to color */
  outputColor?: string;
  /** Opacity for handles (0–1). Default 0.2 (legacy). Use 0.85 for always-visible Blender style. */
  handleOpacity?: number;
}

/** Handle positions for horizontal/vertical centering */
const POSITION_STYLE: Record<string, React.CSSProperties> = {
  top: { left: '50%', transform: 'translateX(-50%)' },
  bottom: { left: '50%', transform: 'translateX(-50%)' },
  left: { top: '50%', transform: 'translateY(-50%)' },
  right: { top: '50%', transform: 'translateY(-50%)' },
};

export const NodeHandles = React.memo(function NodeHandles({
  color,
  bgColor,
  handleSize,
  borderWidth = 3,
  showDragIndicators = false,
  choices,
  showLinkEmoji = false,
  choiceHandlePosition = Position.Right,
  inputColor,
  outputColor,
  handleOpacity = 0.2,
}: NodeHandlesProps) {
  // Blender-style: always-visible handles use a dedicated CSS class that doesn't
  // apply opacity: 0.2. Legacy/cosmos themes keep react-flow__handle-hover (hidden until hover).
  const handleClass = handleOpacity >= 0.6 ? 'react-flow__handle-visible' : 'react-flow__handle-hover';

  const baseShadow = showDragIndicators
    ? '0 0 0 8px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)'
    : '0 2px 6px rgba(0,0,0,0.4)';

  return (
    <>
      {/* Standard 6-directional handles */}
      {STANDARD_HANDLES.map((handleDef) => {
        const posStyle = POSITION_STYLE[handleDef.id] || POSITION_STYLE[handleDef.position === Position.Left ? 'left' : 'right'];
        // SERP-FIX handles (left-out, right-in) don't need boxShadow or drag indicators
        const isSerpFix = handleDef.id === HANDLE_ID.LEFT_OUT || handleDef.id === HANDLE_ID.RIGHT_IN;

        const handleColor = handleDef.type === 'target'
          ? (inputColor ?? color)
          : (outputColor ?? color);

        // Output (source) handles get a colored glow for Blender-style depth cue
        const isSource = handleDef.type === 'source';
        const boxShadow = isSerpFix
          ? undefined
          : isSource && !showDragIndicators
            ? `0 0 0 1px ${handleColor}40, 0 0 8px ${handleColor}60, ${baseShadow}`
            : baseShadow;

        return (
          <Handle
            key={handleDef.id}
            type={handleDef.type}
            position={handleDef.position}
            id={handleDef.id}
            className={handleClass}
            style={{
              ...posStyle,
              background: handleColor,
              width: `${handleSize}px`,
              height: `${handleSize}px`,
              border: `${borderWidth}px solid ${bgColor}`,
              boxShadow,
              opacity: handleOpacity,
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

      {/* Choice handles — position comes from layout hook */}
      {choices && choices.map((choice, choiceIndex) => {
        const handleColor = CHOICE_COLORS[choiceIndex % CHOICE_COLORS.length];
        const topPosition = ((choiceIndex + 1) / (choices.length + 1)) * 100;

        return (
          <Handle
            key={choice.id}
            type="source"
            position={choiceHandlePosition}
            id={choiceHandleId(choiceIndex)}
            className={handleClass}
            style={{
              top: `${topPosition}%`,
              transform: 'translateY(-50%)',
              background: handleColor,
              width: `${handleSize}px`,
              height: `${handleSize}px`,
              border: `${borderWidth}px solid ${bgColor}`,
              boxShadow: showDragIndicators
                ? '0 0 0 6px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.4)'
                : `0 0 0 1px ${handleColor}40, 0 0 10px ${handleColor}70, 0 2px 6px rgba(0,0,0,0.4)`,
              opacity: handleOpacity,
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
    case HANDLE_ID.LEFT_OUT: return 'Point de connexion sortant serpentine (gauche)';
    case HANDLE_ID.RIGHT_IN: return 'Point de connexion entrant serpentine (droite)';
    default: return '';
  }
}
