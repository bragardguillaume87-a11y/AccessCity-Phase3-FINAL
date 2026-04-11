import React, { useCallback } from 'react';
import { AlertCircle, AlertTriangle, User, Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getNodeColorTheme } from '@/hooks/useDialogueGraph';
import { useGraphTheme } from '@/hooks/useGraphTheme';
import { COLORS } from '@/config/colors';
import type { DialogueNodeData, DialogueChoice, ValidationProblem } from '@/types';
import { truncateNodeText, truncateStageDirections, getIssueStatus } from '@/utils/textHelpers';
import { useUIStore } from '@/stores';
import { COSMOS_ANIMATIONS, NODE_FONT, TRUNCATION } from '@/config/cosmosConstants';
import { SerpentineBadge } from '../SerpentineBadge';
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
  children,
}: BaseNodeProps): React.JSX.Element {
  const { index, speaker, text, speakerMood, stageDirections, issues = [], responseLabel } = data;
  const theme = useGraphTheme();
  const layout = useNodeLayout(data.serpentine, theme);
  const colors = getNodeColorTheme(nodeType, issues);
  const themeColors = theme.nodes[themeNodeKey];
  const sizes = theme.sizes;

  const avatarUrl = useCharacterAvatar(speaker, speakerMood || 'neutral');
  const setWizardOpen = useUIStore((s) => s.setDialogueWizardOpen);
  const setEditIndex = useUIStore((s) => s.setDialogueWizardEditIndex);

  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditIndex(index);
      setWizardOpen(true);
    },
    [index, setEditIndex, setWizardOpen]
  );

  const { hasErrors, hasWarnings } = getIssueStatus(issues);
  const hasIssues = hasErrors || hasWarnings;

  const bgColor = themeColors.headerBg
    ? hasIssues
      ? colors.bg
      : themeColors.bg
    : hasIssues
      ? colors.bg
      : themeColors.bgGradient || themeColors.bg;
  const borderColor = hasIssues ? colors.border : themeColors.border;

  // Header strip: uses headerBgGradient (CSS gradient) when available, falls back to solid headerBg.
  // Note: outputColor (SVG handles) still receives headerBg (solid) — CSS gradients aren't valid SVG stroke colors.
  const headerVisualBg = hasIssues
    ? colors.border
    : themeColors.headerBgGradient || themeColors.headerBg;
  const headerWrapperStyle: React.CSSProperties = themeColors.headerBg
    ? {
        margin: '-12px -12px 10px -12px',
        padding: '10px 12px',
        background: headerVisualBg,
        borderRadius: `${sizes.nodeBorderRadius}px ${sizes.nodeBorderRadius}px 0 0`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.2)',
      }
    : HEADER_ROW_STYLE;
  const textColor = hasIssues ? colors.text : themeColors.text;
  // On a colored header, always use white text for maximum contrast
  const headerTextColor = themeColors.headerBg ? '#ffffff' : textColor;
  const shadow = selected ? themeColors.shadowSelected : themeColors.shadow;
  const borderWidth = selected ? '3px' : '2px';

  // Choice nodes get a thicker left accent border for instant visual differentiation (n8n/Unreal pattern)
  const isChoiceAccent = themeNodeKey === 'choice' && themeColors.headerBg && !hasIssues;
  const accentLeftBorder = isChoiceAccent
    ? `4px solid ${selected ? COLORS.SELECTED : themeColors.headerBg || borderColor}`
    : undefined;

  // Floating index chip: used when headerBg is present (default + blender themes).
  // Cosmos/legacy themes keep the in-header badge (no headerBg).
  const showFloatingChip = !!themeColors.headerBg;

  const displayText = truncateNodeText(text);
  const displayStageDirections = truncateStageDirections(stageDirections) || null;

  const ariaLabel = `Dialogue ${index + 1}${ariaLabelExtra}: ${speaker || 'Narrator'} dit "${displayText}"`;

  const nodeClasses = [
    nodeClassName,
    theme.animations.nodeHover,
    selected && theme.animations.nodeSelected,
  ]
    .filter(Boolean)
    .join(' ');

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
        borderWidth,
        borderStyle: 'solid',
        borderLeft: accentLeftBorder,
        borderRadius: `${sizes.nodeBorderRadius}px`,
        padding: '12px',
        width: `${sizes.nodeWidth}px`,
        minHeight: `${sizes.nodeMinHeight}px`,
        boxShadow: shadow,
        transition: COSMOS_ANIMATIONS.transitionFast,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {theme.shapes?.decorativeElements &&
        // In serpentine mode, only show stars on first/last node to reduce visual noise
        (!data.serpentine || data.serpentine.isFirst || data.serpentine.isLast) && (
          <DecorativeStars position={layout.decorativePosition} />
        )}
      {theme.interactions?.showDragIndicators && <DragIndicator />}

      {data.serpentine && <SerpentineBadge layout={layout} />}
      {data.serpentine && <FlowDirectionIndicator layout={layout} />}

      <NodeHandles
        color={borderColor}
        bgColor={themeColors.bg}
        handleSize={sizes.handleSize}
        showDragIndicators={!!theme.interactions?.showDragIndicators}
        showLinkEmoji={!!theme.interactions?.showDragIndicators}
        choices={choices}
        choiceHandlePosition={layout.choiceHandles.position}
        inputColor={themeColors.headerBg ? '#8a9ba8' : undefined}
        outputColor={themeColors.headerBg ? themeColors.headerBg : undefined}
        handleOpacity={themeColors.headerBg ? 0.85 : 0.2}
      />

      {/* Header: Index + Avatar + Speaker */}
      <div style={headerWrapperStyle}>
        {/* Grand numéro à gauche de l'avatar — visible uniquement sur les thèmes avec header coloré */}
        {showFloatingChip && (
          <div
            aria-hidden="true"
            style={{
              alignSelf: 'center',
              minWidth: '28px',
              textAlign: 'center',
              flexShrink: 0,
              paddingRight: '10px',
              marginRight: '2px',
              borderRight: '1px solid rgba(255,255,255,0.18)',
              fontSize: '22px',
              fontWeight: 900,
              lineHeight: 1,
              color: 'rgba(255,255,255,0.95)',
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums' as React.CSSProperties['fontVariantNumeric'],
              fontFeatureSettings: '"tnum" 1, "lnum" 1',
              textShadow: '0 1px 6px rgba(0,0,0,0.5)',
            }}
          >
            {responseLabel ?? index + 1}
          </div>
        )}

        <div
          style={{
            ...AVATAR_BASE_STYLE,
            border: `2px solid ${themeColors.headerBg ? 'rgba(255,255,255,0.3)' : borderColor}`,
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={speaker} style={AVATAR_IMG_STYLE} />
          ) : (
            <User size={20} color={headerTextColor} style={{ opacity: 0.6 }} />
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
                <Icon size={14} color={headerTextColor} />
              )}
              <span
                style={{
                  fontSize: `${sizes.fontSizeSpeaker}px`,
                  fontWeight: '700',
                  color: headerTextColor,
                  letterSpacing: '0.02em',
                }}
              >
                {speaker || 'Narrator'}
              </span>
              {speakerMood && speakerMood !== 'neutral' && (
                <span
                  style={{
                    fontSize: `${NODE_FONT.meta}px`,
                    color: headerTextColor,
                    opacity: 0.9,
                    fontStyle: 'italic',
                  }}
                >
                  ({speakerMood})
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* In-header badge: only for themes without floating chip (Cosmos/legacy) */}
              {!showFloatingChip && (
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
                  {responseLabel ?? index + 1}
                </span>
              )}
              <button
                onClick={handleEditClick}
                title="Éditer ce dialogue"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: headerTextColor,
                  opacity: 0.7,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.7';
                }}
              >
                <Pencil size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {displayStageDirections && (
        <p
          style={{
            ...STAGE_DIRECTIONS_BASE_STYLE,
            color: textColor,
            borderLeft: `3px solid ${borderColor}`,
          }}
          title={
            stageDirections && stageDirections.length > TRUNCATION.stageDirections
              ? stageDirections
              : undefined
          }
        >
          {theme.icons?.useEmoji ? '🎬 ' : ''}
          {displayStageDirections}
        </p>
      )}

      <p
        style={{
          fontSize: `${sizes.fontSizeText}px`,
          lineHeight: '1.5', // 1.5 vs 1.6 : densité professionnelle (n8n, Blender standard)
          color: textColor,
          margin: `0 0 ${textMarginBottom} 0`,
          wordWrap: 'break-word',
          opacity: 0.88,
        }}
        title={text && text.length > TRUNCATION.nodeText ? text : undefined}
      >
        {displayText}
      </p>

      {children}

      {(hasErrors || hasWarnings) && (
        <div style={ERROR_BADGE_CONTAINER_STYLE}>
          {hasErrors && (
            <div
              style={{ ...ERROR_BADGE_STYLE, backgroundColor: COLORS.ERROR }}
              title={issues
                .filter((i: ValidationProblem) => i.type === 'error')
                .map((i: ValidationProblem) => i.message)
                .join(', ')}
            >
              <AlertCircle size={14} color={COLORS.TEXT_WHITE} />
            </div>
          )}
          {hasWarnings && (
            <div
              style={{ ...ERROR_BADGE_STYLE, backgroundColor: COLORS.WARNING }}
              title={issues
                .filter((i: ValidationProblem) => i.type === 'warning')
                .map((i: ValidationProblem) => i.message)
                .join(', ')}
            >
              <AlertTriangle size={14} color={COLORS.TEXT_WHITE} />
            </div>
          )}
        </div>
      )}

      {theme.shapes?.speechBubbleTail && (
        <SpeechBubbleTail
          color={themeColors.bgGradient?.match(/#[0-9a-fA-F]{6}/)?.[0] || themeColors.bg}
        />
      )}
    </div>
  );
});
