import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useMapsStore } from '@/stores/mapsStore';
import { behaviorNodeTypes } from './nodes';
import { useBehaviorGraphState } from './hooks/useBehaviorGraphState';
import { NODE_EMOJIS, NODE_LABELS } from './nodes/nodeStyles';
import type { BehaviorNodeType } from '@/types/behavior';

// ── Toolbar node types (ordered by workflow logic) ────────────────────────

const TOOLBAR_NODES: BehaviorNodeType[] = [
  'trigger-zone',
  'condition',
  'action',
  'dialogue-trigger',
  'map-exit',
];

const TOOLBAR_COLORS: Record<BehaviorNodeType, string> = {
  'trigger-zone':     '#d97706',
  'condition':        '#4f46e5',
  'action':           '#16a34a',
  'dialogue-trigger': '#9333ea',
  'map-exit':         '#475569',
};

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ hasMap }: { hasMap: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--color-text-muted)', padding: 32 }}>
      <span style={{ fontSize: 48 }}>🔗</span>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-text-base)' }}>
        {hasMap ? 'Graphe vide' : 'Aucune carte disponible'}
      </h3>
      <p style={{ margin: 0, fontSize: 13, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
        {hasMap
          ? 'Utilisez la barre latérale gauche pour ajouter des nodes et définir la logique du jeu.'
          : 'Créez d\'abord une carte dans l\'onglet "Carte 2D", puis revenez ici pour définir ses comportements.'}
      </p>
    </div>
  );
}

// ── Toolbar ──────────────────────────────────────────────────────────────

function NodeToolbar({ onAdd }: { onAdd: (type: BehaviorNodeType) => void }) {
  return (
    <aside style={{
      width: 160,
      flexShrink: 0,
      background: 'var(--color-card)',
      borderRight: '1px solid var(--color-border-base)',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 8px',
      gap: 4,
      overflowY: 'auto',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
        Ajouter un node
      </p>
      {TOOLBAR_NODES.map(type => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          title={`Ajouter : ${NODE_LABELS[type]}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            background: 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${TOOLBAR_COLORS[type]}44`,
            borderRadius: 6,
            cursor: 'pointer',
            color: 'var(--color-text-base)',
            fontSize: 12,
            fontWeight: 500,
            transition: 'background 0.12s, border-color 0.12s',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = `${TOOLBAR_COLORS[type]}22`;
            (e.currentTarget as HTMLButtonElement).style.borderColor = TOOLBAR_COLORS[type];
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = `${TOOLBAR_COLORS[type]}44`;
          }}
        >
          <span style={{ fontSize: 15 }}>{NODE_EMOJIS[type]}</span>
          <span>{NODE_LABELS[type]}</span>
        </button>
      ))}

      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--color-border-base)', fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Raccourcis</p>
        <p style={{ margin: 0 }}>Glisser = déplacer</p>
        <p style={{ margin: 0 }}>Suppr = supprimer</p>
        <p style={{ margin: 0 }}>Scroll = zoom</p>
      </div>
    </aside>
  );
}

// ── Inner (uses useReactFlow) ────────────────────────────────────────────

function BehaviorGraphInner({ mapId }: { mapId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useBehaviorGraphState(mapId);
  const { getViewport } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  // Ajoute le node au centre visible du canvas
  const handleAddNode = useCallback((type: BehaviorNodeType) => {
    const vp = getViewport();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = (rect.width / 2 - vp.x) / vp.zoom;
      const cy = (rect.height / 2 - vp.y) / vp.zoom;
      addNode(type, { x: cx - 90, y: cy - 40 });
    } else {
      addNode(type);
    }
  }, [getViewport, addNode]);

  const hasNodes = nodes.length > 0;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <NodeToolbar onAdd={handleAddNode} />
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
        {!hasNodes && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState hasMap={true} />
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={behaviorNodeTypes}
          deleteKeyCode="Delete"
          fitView={hasNodes}
          fitViewOptions={{ padding: 0.2 }}
          colorMode="dark"
          style={{ background: 'var(--color-background)' }}
        >
          <Controls />
          <MiniMap
            style={{ background: 'var(--color-card)' }}
            nodeColor={(node: Node) => {
              const colors: Record<string, string> = {
                'trigger-zone': '#f59e0b', 'condition': '#6366f1',
                'action': '#22c55e', 'dialogue-trigger': '#a855f7', 'map-exit': '#64748b',
              };
              return colors[node.type ?? ''] ?? '#888';
            }}
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.06)" />
        </ReactFlow>
      </div>
    </div>
  );
}

// ── Map Selector ─────────────────────────────────────────────────────────

function MapSelector({ selectedMapId, onSelect }: { selectedMapId: string | null; onSelect: (id: string) => void }) {
  const maps = useMapsStore(s => s.maps);

  if (maps.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 36, flexShrink: 0, borderBottom: '1px solid var(--color-border-base)', background: 'var(--color-card)' }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Carte :</span>
      <select
        value={selectedMapId ?? ''}
        onChange={e => onSelect(e.target.value)}
        style={{
          background: 'var(--color-background)',
          border: '1px solid var(--color-border-base)',
          borderRadius: 4,
          color: 'var(--color-text-base)',
          fontSize: 12,
          padding: '2px 8px',
          cursor: 'pointer',
        }}
      >
        <option value="" disabled>Sélectionner une carte…</option>
        {maps.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      {selectedMapId && (
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 4 }}>
          Graphe de behaviors actif
        </span>
      )}
    </div>
  );
}

// ── Root component ───────────────────────────────────────────────────────

export default function BehaviorGraph() {
  const maps = useMapsStore(s => s.maps);
  const [selectedMapId, setSelectedMapId] = React.useState<string | null>(null);

  // Auto-sélectionner la première carte si aucune sélectionnée
  const activeMapId = selectedMapId && maps.find(m => m.id === selectedMapId)
    ? selectedMapId
    : (maps[0]?.id ?? null);

  const handleSelectMap = useCallback((id: string) => {
    setSelectedMapId(id);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MapSelector selectedMapId={activeMapId} onSelect={handleSelectMap} />

      {!activeMapId ? (
        <EmptyState hasMap={false} />
      ) : (
        <ReactFlowProvider>
          <BehaviorGraphInner mapId={activeMapId} />
        </ReactFlowProvider>
      )}
    </div>
  );
}
