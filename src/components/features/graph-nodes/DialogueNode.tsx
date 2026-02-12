import React from 'react';
import { MessageSquare } from 'lucide-react';
import type { DialogueNodeData } from '@/types';
import { BaseNode } from './BaseNode';

interface DialogueNodeProps {
  data: DialogueNodeData;
  selected?: boolean;
}

/**
 * DialogueNode - Standard dialogue node
 * Delegates all rendering to BaseNode shared component.
 */
export const DialogueNode = React.memo(function DialogueNode({ data, selected }: DialogueNodeProps): React.JSX.Element {
  return (
    <BaseNode
      data={data}
      selected={selected}
      nodeClassName="dialogue-node"
      nodeType="dialogueNode"
      themeNodeKey="dialogue"
      icon={MessageSquare}
      themeEmojiKey="dialogue"
      indexBadgeEmoji="💬"
    />
  );
});
