import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Node,
  NodeMouseHandler,
  FitViewOptions,
  Connection,
  NodeChange,
  applyNodeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './DialogueGraph.css';

import { useDialogueGraph } from '../../hooks/useDialogueGraph';
import { useDialogueGraphActions } from '../../hooks/useDialogueGraphActions';
import { nodeTypes } from './DialogueGraphNodes.tsx';
import { useValidation } from '../../hooks/useValidation';
import { useGraphTheme } from '@/hooks/useGraphTheme';
import type { Scene, DialogueNodeData, TerminalNodeData } from '@/types';

/**
 * Props for DialogueGraphInner component
 */
interface DialogueGraphInnerProps {
  /** Selected scene to visualize */
  selectedScene: Scene | null;
  /** Currently selected element in the editor */
  selectedElement: { type: string; sceneId?: string; index?: number } | null;
  /** Callback when a dialogue is selected */
  onSelectDialogue: (sceneId: string, dialogueIndex: number) => void;
  /** Callback to open a modal (unused in current implementation) */
  onOpenModal?: (modalType: string) => void;
  /** Enable edit mode (PHASE 2): activates onConnect, onNodeDoubleClick → wizard, keyboard Delete/Duplicate */
  editMode?: boolean;
  /** Layout direction (PHASE 3.5): 'TB' = vertical (top-to-bottom), 'LR' = horizontal (left-to-right) */
  layoutDirection?: 'TB' | 'LR';
}

/**
 * Union type for all graph nodes
 */
type GraphNode = Node<DialogueNodeData> | Node<TerminalNodeData>;

/**
 * DialogueGraphInner - Main dialogue graph visualization component
 *
 * Features:
 * - ReactFlow-based node graph
 * - Auto-layout with dagre
 * - Click to select, double-click to edit
 * - Keyboard navigation
 * - Minimap and controls
 * - Synchronized with EditorShell selectedElement
 */
function DialogueGraphInner({
  selectedScene,
  selectedElement,
  onSelectDialogue,
  onOpenModal,
  editMode = false,
  layoutDirection = 'TB'  // PHASE 3.5: Default to vertical layout
}: DialogueGraphInnerProps): React.JSX.Element {
  const { fitView } = useReactFlow();
  const validation = useValidation();

  // PHASE 4: Get current theme for edge styles
  const theme = useGraphTheme();

  // Get dialogues from selected scene
  const dialogues = selectedScene?.dialogues || [];
  const sceneId = selectedScene?.id || '';

  // Transform dialogues to graph structure (Dagre layout)
  const { nodes: dagreNodes, edges } = useDialogueGraph(
    dialogues,
    sceneId,
    validation as { errors?: { dialogues?: Record<string, any[]> } } | null,
    layoutDirection,  // PHASE 3.5: Pass layout direction to Dagre
    theme  // PHASE 4: Pass theme for dynamic edge styles
  );

  // PHASE 2: Actions hook for edit mode
  const actions = useDialogueGraphActions(sceneId);

  // Local state for selected nodes
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // PHASE 4.5: Local state for node positions (enables manual dragging)
  // Store nodes with their positions - only update from Dagre when explicitly requested
  const [localNodes, setLocalNodes] = useState<GraphNode[]>(dagreNodes);
  const isInitialRender = useRef(true);
  const prevDialoguesLength = useRef(dialogues.length);

  // Sync local nodes with Dagre layout when:
  // 1. First render (initial layout)
  // 2. Dialogues count changes (node added/deleted)
  // 3. Layout direction changes (TB/LR toggle)
  // Note: Auto-layout button triggers re-render via key prop, which resets local state
  useEffect(() => {
    const dialoguesChanged = prevDialoguesLength.current !== dialogues.length;

    if (isInitialRender.current || dialoguesChanged) {
      setLocalNodes(dagreNodes);
      isInitialRender.current = false;
      prevDialoguesLength.current = dialogues.length;
    }
  }, [dagreNodes, dialogues.length]);

  // Handle node changes (position, selection) for manual dragging
  const onNodesChange = useCallback((changes: NodeChange<GraphNode>[]) => {
    setLocalNodes((nds) => applyNodeChanges(changes, nds) as GraphNode[]);
  }, []);

  // Fit view on mount and when nodes change
  useEffect(() => {
    if (localNodes.length > 0) {
      setTimeout(() => {
        const fitViewOptions: FitViewOptions = { padding: 0.2, duration: 300 };
        fitView(fitViewOptions);
      }, 100);
    }
  }, [localNodes.length, fitView]);

  // Sync selected node with selectedElement from EditorShell
  useEffect(() => {
    if (selectedElement?.type === 'dialogue' && selectedElement?.sceneId === sceneId) {
      const nodeId = `${sceneId}-d-${selectedElement.index}`;
      setSelectedNodeId(nodeId);
    } else {
      setSelectedNodeId(null);
    }
  }, [selectedElement, sceneId]);

  // Handle node click (select dialogue)
  const onNodeClick = useCallback<NodeMouseHandler>((event, node) => {
    const dialogueIndex = (node.data as DialogueNodeData).index;

    if (dialogueIndex !== undefined) {
      onSelectDialogue(sceneId, dialogueIndex);
      setSelectedNodeId(node.id);
    }
  }, [sceneId, onSelectDialogue]);

  // Handle node double-click (edit dialogue)
  const onNodeDoubleClick = useCallback<NodeMouseHandler>((event, node) => {
    const dialogueIndex = (node.data as DialogueNodeData).index;

    if (dialogueIndex !== undefined) {
      if (editMode) {
        // PHASE 2: In edit mode, open DialogueWizard
        actions.handleNodeDoubleClick(node.id);
      } else {
        // View mode: just select dialogue and scroll to it
        onSelectDialogue(sceneId, dialogueIndex);
      }
    }
  }, [sceneId, onSelectDialogue, editMode, actions]);

  // Handle connections (PHASE 2: edit mode only)
  const onConnect = useCallback((params: Connection) => {
    if (editMode) {
      actions.handleReconnectChoice(params);
      // PHASE 4: Cosmos sparkle effect on connection
      // Use center of viewport as fallback position
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      actions.handleConnectionEffect(centerX, centerY);
    }
  }, [editMode, actions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    if (!selectedNodeId) return;

    const currentIndex = localNodes.findIndex((n: GraphNode) => n.id === selectedNodeId);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        targetIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        targetIndex = Math.min(localNodes.length - 1, currentIndex + 1);
        break;
      case 'Enter':
        event.preventDefault();
        // Double-click behavior on Enter
        const node = localNodes[currentIndex];
        const nodeIndex = (node.data as DialogueNodeData).index;
        if (nodeIndex !== undefined) {
          onSelectDialogue(sceneId, nodeIndex);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setSelectedNodeId(null);
        onSelectDialogue(sceneId, -1);
        break;
      // PHASE 2: Edit mode keyboard shortcuts
      case 'Delete':
        if (editMode && selectedNodeId) {
          event.preventDefault();
          actions.handleDeleteNode(selectedNodeId);
          setSelectedNodeId(null);
        }
        break;
      case 'd':
        if (editMode && event.ctrlKey && selectedNodeId) {
          event.preventDefault();
          actions.handleDuplicateNode(selectedNodeId);
        }
        break;
      default:
        return;
    }

    if (targetIndex !== currentIndex) {
      const targetNode = localNodes[targetIndex];
      setSelectedNodeId(targetNode.id);
      const targetNodeIndex = (targetNode.data as DialogueNodeData).index;
      if (targetNodeIndex !== undefined) {
        onSelectDialogue(sceneId, targetNodeIndex);
      }
    }
  }, [selectedNodeId, localNodes, sceneId, onSelectDialogue, editMode, actions]);

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Check if node is selected
  const getNodeClassName = useCallback((node: GraphNode): string => {
    return node.id === selectedNodeId ? 'selected' : '';
  }, [selectedNodeId]);

  // Empty state
  if (dialogues.length === 0) {
    return (
      <div className="dialogue-graph-empty">
        <div className="empty-state">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="empty-title">No dialogues in this scene</h3>
          <p className="empty-description">
            Create dialogues to see the narrative flow visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dialogue-graph-container">
      <ReactFlow
        nodes={localNodes.map((node: GraphNode) => ({
          ...node,
          selected: node.id === selectedNodeId
        }))}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onConnect={editMode ? onConnect : undefined}
        nodesDraggable={editMode}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          // PHASE 6: Edge type from theme - 'bezier' for Cosmos (curves), 'step' for default (orthogonal)
          type: theme.shapes?.edgeType || 'step',
          animated: false
        }}
        className="dialogue-reactflow"
      >
        {/* Background grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#475569"
        />

        {/* Controls (zoom, fit view) */}
        <Controls
          showInteractive={false}
          className="dialogue-graph-controls"
        />

        {/* MiniMap */}
        <MiniMap
          nodeColor={(node: GraphNode) => {
            if (node.type === 'choiceNode') return '#8b5cf6';
            if (node.type === 'terminalNode') return '#f59e0b';
            return '#3b82f6';
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          className="dialogue-graph-minimap"
        />
      </ReactFlow>

      {/* Keyboard hints */}
      <div className="keyboard-hints">
        <div className="hint-item">
          <kbd>Click</kbd> to select
        </div>
        <div className="hint-item">
          <kbd>Double-click</kbd> to edit
        </div>
        {editMode && (
          <div className="hint-item">
            <kbd>Drag</kbd> to move
          </div>
        )}
        <div className="hint-item">
          <kbd>↑↓</kbd> to navigate
        </div>
        <div className="hint-item">
          <kbd>Esc</kbd> to deselect
        </div>
      </div>
    </div>
  );
}

/**
 * DialogueGraph - Wrapper with ReactFlowProvider
 *
 * This component provides the ReactFlow context to DialogueGraphInner.
 * Must be used as a wrapper to enable React Flow functionality.
 */
export default function DialogueGraph(props: DialogueGraphInnerProps): React.JSX.Element {
  return (
    <ReactFlowProvider>
      <DialogueGraphInner {...props} />
    </ReactFlowProvider>
  );
}
