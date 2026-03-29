import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Gamepad2 } from 'lucide-react';
import { useGraphTheme } from '@/hooks/useGraphTheme';
import { COLORS } from '@/config/colors';
import { COSMOS_ANIMATIONS, NODE_FONT } from '@/config/cosmosConstants';
import type { DialogueNodeData } from '@/types';
import { truncateNodeText } from '@/utils/textHelpers';

interface MinigameNodeProps {
  data: DialogueNodeData;
  selected?: boolean;
}

const MINIGAME_TYPE_LABEL: Record<string, string> = {
  falc: '🗂️ FALC',
  qte: '⌨️ QTE',
  braille: '⠿ Braille',
};

/**
 * MinigameNode — Graph node for minigame dialogues.
 * Two output handles: ✓ Succès (green) and ✗ Échec (red).
 */
export const MinigameNode = React.memo(function MinigameNode({
  data,
  selected,
}: MinigameNodeProps): React.JSX.Element {
  const theme = useGraphTheme();
  const sizes = theme.sizes;

  const displayText = truncateNodeText(data.text);
  const minigameType = (data as { minigameType?: string }).minigameType;
  const typeLabel = minigameType
    ? (MINIGAME_TYPE_LABEL[minigameType] ?? '🎮 Mini-jeu')
    : '🎮 Mini-jeu';

  const bgColor = 'rgba(20, 184, 166, 0.12)';
  const borderColor = selected ? COLORS.SELECTED : '#14b8a6';
  const shadow = selected
    ? '0 0 0 2px rgba(20,184,166,0.5), 0 8px 24px rgba(0,0,0,0.35)'
    : '0 4px 12px rgba(0,0,0,0.25)';
  const borderWidth = selected ? '3px' : '2px';

  const nodeClasses = [
    'minigame-node',
    theme.animations.nodeHover,
    selected && theme.animations.nodeSelected,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={nodeClasses}
      role="treeitem"
      aria-label={`Mini-jeu : ${data.speaker || 'Scène'} — ${displayText}`}
      aria-selected={selected}
      tabIndex={0}
      style={{
        background: bgColor,
        borderColor,
        borderWidth,
        borderStyle: 'solid',
        borderRadius: `${sizes.nodeBorderRadius}px`,
        padding: '12px',
        width: `${sizes.nodeWidth}px`,
        boxShadow: shadow,
        transition: COSMOS_ANIMATIONS.transitionFast,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{
          background: '#14b8a6',
          width: sizes.handleSize,
          height: sizes.handleSize,
          border: '2px solid rgba(0,0,0,0.3)',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(20,184,166,0.25)',
            border: '2px solid #14b8a6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Gamepad2 size={14} color="#14b8a6" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: NODE_FONT.badge,
              fontWeight: 700,
              color: '#14b8a6',
              letterSpacing: '0.04em',
            }}
          >
            {typeLabel}
          </div>
          {data.speaker && (
            <div style={{ fontSize: NODE_FONT.meta, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
              {data.speaker}
            </div>
          )}
        </div>
      </div>

      {/* Text preview */}
      <p
        style={{
          fontSize: `${sizes.fontSizeText}px`,
          lineHeight: '1.5',
          color: 'rgba(255,255,255,0.82)',
          margin: '0 0 10px 0',
          wordWrap: 'break-word',
        }}
      >
        {displayText}
      </p>

      {/* Success / Failure output handles */}
      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: NODE_FONT.badge }}>
        <span style={{ color: '#22c55e', fontWeight: 700 }}>✓ Succès</span>
        <span style={{ color: '#ef4444', fontWeight: 700 }}>✗ Échec</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        style={{
          left: '30%',
          background: '#22c55e',
          width: sizes.handleSize,
          height: sizes.handleSize,
          border: '2px solid rgba(0,0,0,0.3)',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="failure"
        style={{
          left: '70%',
          background: '#ef4444',
          width: sizes.handleSize,
          height: sizes.handleSize,
          border: '2px solid rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
});

export default MinigameNode;
