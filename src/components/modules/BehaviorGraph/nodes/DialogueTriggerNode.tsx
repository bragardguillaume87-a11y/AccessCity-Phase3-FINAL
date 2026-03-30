import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { DialogueTriggerData } from '@/types/behavior';
import { getNodeWrapperStyle, getHeaderStyle, getBodyStyle, NODE_EMOJIS, NODE_LABELS } from './nodeStyles';

interface Props { data: DialogueTriggerData; selected?: boolean; }

export const DialogueTriggerNode = React.memo(function DialogueTriggerNode({ data, selected }: Props) {
  return (
    <div style={getNodeWrapperStyle('dialogue-trigger', !!selected)}>
      <Handle type="target" position={Position.Top} style={{ background: '#a855f7' }} />

      <div style={getHeaderStyle('dialogue-trigger')}>
        <span>{NODE_EMOJIS['dialogue-trigger']}</span>
        <span>{NODE_LABELS['dialogue-trigger']}</span>
      </div>

      <div style={getBodyStyle('dialogue-trigger')}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>
          {data.sceneTitle || 'Scène non définie'}
        </div>
        {data.sceneId && (
          <div style={{ opacity: 0.5, fontSize: 10 }}>ID : {data.sceneId}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#a855f7' }} />
    </div>
  );
});
