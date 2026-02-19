import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Edge,
  NodeMouseHandler,
  FitViewOptions,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './DialogueGraph.css';

import { useDialogueGraph } from '../../hooks/useDialogueGraph';
import { useDialogueGraphActions } from '../../hooks/useDialogueGraphActions';
import { useSerpentineSync } from '../../hooks/useSerpentineSync';
import { useLocalGraphState } from '../../hooks/useLocalGraphState';
import { nodeTypes } from './graph-nodes';
import { useValidation } from '../../hooks/useValidation';
import { dialogueNodeId, CHOICE_HANDLE_PREFIX } from '@/config/handleConfig';
import { useGraphTheme } from '@/hooks/useGraphTheme';
import { COSMOS_THEME_ID, GRAPH_VIEW } from '@/config/layoutConfig';
import { getEdgeTypes } from '@/config/edgeRegistry';
import { adaptValidation } from '@/utils/validationAdapter';
import { GRAPH_COLORS } from '@/config/colors';
import { GRAPH_CONTROLS_POSITION } from '@/config/cosmosConstants';
import { CosmosEdgeGradients } from './CosmosEdgeGradients';
import type { Scene, DialogueNodeData } from '@/types';
import type { GraphNode } from '@/hooks/graph-utils/types';

/**
 * Props for DialogueGraphInner component
 */
interface DialogueGraphInnerProps {
  selectedScene: Scene | null;
  selectedElement: { type: string; sceneId?: string; index?: number } | null;
  onSelectDialogue: (sceneId: string, dialogueIndex: number) => void;
  onOpenModal?: (modalType: string) => void;
  editMode?: boolean;
  layoutDirection?: 'TB' | 'LR';
}

// ─── Subcomponents ───────────────────────────────────────────────────

function EmptyGraphState(): React.JSX.Element {
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

function GraphKeyboardHints({ editMode }: { editMode: boolean }): React.JSX.Element {
  return (
    <div className="keyboard-hints">
      <div className="hint-item"><kbd>Click</kbd> to select</div>
      <div className="hint-item"><kbd>Double-click</kbd> to edit</div>
      {editMode && <div className="hint-item"><kbd>Drag</kbd> to move</div>}
      <div className="hint-item"><kbd>↑↓</kbd> to navigate</div>
      <div className="hint-item"><kbd>Esc</kbd> to deselect</div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────

function DialogueGraphInner({
  selectedScene,
  selectedElement,
  onSelectDialogue,
  editMode = false,
  layoutDirection = 'TB',
}: DialogueGraphInnerProps): React.JSX.Element {
  const { fitView } = useReactFlow();
  const validation = useValidation();
  const theme = useGraphTheme();
  const actions = useDialogueGraphActions(selectedScene?.id || '');
  const { recalculateEdges, serpentineEnabled } = useSerpentineSync();

  // Edge types from registry (theme-driven)
  const edgeTypes = useMemo(() => getEdgeTypes(theme.id), [theme.id]);

  const dialogues = selectedScene?.dialogues || [];
  const sceneId = selectedScene?.id || '';

  // Transform dialogues → graph structure (Dagre layout)
  const adaptedValidation = useMemo(() => adaptValidation(validation), [validation]);
  const { nodes: dagreNodes, edges } = useDialogueGraph(
    dialogues, sceneId, adaptedValidation, layoutDirection, theme
  );

  // Local graph state (nodes + edges + drag/reconnect handlers)
  const { localNodes, localEdges, onNodesChange, onNodeDragStop, reconnectLocalEdge } =
    useLocalGraphState(dagreNodes, edges, dialogues.length, serpentineEnabled, editMode, recalculateEdges);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Fit view on mount and when nodes change
  useEffect(() => {
    if (localNodes.length > 0) {
      setTimeout(() => {
        const fitViewOptions: FitViewOptions = { padding: GRAPH_VIEW.FIT_PADDING, duration: GRAPH_VIEW.FIT_DURATION_MS };
        fitView(fitViewOptions);
      }, GRAPH_VIEW.FIT_INIT_DELAY_MS);
    }
  }, [localNodes.length, fitView]);

  // Sync selected node with selectedElement from EditorShell
  useEffect(() => {
    if (selectedElement?.type === 'dialogue' && selectedElement?.sceneId === sceneId) {
      setSelectedNodeId(dialogueNodeId(sceneId, selectedElement.index!));
    } else {
      setSelectedNodeId(null);
    }
  }, [selectedElement, sceneId]);

  // Handle node click (select dialogue)
  const onNodeClick = useCallback<NodeMouseHandler>((_event, node) => {
    const dialogueIndex = (node.data as DialogueNodeData).index;
    if (dialogueIndex !== undefined) {
      onSelectDialogue(sceneId, dialogueIndex);
      setSelectedNodeId(node.id);
    }
  }, [sceneId, onSelectDialogue]);

  // Handle node double-click (edit dialogue)
  const onNodeDoubleClick = useCallback<NodeMouseHandler>((_event, node) => {
    const dialogueIndex = (node.data as DialogueNodeData).index;
    if (dialogueIndex !== undefined) {
      if (editMode) {
        actions.handleNodeDoubleClick(node.id);
      } else {
        onSelectDialogue(sceneId, dialogueIndex);
      }
    }
  }, [sceneId, onSelectDialogue, editMode, actions]);

  // Handle new connections (edit mode only)
  const onConnect = useCallback((params: Connection) => {
    if (!editMode) return;
    if (params.sourceHandle?.startsWith(CHOICE_HANDLE_PREFIX)) {
      actions.handleReconnectChoice(params);
    } else {
      actions.handleReconnectDialogue(params);
    }
    actions.handleConnectionEffect(window.innerWidth / 2, window.innerHeight / 2);
  }, [editMode, actions]);

  // Handle drag-to-reconnect on existing edges
  const onEdgeReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (!editMode) return;
      reconnectLocalEdge(oldEdge, newConnection);
      if (oldEdge.sourceHandle?.startsWith(CHOICE_HANDLE_PREFIX)) {
        actions.handleReconnectChoice(newConnection);
      } else {
        actions.handleReconnectDialogue(newConnection);
      }
    },
    [editMode, actions, reconnectLocalEdge]
  );

  // Validate connection before allowing it
  const isValidConnection = useCallback(
    (connection: Connection): boolean => {
      const { source, target } = connection;
      if (!source || !target) return false;
      if (source === target) return false;
      if (target.includes('-terminal')) return false;
      return true;
    },
    []
  );

  // Keyboard navigation (scoped to graph container)
  const handleKeyDown = useCallback((event: React.KeyboardEvent): void => {
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
      case 'Enter': {
        event.preventDefault();
        const node = localNodes[currentIndex];
        const nodeIndex = (node.data as DialogueNodeData).index;
        if (nodeIndex !== undefined) onSelectDialogue(sceneId, nodeIndex);
        break;
      }
      case 'Escape':
        event.preventDefault();
        setSelectedNodeId(null);
        onSelectDialogue(sceneId, -1);
        break;
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
      if (targetNodeIndex !== undefined) onSelectDialogue(sceneId, targetNodeIndex);
    }
  }, [selectedNodeId, localNodes, sceneId, onSelectDialogue, editMode, actions]);

  const nodesWithSelection = useMemo(
    () => localNodes.map((node: GraphNode) => ({ ...node, selected: node.id === selectedNodeId })),
    [localNodes, selectedNodeId]
  );

  const defaultEdgeOptions = useMemo(
    () => ({ type: theme.shapes?.edgeType || 'step', animated: false }),
    [theme.shapes?.edgeType]
  );

  // Empty state (after all hooks per React rules)
  if (dialogues.length === 0) return <EmptyGraphState />;

  return (
    <div className="dialogue-graph-container" onKeyDown={handleKeyDown} tabIndex={-1} data-edit-mode={editMode} data-theme={theme.id}>
      {theme.id === COSMOS_THEME_ID && <CosmosEdgeGradients />}

      <ReactFlow
        nodes={nodesWithSelection}
        edges={localEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onConnect={editMode ? onConnect : undefined}
        onReconnect={editMode ? onEdgeReconnect : undefined}
        reconnectRadius={20}
        isValidConnection={isValidConnection}
        nodesDraggable={editMode}
        fitView
        fitViewOptions={{ padding: GRAPH_VIEW.FIT_PADDING }}
        minZoom={GRAPH_VIEW.MIN_ZOOM}
        maxZoom={GRAPH_VIEW.MAX_ZOOM}
        defaultEdgeOptions={defaultEdgeOptions}
        className="dialogue-reactflow"
      >
        <Background variant={BackgroundVariant.Dots} gap={GRAPH_VIEW.GRID_GAP} size={1} color={GRAPH_COLORS.backgroundGrid} />
        <Controls showInteractive={false} className="dialogue-graph-controls" position="top-left" style={{ top: `${GRAPH_CONTROLS_POSITION.controls.top}px`, left: `${GRAPH_CONTROLS_POSITION.controls.left}px` }} />
        <MiniMap
          nodeColor={(node: GraphNode) => {
            if (node.type === 'choiceNode') return GRAPH_COLORS.minimap.choiceNode;
            if (node.type === 'terminalNode') return GRAPH_COLORS.minimap.terminalNode;
            return GRAPH_COLORS.minimap.dialogueNode;
          }}
          maskColor={GRAPH_COLORS.minimapMask}
          className="dialogue-graph-minimap"
          position="bottom-right"
          style={{ bottom: `${GRAPH_CONTROLS_POSITION.proMode.bottom}px`, right: `${GRAPH_CONTROLS_POSITION.proMode.right}px` }}
        />
      </ReactFlow>

      <GraphKeyboardHints editMode={editMode} />
    </div>
  );
}

/**
 * DialogueGraph — Wrapper with ReactFlowProvider
 */
export default function DialogueGraph(props: DialogueGraphInnerProps): React.JSX.Element {
  return (
    <ReactFlowProvider>
      <DialogueGraphInner {...props} />
    </ReactFlowProvider>
  );
}
