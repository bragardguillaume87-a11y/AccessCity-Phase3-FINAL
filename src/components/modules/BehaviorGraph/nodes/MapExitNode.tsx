import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { MapExitData } from '@/types/behavior';
import { getNodeWrapperStyle, getHeaderStyle, getBodyStyle, NODE_EMOJIS, NODE_LABELS } from './nodeStyles';

interface Props { data: MapExitData; selected?: boolean; }

export const MapExitNode = React.memo(function MapExitNode({ data, selected }: Props) {
  return (
    <div style={getNodeWrapperStyle('map-exit', !!selected)}>
      <Handle type="target" position={Position.Top} style={{ background: '#64748b' }} />

      <div style={getHeaderStyle('map-exit')}>
        <span>{NODE_EMOJIS['map-exit']}</span>
        <span>{NODE_LABELS['map-exit']}</span>
      </div>

      <div style={getBodyStyle('map-exit')}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>
          {data.targetMapName || 'Carte non définie'}
        </div>
        {data.targetMapId && (
          <div style={{ opacity: 0.5, fontSize: 10 }}>ID : {data.targetMapId}</div>
        )}
      </div>

      {/* Terminal node — no source handle */}
    </div>
  );
});
