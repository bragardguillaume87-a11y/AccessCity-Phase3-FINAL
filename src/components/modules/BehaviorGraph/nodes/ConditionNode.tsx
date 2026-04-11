import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { ConditionData } from '@/types/behavior';
import { getNodeWrapperStyle, getHeaderStyle, getBodyStyle, NODE_EMOJIS, NODE_LABELS } from './nodeStyles';

interface Props { data: ConditionData; selected?: boolean; }

export const ConditionNode = React.memo(function ConditionNode({ data, selected }: Props) {
  const summary = data.variable
    ? `${data.variable} ${data.operator} ${data.value}`
    : 'Configurer la condition…';

  return (
    <div style={getNodeWrapperStyle('condition', !!selected)}>
      <Handle type="target" position={Position.Top} style={{ background: '#6366f1' }} />

      <div style={getHeaderStyle('condition')}>
        <span>{NODE_EMOJIS['condition']}</span>
        <span>{NODE_LABELS['condition']}</span>
      </div>

      <div style={getBodyStyle('condition')}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(255,255,255,0.07)', padding: '4px 6px', borderRadius: 4 }}>
          {summary}
        </div>
      </div>

      {/* Two output handles: OUI (left) et NON (right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: '30%', background: '#22c55e' }}
        title="Oui"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: '70%', background: '#ef4444' }}
        title="Non"
      />

      {/* Labels yes/no */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px 6px', fontSize: 9, opacity: 0.7, color: '#e0e7ff' }}>
        <span style={{ color: '#86efac' }}>OUI</span>
        <span style={{ color: '#fca5a5' }}>NON</span>
      </div>
    </div>
  );
});
