import React from 'react';
import { GitBranch } from 'lucide-react';
import type { DialogueNodeData } from '@/types';
import { useGraphTheme } from '@/hooks/useGraphTheme';
import { useNodeLayout } from '@/hooks/useNodeLayout';
import { truncateChoicePreview, getIssueStatus } from '@/utils/textHelpers';
import { COSMOS_ANIMATIONS, NODE_FONT } from '@/config/cosmosConstants';
import { COLORS } from '@/config/colors';
import { BaseNode } from './BaseNode';
import {
  CHOICE_PREVIEW_CONTAINER_STYLE,
  CHOICE_BADGE_BASE_STYLE,
  BRANCH_LINES_SVG_STYLE,
  CHOICE_COLORS,
} from './styles';

interface ChoiceNodeProps {
  data: DialogueNodeData;
  selected?: boolean;
}

/**
 * ChoiceNode - Dialogue node with branching choices
 * Uses BaseNode for shared shell, adds choice-specific content as children.
 */
export const ChoiceNode = React.memo(function ChoiceNode({ data, selected }: ChoiceNodeProps): React.JSX.Element {
  const { choices = [], issues = [] } = data;
  const theme = useGraphTheme();
  const layout = useNodeLayout(data.serpentine, theme);

  const themeColors = theme.nodes.choice;
  const { hasErrors, hasWarnings } = getIssueStatus(issues);
  const borderColor = hasErrors || hasWarnings
    ? (hasErrors ? COLORS.ERROR : COLORS.WARNING)
    : themeColors.border;
  const textColor = hasErrors || hasWarnings
    ? COLORS.TEXT_WHITE
    : themeColors.text;

  return (
    <BaseNode
      data={data}
      selected={selected}
      nodeClassName="choice-node"
      nodeType="choiceNode"
      themeNodeKey="choice"
      icon={GitBranch}
      themeEmojiKey="choice"
      indexBadgeEmoji="🚀"
      ariaLabelExtra={` avec ${choices.length} choix`}
      ariaExpanded={choices.length > 0}
      textMarginBottom="8px"
      choices={choices}
      choiceHandlePosition={layout.choiceHandles.position}
    >
      {/* Choices preview */}
      <div style={CHOICE_PREVIEW_CONTAINER_STYLE}>
        {choices.slice(0, 3).map((choice, i) => (
          <span
            key={choice.id}
            style={{
              ...CHOICE_BADGE_BASE_STYLE,
              backgroundColor: `${CHOICE_COLORS[i % CHOICE_COLORS.length]}20`,
              border: `2px solid ${CHOICE_COLORS[i % CHOICE_COLORS.length]}`,
              color: CHOICE_COLORS[i % CHOICE_COLORS.length],
            }}
          >
            {theme.icons?.useEmoji && <span>✨</span>}
            {truncateChoicePreview(choice.text, `Choix ${i + 1}`)}
          </span>
        ))}
        {choices.length > 3 && (
          <span style={{ fontSize: `${NODE_FONT.badge}px`, color: textColor, opacity: 0.7, padding: '4px 8px' }}>
            +{choices.length - 3}
          </span>
        )}
      </div>

      {/* Y-shape indicator */}
      <div
        className="y-shape-indicator"
        style={{
          position: 'absolute',
          top: '8px',
          [layout.branchLines.indicatorSide]: '8px',
          width: `${NODE_FONT.icon}px`,
          height: `${NODE_FONT.icon}px`,
          opacity: 0.5,
          transition: COSMOS_ANIMATIONS.transitionNormal,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 4 L12 10 M8 16 L12 10 M16 16 L12 10"
            stroke={borderColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Branch lines */}
      {choices.length > 1 && (() => {
        const { edgeX, innerX } = layout.branchLines;
        return (
          <svg className="choice-branch-lines" style={BRANCH_LINES_SVG_STYLE}>
            <line
              x1={edgeX}
              y1={`${((0 + 1) / (choices.length + 1)) * 100}%`}
              x2={edgeX}
              y2={`${((choices.length) / (choices.length + 1)) * 100}%`}
              stroke={borderColor}
              strokeWidth="2"
              strokeDasharray="4 2"
              className="branch-connector"
            />
            {choices.map((choice, idx) => {
              const topPos = ((idx + 1) / (choices.length + 1)) * 100;
              return (
                <line
                  key={choice.id}
                  x1={innerX}
                  y1={`${topPos}%`}
                  x2={edgeX}
                  y2={`${topPos}%`}
                  stroke={borderColor}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  className="branch-line"
                />
              );
            })}
          </svg>
        );
      })()}
    </BaseNode>
  );
});
