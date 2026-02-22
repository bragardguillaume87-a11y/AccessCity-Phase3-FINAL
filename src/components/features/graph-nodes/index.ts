export { BaseNode } from './BaseNode';
export { DialogueNode } from './DialogueNode';
export { ChoiceNode } from './ChoiceNode';
export { TerminalNode } from './TerminalNode';
export { RowSeparatorNode } from './RowSeparatorNode';
export { ClusterNode } from './ClusterNode';
export { SpeechBubbleTail, DecorativeStars, DragIndicator } from './NodeDecorations';
export { useCharacterAvatar } from './useCharacterAvatar';

/**
 * Node types configuration for ReactFlow
 */
import { DialogueNode } from './DialogueNode';
import { ChoiceNode } from './ChoiceNode';
import { TerminalNode } from './TerminalNode';
import { RowSeparatorNode } from './RowSeparatorNode';
import { ClusterNode } from './ClusterNode';

export const nodeTypes = {
  dialogueNode: DialogueNode,
  choiceNode: ChoiceNode,
  terminalNode: TerminalNode,
  rowSeparatorNode: RowSeparatorNode,
  clusterNode: ClusterNode,
} as const;
