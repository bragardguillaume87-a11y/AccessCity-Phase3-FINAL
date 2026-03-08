import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { TriggerZoneData } from '@/types/behavior';
import { getNodeWrapperStyle, getHeaderStyle, getBodyStyle, NODE_EMOJIS, NODE_LABELS } from './nodeStyles';

interface Props { data: TriggerZoneData; selected?: boolean; }

export const TriggerZoneNode = React.memo(function TriggerZoneNode({ data, selected }: Props) {
  return (
    <div style={getNodeWrapperStyle('trigger-zone', !!selected)}>
      <Handle type="target" position={Position.Top} style={{ background: '#f59e0b' }} />

      <div style={getHeaderStyle('trigger-zone')}>
        <span>{NODE_EMOJIS['trigger-zone']}</span>
        <span>{NODE_LABELS['trigger-zone']}</span>
      </div>

      <div style={getBodyStyle('trigger-zone')}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>
          {data.label || 'Zone sans nom'}
        </div>
        {data.zoneId && (
          <div style={{ opacity: 0.6, fontSize: 10 }}>ID : {data.zoneId}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#f59e0b' }} />
    </div>
  );
});
