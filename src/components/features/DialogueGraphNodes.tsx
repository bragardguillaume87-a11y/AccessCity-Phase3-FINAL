import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare, GitBranch, ExternalLink, AlertCircle, AlertTriangle, User } from 'lucide-react';
import { getNodeColorTheme } from '../../hooks/useDialogueGraph';
import { useGraphTheme } from '@/hooks/useGraphTheme';
import { useCharactersStore } from '@/stores';
import { COLORS, NODE_COLORS } from '@/config/colors';
import type { DialogueNodeData, TerminalNodeData, ValidationProblem } from '@/types';

// Import cosmos theme CSS for animations
import './CosmosBackground.css';

/**
 * PHASE 6: Decorative Components for Child-Friendly Themes
 * These components add playful visual elements when shapes config is enabled
 */

/**
 * SpeechBubbleTail - SVG tail for bubble-shaped nodes
 * Makes nodes look like speech bubbles (comic book style)
 */
const SpeechBubbleTail = ({ color }: { color: string }) => (
  <svg
    style={{
      position: 'absolute',
      bottom: '-14px',
      left: '20%',
      width: '28px',
      height: '16px',
      overflow: 'visible',
      pointerEvents: 'none',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
    }}
    viewBox="0 0 28 16"
    aria-hidden="true"
  >
    <path
      d="M0 0 C6 0 10 12 14 16 C18 12 22 0 28 0"
      fill={color}
      stroke="none"
    />
  </svg>
);

/**
 * DecorativeStars - Sparkle decoration for playful themes
 * Adds visual delight for children
 */
const DecorativeStars = ({ position = 'top-right' }: { position?: 'top-right' | 'top-left' }) => (
  <span
    style={{
      position: 'absolute',
      top: '-10px',
      [position === 'top-right' ? 'right' : 'left']: '-10px',
      fontSize: '20px',
      pointerEvents: 'none',
      filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
      animation: 'cosmos-sparkle 2s ease-in-out infinite',
    }}
    aria-hidden="true"
  >
    ✨
  </span>
);

/**
 * DragIndicator - Visual hint for draggable nodes
 * Helps children understand they can drag the node
 */
const DragIndicator = () => (
  <div
    style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      display: 'flex',
      gap: '3px',
      opacity: 0.4,
      pointerEvents: 'none',
    }}
    className="cosmos-drag-indicator"
    aria-hidden="true"
  >
    <span style={{ fontSize: '6px', color: 'white' }}>●</span>
    <span style={{ fontSize: '6px', color: 'white' }}>●</span>
  </div>
);

/**
 * PHASE 7: Helper to get style for secondary (lateral) handles
 * These handles are smaller and more discrete than the main top/bottom handles
 */
const getSecondaryHandleStyle = (handleSize: number) => ({
  width: `${handleSize * 0.5}px`,
  height: `${handleSize * 0.5}px`,
  background: 'rgba(255, 255, 255, 0.25)',
  border: '2px solid rgba(255, 255, 255, 0.4)',
  opacity: 0.5,
  transition: 'all 0.2s ease',
});

/**
 * Helper: Get character avatar URL from store
 * Returns the sprite for the given mood, or the first available sprite
 */
function useCharacterAvatar(speakerId: string, mood: string): string | null {
  const characters = useCharactersStore((state) => state.characters);
  const character = characters.find((c) => c.id === speakerId);

  if (!character || !character.sprites) return null;

  // Try to get sprite for specific mood, fallback to neutral, then first available
  return character.sprites[mood] || character.sprites['neutral'] || Object.values(character.sprites)[0] || null;
}

/**
 * Props for DialogueNode component
 */
interface DialogueNodeProps {
  data: DialogueNodeData;
  selected?: boolean;
}

/**
 * DialogueNode - Standard dialogue node
 * Memoized to prevent unnecessary re-renders in ReactFlow.
 *
 * Features:
 * - Shows speaker name with mood icon
 * - Shows dialogue text (truncated)
 * - Shows dialogue index number
 * - Error/warning badges
 * - Handles for connections (top + bottom)
 */
export const DialogueNode = React.memo(function DialogueNode({ data, selected }: DialogueNodeProps): React.JSX.Element {
  const { index, speaker, text, speakerMood, stageDirections, issues = [] } = data;
  const theme = useGraphTheme();
  const colors = getNodeColorTheme('dialogueNode', issues);
  const themeColors = theme.nodes.dialogue;
  const sizes = theme.sizes;

  // Get character avatar (Articy-inspired)
  const avatarUrl = useCharacterAvatar(speaker, speakerMood || 'neutral');

  const hasErrors = issues.some((issue: ValidationProblem) => issue.type === 'error');
  const hasWarnings = issues.some((issue: ValidationProblem) => issue.type === 'warning');

  // Use theme colors, fallback to validation colors if there are issues
  const bgColor = hasErrors || hasWarnings ? colors.bg : (themeColors.bgGradient || themeColors.bg);
  const borderColor = hasErrors || hasWarnings ? colors.border : themeColors.border;
  const textColor = hasErrors || hasWarnings ? colors.text : themeColors.text;
  const shadow = selected ? themeColors.shadowSelected : themeColors.shadow;

  // Truncate text for display
  const displayText = text ? (text.length > 80 ? text.substring(0, 80) + '...' : text) : '(Empty dialogue)';
  const displayStageDirections = stageDirections ? (stageDirections.length > 50 ? stageDirections.substring(0, 50) + '...' : stageDirections) : null;

  // PHASE 5.2: ARIA label for screen readers
  const ariaLabel = `Dialogue ${index + 1}: ${speaker || 'Narrator'} dit "${displayText}"`;

  // PHASE 4: Build CSS classes - hover animation + selected animation (Cosmos pulsing glow)
  const nodeClasses = [
    'dialogue-node',
    theme.animations.nodeHover,
    selected && theme.animations.nodeSelected
  ].filter(Boolean).join(' ');

  return (
    <div
      className={nodeClasses}
      role="treeitem"
      aria-label={ariaLabel}
      aria-selected={selected}
      tabIndex={0}
      style={{
        background: bgColor,
        borderColor: selected ? COLORS.SELECTED : borderColor,
        borderWidth: selected ? '3px' : '2px',
        borderStyle: 'solid',
        borderRadius: `${sizes.nodeBorderRadius}px`,
        padding: '12px',
        width: `${sizes.nodeWidth}px`,
        minHeight: `${sizes.nodeMinHeight}px`,
        boxShadow: shadow,
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* PHASE 6: Decorative elements for child-friendly themes */}
      {theme.shapes?.decorativeElements && <DecorativeStars position="top-right" />}
      {theme.interactions?.showDragIndicators && <DragIndicator />}

      {/* Top handle - enlarged for children */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: borderColor,
          width: `${sizes.handleSize}px`,
          height: `${sizes.handleSize}px`,
          border: `3px solid ${themeColors.bg}`,
          boxShadow: theme.interactions?.showDragIndicators
            ? `0 0 0 8px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)`
            : '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* PHASE 6: Drag indicator emoji for children */}
        {theme.interactions?.showDragIndicators && (
          <span
            style={{
              position: 'absolute',
              top: '-22px',
              left: '50%',
              transform: 'translateX(-50%)',
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

      {/* PHASE 7: Left handle (target) - discrete secondary connection */}
      {theme.shapes?.nodeShape === 'bubble' && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="cosmos-secondary-handle"
          style={getSecondaryHandleStyle(sizes.handleSize)}
        />
      )}

      {/* PHASE 7: Right handle (source) - discrete secondary connection */}
      {theme.shapes?.nodeShape === 'bubble' && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="cosmos-secondary-handle"
          style={getSecondaryHandleStyle(sizes.handleSize)}
        />
      )}

      {/* Header: Avatar + Speaker + Index (Articy-inspired) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        {/* Character Avatar (Articy-inspired) */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: `2px solid ${borderColor}`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={speaker}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <User size={20} color={textColor} style={{ opacity: 0.5 }} />
          )}
        </div>

        {/* Speaker info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Icon: emoji for cosmos, Lucide for default */}
              {theme.icons?.useEmoji ? (
                <span style={{ fontSize: `${sizes.fontSizeSpeaker + 2}px`, lineHeight: 1 }}>
                  {theme.icons.dialogue}
                </span>
              ) : (
                <MessageSquare size={14} color={textColor} />
              )}
              <span style={{ fontSize: `${sizes.fontSizeSpeaker}px`, fontWeight: '600', color: textColor }}>
                {speaker || 'Narrator'}
              </span>
              {speakerMood && speakerMood !== 'neutral' && (
                <span style={{ fontSize: '10px', color: textColor, opacity: 0.7, fontStyle: 'italic' }}>
                  ({speakerMood})
                </span>
              )}
            </div>

            {/* Index badge - playful for cosmos */}
            <span
              style={{
                fontSize: theme.icons?.useEmoji ? '12px' : '11px',
                fontWeight: '700',
                color: COLORS.TEXT_DARK,
                backgroundColor: textColor,
                padding: theme.icons?.useEmoji ? '3px 10px' : '2px 6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              {theme.icons?.useEmoji && <span>💬</span>}
              {index + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Stage Directions - Didascalies (Articy-inspired) */}
      {displayStageDirections && (
        <p
          style={{
            fontSize: '11px',
            lineHeight: '1.4',
            color: textColor,
            margin: '0 0 6px 0',
            padding: '4px 8px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            fontStyle: 'italic',
            opacity: 0.85,
            borderLeft: `3px solid ${borderColor}`
          }}
        >
          {theme.icons?.useEmoji ? '🎬 ' : ''}{displayStageDirections}
        </p>
      )}

      {/* Dialogue text */}
      <p
        style={{
          fontSize: `${sizes.fontSizeText}px`,
          lineHeight: '1.6',
          color: textColor,
          margin: '0',
          wordWrap: 'break-word',
          opacity: 0.95
        }}
      >
        {displayText}
      </p>

      {/* Error/Warning badges */}
      {(hasErrors || hasWarnings) && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
          {hasErrors && (
            <div
              style={{
                backgroundColor: COLORS.ERROR,
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={issues.filter((i: ValidationProblem) => i.type === 'error').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertCircle size={14} color={COLORS.TEXT_WHITE} />
            </div>
          )}
          {hasWarnings && (
            <div
              style={{
                backgroundColor: COLORS.WARNING,
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={issues.filter((i: ValidationProblem) => i.type === 'warning').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertTriangle size={14} color={COLORS.TEXT_WHITE} />
            </div>
          )}
        </div>
      )}

      {/* PHASE 6: Speech bubble tail for child-friendly themes */}
      {theme.shapes?.speechBubbleTail && (
        <SpeechBubbleTail color={themeColors.bgGradient?.match(/#[0-9a-fA-F]{6}/)?.[0] || themeColors.bg} />
      )}

      {/* Bottom handle - enlarged for children */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: borderColor,
          width: `${sizes.handleSize}px`,
          height: `${sizes.handleSize}px`,
          border: `3px solid ${themeColors.bg}`,
          boxShadow: theme.interactions?.showDragIndicators
            ? `0 0 0 8px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)`
            : '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
        }}
      />
    </div>
  );
});

/**
 * Props for ChoiceNode component
 */
interface ChoiceNodeProps {
  data: DialogueNodeData;
  selected?: boolean;
}

/**
 * ChoiceNode - Dialogue node with branching choices
 * Memoized to prevent unnecessary re-renders in ReactFlow.
 *
 * Features:
 * - Shows speaker and text like DialogueNode
 * - Badge showing number of choices
 * - Different color scheme (purple)
 * - GitBranch icon
 */
export const ChoiceNode = React.memo(function ChoiceNode({ data, selected }: ChoiceNodeProps): React.JSX.Element {
  const { index, speaker, text, speakerMood, stageDirections, choices = [], issues = [] } = data;
  const theme = useGraphTheme();
  const colors = getNodeColorTheme('choiceNode', issues);
  const themeColors = theme.nodes.choice;
  const sizes = theme.sizes;

  // Get character avatar (Articy-inspired)
  const avatarUrl = useCharacterAvatar(speaker, speakerMood || 'neutral');

  const hasErrors = issues.some((issue: ValidationProblem) => issue.type === 'error');
  const hasWarnings = issues.some((issue: ValidationProblem) => issue.type === 'warning');

  // Use theme colors, fallback to validation colors if there are issues
  const bgColor = hasErrors || hasWarnings ? colors.bg : (themeColors.bgGradient || themeColors.bg);
  const borderColor = hasErrors || hasWarnings ? colors.border : themeColors.border;
  const textColor = hasErrors || hasWarnings ? colors.text : themeColors.text;
  const shadow = selected ? themeColors.shadowSelected : themeColors.shadow;

  // Truncate text for display
  const displayText = text ? (text.length > 80 ? text.substring(0, 80) + '...' : text) : '(Empty dialogue)';
  const displayStageDirections = stageDirections ? (stageDirections.length > 50 ? stageDirections.substring(0, 50) + '...' : stageDirections) : null;

  // PHASE 5.2: ARIA label for screen readers
  const ariaLabel = `Dialogue ${index + 1} avec ${choices.length} choix: ${speaker || 'Narrator'} dit "${displayText}"`;

  // PHASE 4: Build CSS classes - hover animation + selected animation (Cosmos pulsing glow)
  const nodeClasses = [
    'choice-node',
    theme.animations.nodeHover,
    selected && theme.animations.nodeSelected
  ].filter(Boolean).join(' ');

  return (
    <div
      className={nodeClasses}
      role="treeitem"
      aria-label={ariaLabel}
      aria-selected={selected}
      aria-expanded={choices.length > 0}
      tabIndex={0}
      style={{
        background: bgColor,
        borderColor: selected ? COLORS.SELECTED : borderColor,
        borderWidth: selected ? '3px' : '2px',
        borderStyle: 'solid',
        borderRadius: `${sizes.nodeBorderRadius}px`,
        padding: '12px',
        width: `${sizes.nodeWidth}px`,
        minHeight: `${sizes.nodeMinHeight}px`,
        boxShadow: shadow,
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* PHASE 6: Decorative elements for child-friendly themes */}
      {theme.shapes?.decorativeElements && <DecorativeStars position="top-left" />}
      {theme.interactions?.showDragIndicators && <DragIndicator />}

      {/* Top handle - enlarged for children */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        aria-label="Point de connexion entrant"
        style={{
          background: borderColor,
          width: `${sizes.handleSize}px`,
          height: `${sizes.handleSize}px`,
          border: `3px solid ${themeColors.bg}`,
          boxShadow: theme.interactions?.showDragIndicators
            ? `0 0 0 8px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)`
            : '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* PHASE 6: Drag indicator emoji for children */}
        {theme.interactions?.showDragIndicators && (
          <span
            style={{
              position: 'absolute',
              top: '-22px',
              left: '50%',
              transform: 'translateX(-50%)',
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

      {/* PHASE 7: Left handle (target) - discrete secondary connection */}
      {theme.shapes?.nodeShape === 'bubble' && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="cosmos-secondary-handle"
          style={getSecondaryHandleStyle(sizes.handleSize)}
        />
      )}

      {/* PHASE 7: Right handle (source) - discrete secondary connection */}
      {theme.shapes?.nodeShape === 'bubble' && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="cosmos-secondary-handle"
          style={getSecondaryHandleStyle(sizes.handleSize)}
        />
      )}

      {/* Header: Avatar + Speaker + Index (Articy-inspired) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        {/* Character Avatar (Articy-inspired) */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: `2px solid ${borderColor}`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={speaker}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <User size={20} color={textColor} style={{ opacity: 0.5 }} />
          )}
        </div>

        {/* Speaker info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Icon: emoji for cosmos, Lucide for default */}
              {theme.icons?.useEmoji ? (
                <span style={{ fontSize: `${sizes.fontSizeSpeaker + 2}px`, lineHeight: 1 }}>
                  {theme.icons.choice}
                </span>
              ) : (
                <GitBranch size={14} color={textColor} />
              )}
              <span style={{ fontSize: `${sizes.fontSizeSpeaker}px`, fontWeight: '600', color: textColor }}>
                {speaker || 'Narrator'}
              </span>
              {speakerMood && speakerMood !== 'neutral' && (
                <span style={{ fontSize: '10px', color: textColor, opacity: 0.7, fontStyle: 'italic' }}>
                  ({speakerMood})
                </span>
              )}
            </div>

            {/* Index badge - playful for cosmos */}
            <span
              style={{
                fontSize: theme.icons?.useEmoji ? '12px' : '11px',
                fontWeight: '700',
                color: COLORS.TEXT_DARK,
                backgroundColor: textColor,
                padding: theme.icons?.useEmoji ? '3px 10px' : '2px 6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              {theme.icons?.useEmoji && <span>🚀</span>}
              {index + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Stage Directions - Didascalies (Articy-inspired) */}
      {displayStageDirections && (
        <p
          style={{
            fontSize: '11px',
            lineHeight: '1.4',
            color: textColor,
            margin: '0 0 6px 0',
            padding: '4px 8px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            fontStyle: 'italic',
            opacity: 0.85,
            borderLeft: `3px solid ${borderColor}`
          }}
        >
          {theme.icons?.useEmoji ? '🎬 ' : ''}{displayStageDirections}
        </p>
      )}

      {/* Dialogue text */}
      <p
        style={{
          fontSize: `${sizes.fontSizeText}px`,
          lineHeight: '1.6',
          color: textColor,
          margin: '0 0 8px 0',
          wordWrap: 'break-word',
          opacity: 0.95
        }}
      >
        {displayText}
      </p>

      {/* Choices preview - show first choices as mini-badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
        {choices.slice(0, 3).map((choice, i) => {
          const choiceColors = ['#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];
          return (
            <span
              key={choice.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: `${choiceColors[i % choiceColors.length]}20`,
                border: `2px solid ${choiceColors[i % choiceColors.length]}`,
                borderRadius: '12px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                color: choiceColors[i % choiceColors.length],
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {theme.icons?.useEmoji && <span>✨</span>}
              {choice.text?.substring(0, 12) || `Choix ${i + 1}`}
            </span>
          );
        })}
        {choices.length > 3 && (
          <span
            style={{
              fontSize: '11px',
              color: textColor,
              opacity: 0.7,
              padding: '4px 8px'
            }}
          >
            +{choices.length - 3}
          </span>
        )}
      </div>

      {/* Error/Warning badges */}
      {(hasErrors || hasWarnings) && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
          {hasErrors && (
            <div
              style={{
                backgroundColor: COLORS.ERROR,
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={issues.filter((i: ValidationProblem) => i.type === 'error').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertCircle size={14} color={COLORS.TEXT_WHITE} />
            </div>
          )}
          {hasWarnings && (
            <div
              style={{
                backgroundColor: COLORS.WARNING,
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={issues.filter((i: ValidationProblem) => i.type === 'warning').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertTriangle size={14} color={COLORS.TEXT_WHITE} />
            </div>
          )}
        </div>
      )}

      {/* PHASE 6: Speech bubble tail for child-friendly themes */}
      {theme.shapes?.speechBubbleTail && (
        <SpeechBubbleTail color={themeColors.bgGradient?.match(/#[0-9a-fA-F]{6}/)?.[0] || themeColors.bg} />
      )}

      {/* Multi-handles: One handle per choice (PHASE 2) - enlarged for children */}
      {choices.map((choice, choiceIndex) => {
        // Colors for handles (repeating pattern)
        const handleColors = ['#10b981', '#f43f5e', '#f59e0b', '#8b5cf6']; // emerald, rose, amber, purple
        const handleColor = handleColors[choiceIndex % handleColors.length];

        // Position: distribute handles evenly at the bottom
        const leftPosition = ((choiceIndex + 1) / (choices.length + 1)) * 100;

        return (
          <Handle
            key={choice.id}
            type="source"
            position={Position.Bottom}
            id={`choice-${choiceIndex}`}
            style={{
              left: `${leftPosition}%`,
              background: handleColor,
              width: `${sizes.handleSize}px`,
              height: `${sizes.handleSize}px`,
              border: '3px solid white',
              boxShadow: theme.interactions?.showDragIndicators
                ? `0 0 0 6px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.4)`
                : '0 2px 6px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
            }}
            aria-label={`Connexion pour le choix "${choice.text}"`}
          />
        );
      })}
    </div>
  );
});

/**
 * Props for TerminalNode component
 */
interface TerminalNodeProps {
  data: TerminalNodeData;
  selected?: boolean;
}

/**
 * TerminalNode - Node representing a scene jump
 * Memoized to prevent unnecessary re-renders in ReactFlow.
 *
 * Features:
 * - Smaller node (200x60)
 * - Shows target scene ID
 * - Orange/amber color scheme
 * - External link icon
 * - Only has input handle (no output)
 */
export const TerminalNode = React.memo(function TerminalNode({ data, selected }: TerminalNodeProps): React.JSX.Element {
  const { label, choiceText } = data;
  const theme = useGraphTheme();
  const themeColors = theme.nodes.terminal;
  const sizes = theme.sizes;

  const shadow = selected ? themeColors.shadowSelected : themeColors.shadow;

  // PHASE 5.2: ARIA label for screen readers
  const ariaLabel = `Saut vers scene: ${label}${choiceText ? ` (via "${choiceText}")` : ''}`;

  // PHASE 4: Build CSS classes - hover animation + selected animation (Cosmos pulsing glow)
  const nodeClasses = [
    'terminal-node',
    theme.animations.nodeHover,
    selected && theme.animations.nodeSelected
  ].filter(Boolean).join(' ');

  return (
    <div
      className={nodeClasses}
      role="treeitem"
      aria-label={ariaLabel}
      aria-selected={selected}
      tabIndex={0}
      style={{
        background: themeColors.bgGradient || themeColors.bg,
        borderColor: selected ? COLORS.SELECTED : themeColors.border,
        borderWidth: selected ? '3px' : '2px',
        borderStyle: 'dashed',
        borderRadius: `${sizes.nodeBorderRadius}px`,
        padding: '12px',
        width: '200px',
        minHeight: '60px',
        boxShadow: shadow,
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      {/* Top handle (only input) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: themeColors.border,
          width: `${sizes.handleSize}px`,
          height: `${sizes.handleSize}px`,
          border: `2px solid ${themeColors.bg}`
        }}
      />

      {/* Icon: emoji for cosmos, Lucide for default */}
      {theme.icons?.useEmoji ? (
        <span style={{ fontSize: '24px', lineHeight: 1 }}>
          {theme.icons.terminal}
        </span>
      ) : (
        <ExternalLink size={16} color={themeColors.text} />
      )}
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: `${sizes.fontSizeText}px`,
            fontWeight: '600',
            color: themeColors.text,
            margin: '0'
          }}
        >
          {theme.icons?.useEmoji ? '🌟 ' : ''}{label}
        </p>
        {choiceText && (
          <p
            style={{
              fontSize: '11px',
              color: themeColors.text,
              opacity: 0.8,
              margin: '4px 0 0 0',
              fontStyle: 'italic'
            }}
          >
            "{choiceText.substring(0, 30)}..."
          </p>
        )}
      </div>
    </div>
  );
});

/**
 * Node types configuration for ReactFlow
 */
export const nodeTypes = {
  dialogueNode: DialogueNode,
  choiceNode: ChoiceNode,
  terminalNode: TerminalNode
} as const;
