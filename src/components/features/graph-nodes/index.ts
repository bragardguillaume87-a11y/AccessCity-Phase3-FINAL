export { BaseNode } from './BaseNode';
export { DialogueNode } from './DialogueNode';
export { ChoiceNode } from './ChoiceNode';
export { TerminalNode } from './TerminalNode';
export { SpeechBubbleTail, DecorativeStars, DragIndicator } from './NodeDecorations';
export { useCharacterAvatar } from './useCharacterAvatar';

/**
 * Node types configuration for ReactFlow
 */
import { DialogueNode } from './DialogueNode';
import { ChoiceNode } from './ChoiceNode';
import { TerminalNode } from './TerminalNode';

export const nodeTypes = {
  dialogueNode: DialogueNode,
  choiceNode: ChoiceNode,
  terminalNode: TerminalNode
} as const;
