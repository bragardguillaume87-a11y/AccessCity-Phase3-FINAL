import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { ActionData } from '@/types/behavior';
import { getNodeWrapperStyle, getHeaderStyle, getBodyStyle, NODE_EMOJIS, NODE_LABELS } from './nodeStyles';

const ACTION_TYPE_LABELS: Record<ActionData['type'], string> = {
  'set-variable':  'Définir variable',
  'add-variable':  'Ajouter à variable',
  'play-sound':    'Jouer un son',
  'show-message':  'Afficher message',
};

interface Props { data: ActionData; selected?: boolean; }

export const ActionNode = React.memo(function ActionNode({ data, selected }: Props) {
  const typeLabel = ACTION_TYPE_LABELS[data.type] ?? data.type;

  return (
    <div style={getNodeWrapperStyle('action', !!selected)}>
      <Handle type="target" position={Position.Top} style={{ background: '#22c55e' }} />

      <div style={getHeaderStyle('action')}>
        <span>{NODE_EMOJIS['action']}</span>
        <span>{NODE_LABELS['action']}</span>
      </div>

      <div style={getBodyStyle('action')}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{typeLabel}</div>
        {data.variable && (
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            {data.variable}
            {data.value !== undefined ? ` = ${data.value}` : ''}
          </div>
        )}
        {data.message && (
          <div style={{ fontSize: 11, opacity: 0.8, fontStyle: 'italic' }}>
            "{String(data.message).slice(0, 40)}{String(data.message).length > 40 ? '…' : ''}"
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#22c55e' }} />
    </div>
  );
});
