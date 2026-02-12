import React from 'react';
import { AlertCircle, AlertTriangle, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getNodeColorTheme } from '@/hooks/useDialogueGraph';
import { useGraphTheme } from '@/hooks/useGraphTheme';
import { COLORS } from '@/config/colors';
import type { DialogueNodeData, DialogueChoice, ValidationProblem } from '@/types';
import type { Position } from '@xyflow/react';
import { SerpentineBadge, SerpentineRowIndicator } from '../SerpentineBadge';
import { FlowDirectionIndicator } from '../FlowDirectionIndicator';
import { NodeHandles } from '../NodeHandles';
import { useNodeLayout } from '@/hooks/useNodeLayout';
import { useCharacterAvatar } from './useCharacterAvatar';
import { SpeechBubbleTail, DecorativeStars, DragIndicator } from './NodeDecorations';
import {
  HEADER_ROW_STYLE,
  AVATAR_BASE_STYLE,
  AVATAR_IMG_STYLE,
  SPEAKER_INFO_STYLE,
  SPEAKER_ROW_STYLE,
  SPEAKER_NAME_GROUP_STYLE,
  INDEX_BADGE_BASE_STYLE,
  STAGE_DIRECTIONS_BASE_STYLE,
  ERROR_BADGE_CONTAINER_STYLE,
  ERROR_BADGE_STYLE,
} from './styles';

import '../CosmosBackground.css';

interface BaseNodeProps {
  data: DialogueNodeData;
  selected?: boolean;
  /** CSS class for the node wrapper ('dialogue-node' | 'choice-node') */
  nodeClassName: string;
  /** Node type key for getNodeColorTheme */
  nodeType: 'dialogueNode' | 'choiceNode';
  /** Theme node key to access theme.nodes[key] */
  themeNodeKey: 'dialogue' | 'choice';
  /** Lucide icon component for the header */
  icon: LucideIcon;
  /** Theme emoji key for icon (theme.icons[key]) */
  themeEmojiKey: 'dialogue' | 'choice';
  /** Emoji shown in index badge */
  indexBadgeEmoji?: string;
  /** Extra text appended to aria-label */
  ariaLabelExtra?: string;
  /** aria-expanded attribute (for choice nodes) */
  ariaExpanded?: boolean;
  /** Bottom margin for main text */
  textMarginBottom?: string;
  /** Choices for NodeHandles (choice nodes only) */
  choices?: DialogueChoice[];
  /** Choice handle position from layout (choice nodes only) */
  choiceHandlePosition?: Position;
  /** Additional content rendered after main text */
  children?: React.ReactNode;
}

export const BaseNode = React.memo(function BaseNode({
  data,
  selected,
  nodeClassName,
  nodeType,
  themeNodeKey,
  icon: Icon,
  themeEmojiKey,
  indexBadgeEmoji,
  ariaLabelExtra = '',
  ariaExpanded,
  textMarginBottom = '0',
  choices,
  choiceHandlePosition,
  children,
}: BaseNodeProps): React.JSX.Element {
  const { index, speaker, text, speakerMood, stageDirections, issues = [] } = data;
  const theme = useGraphTheme();
  const layout = useNodeLayout(data.serpentine, theme);
  const colors = getNodeColorTheme(nodeType, issues);
  const themeColors = theme.nodes[themeNodeKey];
  const sizes = theme.sizes;

  const avatarUrl = useCharacterAvatar(speaker, speakerMood || 'neutral');

  const hasErrors = issues.some((issue: ValidationProblem) => issue.type === 'error');
  const hasWarnings = issues.some((issue: ValidationProblem) => issue.type === 'warning');

  const bgColor = hasErrors || hasWarnings ? colors.bg : (themeColors.bgGradient || themeColors.bg);
  const borderColor = hasErrors || hasWarnings ? colors.border : themeColors.border;
  const textColor = hasErrors || hasWarnings ? colors.text : themeColors.text;
  const shadow = selected ? themeColors.shadowSelected : themeColors.shadow;

  const displayText = text ? (text.length > 80 ? text.substring(0, 80) + '...' : text) : '(Empty dialogue)';
  const displayStageDirections = stageDirections ? (stageDirections.length > 50 ? stageDirections.substring(0, 50) + '...' : stageDirections) : null;

  const ariaLabel = `Dialogue ${index + 1}${ariaLabelExtra}: ${speaker || 'Narrator'} dit "${displayText}"`;

  const nodeClasses = [
    nodeClassName,
    theme.animations.nodeHover,
    selected && theme.animations.nodeSelected
  ].filter(Boolean).join(' ');

  return (
    <div
      className={nodeClasses}
      role="treeitem"
      aria-label={ariaLabel}
      aria-selected={selected}
      aria-expanded={ariaExpanded}
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
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {theme.shapes?.decorativeElements && <DecorativeStars position={layout.decorativePosition} />}
      {theme.interactions?.showDragIndicators && <DragIndicator />}

      {data.serpentine && <SerpentineBadge layout={layout} />}
      {data.serpentine && <SerpentineRowIndicator layout={layout} />}
      {data.serpentine && <FlowDirectionIndicator layout={layout} />}

      <NodeHandles
        color={borderColor}
        bgColor={themeColors.bg}
        handleSize={sizes.handleSize}
        showDragIndicators={!!theme.interactions?.showDragIndicators}
        showLinkEmoji={!!theme.interactions?.showDragIndicators}
        choices={choices}
        choiceHandlePosition={choiceHandlePosition}
      />

      {/* Header: Avatar + Speaker + Index */}
      <div style={HEADER_ROW_STYLE}>
        <div style={{ ...AVATAR_BASE_STYLE, border: `2px solid ${borderColor}` }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={speaker} style={AVATAR_IMG_STYLE} />
          ) : (
            <User size={20} color={textColor} style={{ opacity: 0.5 }} />
          )}
        </div>

        <div style={SPEAKER_INFO_STYLE}>
          <div style={SPEAKER_ROW_STYLE}>
            <div style={SPEAKER_NAME_GROUP_STYLE}>
              {theme.icons?.useEmoji ? (
                <span style={{ fontSize: `${sizes.fontSizeSpeaker + 2}px`, lineHeight: 1 }}>
                  {theme.icons[themeEmojiKey]}
                </span>
              ) : (
                <Icon size={14} color={textColor} />
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

            <span
              style={{
                ...INDEX_BADGE_BASE_STYLE,
                fontSize: theme.icons?.useEmoji ? '16px' : '15px',
                color: COLORS.TEXT_DARK,
                backgroundColor: textColor,
                padding: theme.icons?.useEmoji ? '4px 12px' : '3px 10px',
              }}
            >
              {theme.icons?.useEmoji && indexBadgeEmoji && <span>{indexBadgeEmoji}</span>}
              {index + 1}
            </span>
          </div>
        </div>
      </div>

      {displayStageDirections && (
        <p style={{ ...STAGE_DIRECTIONS_BASE_STYLE, color: textColor, borderLeft: `3px solid ${borderColor}` }}>
          {theme.icons?.useEmoji ? '🎬 ' : ''}{displayStageDirections}
        </p>
      )}

      <p
        style={{
          fontSize: `${sizes.fontSizeText}px`,
          lineHeight: '1.6',
          color: textColor,
          margin: `0 0 ${textMarginBottom} 0`,
          wordWrap: 'break-word',
          opacity: 0.95
        }}
      >
        {displayText}
      </p>

      {children}

      {(hasErrors || hasWarnings) && (
        <div style={ERROR_BADGE_CONTAINER_STYLE}>
          {hasErrors && (
            <div
              style={{ ...ERROR_BADGE_STYLE, backgroundColor: COLORS.ERROR }}
              title={issues.filter((i: ValidationProblem) => i.type === 'error').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertCircle size={14} color={COLORS.TEXT_WHITE} />
            </div>
          )}
          {hasWarnings && (
            <div
              style={{ ...ERROR_BADGE_STYLE, backgroundColor: COLORS.WARNING }}
              title={issues.filter((i: ValidationProblem) => i.type === 'warning').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertTriangle size={14} color={COLORS.TEXT_WHITE} />
            </div>
          )}
        </div>
      )}

      {theme.shapes?.speechBubbleTail && (
        <SpeechBubbleTail color={themeColors.bgGradient?.match(/#[0-9a-fA-F]{6}/)?.[0] || themeColors.bg} />
      )}
    </div>
  );
});
