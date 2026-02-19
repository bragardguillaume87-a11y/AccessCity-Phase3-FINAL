import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useGraphTheme } from '@/hooks/useGraphTheme';
import { COLORS } from '@/config/colors';
import type { TerminalNodeData } from '@/types';
import { NodeHandles } from '../NodeHandles';
import { truncateTerminalChoice } from '@/utils/textHelpers';
import { COSMOS_DIMENSIONS, COSMOS_ANIMATIONS, NODE_FONT } from '@/config/cosmosConstants';

interface TerminalNodeProps {
  data: TerminalNodeData;
  selected?: boolean;
}

/**
 * TerminalNode - Node representing a scene jump
 * Memoized to prevent unnecessary re-renders in ReactFlow.
 */
export const TerminalNode = React.memo(function TerminalNode({ data, selected }: TerminalNodeProps): React.JSX.Element {
  const { label, choiceText } = data;
  const theme = useGraphTheme();
  const themeColors = theme.nodes.terminal;
  const sizes = theme.sizes;

  const shadow = selected ? themeColors.shadowSelected : themeColors.shadow;

  const ariaLabel = `Saut vers scene: ${label}${choiceText ? ` (via "${choiceText}")` : ''}`;

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
        width: `${COSMOS_DIMENSIONS.terminal.width}px`,
        minHeight: `${COSMOS_DIMENSIONS.terminal.minHeight}px`,
        boxShadow: shadow,
        transition: COSMOS_ANIMATIONS.transitionFast,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      <NodeHandles
        color={themeColors.border}
        bgColor={themeColors.bg}
        handleSize={sizes.handleSize}
        borderWidth={2}
      />

      {theme.icons?.useEmoji ? (
        <span style={{ fontSize: `${NODE_FONT.icon}px`, lineHeight: 1 }}>
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
              fontSize: `${NODE_FONT.badge}px`,
              color: themeColors.text,
              opacity: 0.8,
              margin: '4px 0 0 0',
              fontStyle: 'italic'
            }}
          >
            "{truncateTerminalChoice(choiceText)}"
          </p>
        )}
      </div>
    </div>
  );
});
