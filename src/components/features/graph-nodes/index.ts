export { BaseNode } from './BaseNode';
export { DialogueNode } from './DialogueNode';
export { ChoiceNode } from './ChoiceNode';
export { TerminalNode } from './TerminalNode';
export { RowSeparatorNode } from './RowSeparatorNode';
export { ClusterNode } from './ClusterNode';
export { MinigameNode } from './MinigameNode';
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
import { MinigameNode } from './MinigameNode';

export const nodeTypes = {
  dialogueNode: DialogueNode,
  choiceNode: ChoiceNode,
  terminalNode: TerminalNode,
  rowSeparatorNode: RowSeparatorNode,
  clusterNode: ClusterNode,
  minigameNode: MinigameNode,
} as const;
