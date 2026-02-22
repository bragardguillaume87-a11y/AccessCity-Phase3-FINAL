import type { Node } from '@xyflow/react';
import type { DialogueNodeData, TerminalNodeData, ClusterNodeData } from '@/types';
import type { RowSeparatorNodeData } from '@/components/features/graph-nodes/RowSeparatorNode';

/**
 * Union type for all graph node types
 */
export type GraphNode = Node<DialogueNodeData> | Node<TerminalNodeData> | Node<RowSeparatorNodeData> | Node<ClusterNodeData>;
