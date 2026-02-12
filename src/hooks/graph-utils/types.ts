import type { Node } from '@xyflow/react';
import type { DialogueNodeData, TerminalNodeData } from '@/types';

/**
 * Union type for all graph node types
 */
export type GraphNode = Node<DialogueNodeData> | Node<TerminalNodeData>;
