/**
 * LayersFloatingPanel — Panneau calques horizontal en bas du canvas (style GDevelop)
 *
 * Reprend la même interface de props que LayerPanel.tsx mais dispose les calques
 * en chips horizontaux dans une barre compacte (40px).
 *
 * @module components/modules/TopdownEditor/LayersFloatingPanel
 */

import { useState, useRef } from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, GripVertical } from 'lucide-react';
import type { LayerType, LayerInstance } from '@/types/map';
import type { EditorTool } from './hooks/useMapEditor';

// ── System layers ─────────────────────────────────────────────────────────────

const SYSTEM_LAYERS: Array<{
  id: 'collision' | 'triggers';
  label: string;
  emoji: string;
  color: string;
}> = [
  { id: 'collision', label: 'Collision', emoji: '🔴', color: '#f87171' },
  { id: 'triggers', label: 'Zones', emoji: '🟢', color: '#4ade80' },
];

const TILE_ACCENT_COLORS = [
  '#60a5fa',
  '#f472b6',
  '#34d399',
  '#fb923c',
  '#a78bfa',
  '#fbbf24',
  '#38bdf8',
  '#f87171',
];

function getTileAccentColor(layer: LayerInstance, idx: number): string {
  const ci = layer._ac_colorIndex ?? idx;
  return TILE_ACCENT_COLORS[ci % TILE_ACCENT_COLORS.length];
}

// ── Props (same interface as LayerPanel) ──────────────────────────────────────

interface LayersFloatingPanelProps {
  allLayers: LayerInstance[];
  activeLayer: LayerType;
  activeTileLayerIndex: number;
  activeTool: EditorTool;
  flipX: boolean;
  flipY: boolean;
  stackMode: boolean;
  onTileLayerSelect: (index: number) => void;
  onLayerChange: (layer: LayerType) => void;
  onToolChange: (tool: EditorTool) => void;
  onUpdateLayerProps: (
    identifier: string,
    patch: Partial<Pick<LayerInstance, '_ac_visible' | '_ac_opacity' | '_ac_locked'>>
  ) => void;
  onReorderTileLayer: (fromIndex: number, toIndex: number) => void;
  onToggleFlipX: () => void;
  onToggleFlipY: () => void;
  onToggleStackMode: () => void;
  onAddTileLayer: (name: string) => void;
  onRemoveTileLayer: (identifier: string) => void;
  onRenameTileLayer: (identifier: string, newName: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LayersFloatingPanel({
  allLayers,
  activeLayer,
  activeTileLayerIndex,
  onTileLayerSelect,
  onLayerChange,
  onUpdateLayerProps,
  onReorderTileLayer,
  onAddTileLayer,
}: LayersFloatingPanelProps) {
  const tileLayers = allLayers.filter((l) => l.__type === 'tiles');
  const dragIndexRef = useRef<number | null>(null);

  const [addingLayer, setAddingLayer] = useState(false);
  const [addValue, setAddValue] = useState('');

  const handleDragStart = (idx: number) => {
    dragIndexRef.current = idx;
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndexRef.current !== null && dragIndexRef.current !== idx) {
      onReorderTileLayer(dragIndexRef.current, idx);
      dragIndexRef.current = idx;
    }
  };
  const handleDragEnd = () => {
    dragIndexRef.current = null;
  };

  const commitAdd = () => {
    const name = addValue.trim() || `Couche ${tileLayers.length + 1}`;
    onAddTileLayer(name);
    setAddingLayer(false);
    setAddValue('');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 40,
        background: 'var(--color-bg-secondary, #1a1a2e)',
        borderTop: '1px solid var(--color-border-base, rgba(255,255,255,0.08))',
        flexShrink: 0,
        overflow: 'hidden',
        gap: 0,
      }}
    >
      {/* Label */}
      <div
        style={{
          padding: '0 8px',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--color-text-muted, rgba(255,255,255,0.35))',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          flexShrink: 0,
          borderRight: '1px solid var(--color-border-base, rgba(255,255,255,0.08))',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        Calques
      </div>

      {/* Scrollable chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          gap: 3,
          padding: '0 6px',
          height: '100%',
        }}
      >
        {/* Tile layers */}
        {tileLayers.map((layer, idx) => {
          const isActive = activeLayer === 'tiles' && activeTileLayerIndex === idx;
          const visible = layer._ac_visible ?? true;
          const locked = layer._ac_locked ?? false;
          const accent = getTileAccentColor(layer, idx);

          return (
            <div
              key={`${layer.__identifier}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '0 6px 0 3px',
                height: 26,
                borderRadius: 6,
                border: isActive ? `1px solid ${accent}66` : '1px solid rgba(255,255,255,0.07)',
                background: isActive ? `${accent}18` : 'rgba(255,255,255,0.03)',
                boxShadow: isActive ? `inset 2px 0 0 ${accent}` : `inset 2px 0 0 ${accent}44`,
                opacity: visible ? 1 : 0.45,
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              onClick={() => onTileLayerSelect(idx)}
            >
              {/* Drag handle */}
              <span style={{ color: 'var(--color-text-muted)', opacity: 0.5, cursor: 'grab' }}>
                <GripVertical size={9} />
              </span>

              {/* Name */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? '#c4b5fd'
                    : 'var(--color-text-secondary, rgba(255,255,255,0.65))',
                  maxWidth: 90,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {layer.__identifier}
              </span>

              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateLayerProps(layer.__identifier, { _ac_visible: !visible });
                }}
                title={visible ? 'Masquer' : 'Afficher'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 1,
                  color: visible
                    ? 'var(--color-text-muted, rgba(255,255,255,0.45))'
                    : 'rgba(255,255,255,0.2)',
                }}
              >
                {visible ? <Eye size={9} /> : <EyeOff size={9} />}
              </button>

              {/* Lock toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateLayerProps(layer.__identifier, { _ac_locked: !locked });
                }}
                title={locked ? 'Déverrouiller' : 'Verrouiller'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 1,
                  color: locked
                    ? 'var(--color-primary, #8b5cf6)'
                    : 'var(--color-text-muted, rgba(255,255,255,0.45))',
                }}
              >
                {locked ? <Lock size={9} /> : <Unlock size={9} />}
              </button>
            </div>
          );
        })}

        {/* System layers */}
        {SYSTEM_LAYERS.map((sys) => {
          const isActive = activeLayer === sys.id;
          const layer = allLayers.find((l) => l.__identifier === sys.id);
          const visible = layer?._ac_visible ?? true;

          return (
            <div
              key={sys.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0 6px',
                height: 26,
                borderRadius: 6,
                border: isActive ? `1px solid ${sys.color}66` : '1px solid rgba(255,255,255,0.07)',
                background: isActive ? `${sys.color}15` : 'rgba(255,255,255,0.03)',
                boxShadow: isActive ? `inset 2px 0 0 ${sys.color}` : `inset 2px 0 0 ${sys.color}44`,
                opacity: visible ? 1 : 0.45,
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              onClick={() => onLayerChange(sys.id)}
            >
              <span style={{ fontSize: 10 }}>{sys.emoji}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? sys.color
                    : 'var(--color-text-secondary, rgba(255,255,255,0.65))',
                  whiteSpace: 'nowrap',
                }}
              >
                {sys.label}
              </span>

              {/* Visibility toggle */}
              {layer && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayerProps(sys.id, { _ac_visible: !visible });
                  }}
                  title={visible ? 'Masquer' : 'Afficher'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 1,
                    color: visible
                      ? 'var(--color-text-muted, rgba(255,255,255,0.45))'
                      : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {visible ? <Eye size={9} /> : <EyeOff size={9} />}
                </button>
              )}
            </div>
          );
        })}

        {/* Inline add field */}
        {addingLayer && (
          <input
            autoFocus
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAdd();
              if (e.key === 'Escape') {
                setAddingLayer(false);
                setAddValue('');
              }
            }}
            onBlur={commitAdd}
            placeholder={`Couche ${tileLayers.length + 1}`}
            style={{
              height: 24,
              padding: '0 6px',
              borderRadius: 5,
              border: '1px solid var(--color-primary, #8b5cf6)',
              background: 'rgba(139,92,246,0.12)',
              color: '#c4b5fd',
              fontSize: 11,
              outline: 'none',
              width: 110,
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Add button */}
      <div
        style={{
          borderLeft: '1px solid var(--color-border-base, rgba(255,255,255,0.08))',
          padding: '0 4px',
          flexShrink: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => {
            setAddingLayer(true);
            setAddValue('');
          }}
          title="Ajouter une couche tuile"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 5,
            border: '1px solid transparent',
            background: 'transparent',
            color: 'var(--color-text-muted, rgba(255,255,255,0.5))',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.18)';
            e.currentTarget.style.color = 'var(--color-primary, #8b5cf6)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted, rgba(255,255,255,0.5))';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
