/**
 * LayersPanelSection — Liste verticale compacte des calques (panneau droit)
 *
 * Affiche les calques tuiles + calques système sous forme de liste cliquable.
 * - Visibilité, verrou, opacité slider, renommage inline, suppression
 * - Drag & drop pour réordonner les calques tuiles
 *
 * @module components/modules/TopdownEditor/LayersPanelSection
 */

import { useState, useRef } from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, GripVertical, Trash2, Check, X } from 'lucide-react';
import type { LayerType, LayerInstance } from '@/types/map';

// ── System layers ─────────────────────────────────────────────────────────────

const SYSTEM_LAYERS = [
  { id: 'collision' as const, label: 'Collision', emoji: '🔴', color: '#f87171' },
  { id: 'triggers' as const, label: 'Zones', emoji: '🟢', color: '#4ade80' },
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface LayersPanelSectionProps {
  allLayers: LayerInstance[];
  activeLayer: LayerType;
  activeTileLayerIndex: number;
  onTileLayerSelect: (index: number) => void;
  onLayerChange: (layer: LayerType) => void;
  onUpdateLayerProps: (
    identifier: string,
    patch: Partial<Pick<LayerInstance, '_ac_visible' | '_ac_locked' | '_ac_opacity'>>
  ) => void;
  onReorderTileLayer: (fromIndex: number, toIndex: number) => void;
  onAddTileLayer: (name: string) => void;
  onRenameTileLayer?: (identifier: string, newName: string) => void;
  onDeleteTileLayer?: (index: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LayersPanelSection({
  allLayers,
  activeLayer,
  activeTileLayerIndex,
  onTileLayerSelect,
  onLayerChange,
  onUpdateLayerProps,
  onReorderTileLayer,
  onAddTileLayer,
  onRenameTileLayer,
  onDeleteTileLayer,
}: LayersPanelSectionProps) {
  const tileLayers = allLayers.filter((l) => l.__type === 'tiles');
  const dragIndexRef = useRef<number | null>(null);
  const [addingLayer, setAddingLayer] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim() && onRenameTileLayer) {
      onRenameTileLayer(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border-base, rgba(255,255,255,0.08))',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 360,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px 7px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted, rgba(255,255,255,0.35))',
          }}
        >
          Calques
        </span>
        <button
          onClick={() => {
            setAddingLayer(true);
            setAddValue('');
          }}
          title="Ajouter un calque tuile"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 4,
            border: '1px solid transparent',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.18)';
            e.currentTarget.style.color = 'var(--color-primary, #8b5cf6)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Layer list */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 4px 4px' }}>
        {/* Tile layers */}
        {tileLayers.map((layer, idx) => {
          const isActive = activeLayer === 'tiles' && activeTileLayerIndex === idx;
          const visible = layer._ac_visible ?? true;
          const locked = layer._ac_locked ?? false;
          const opacity = layer._ac_opacity ?? 100;
          const accent = getTileAccentColor(layer, idx);
          const isHovered = hoveredIdx === idx;
          const isRenaming = renamingId === layer.__identifier;

          return (
            <div
              key={`${layer.__identifier}-${idx}`}
              draggable={!isRenaming}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (!isRenaming) onTileLayerSelect(idx);
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                borderRadius: 5,
                border: isActive ? `1px solid ${accent}55` : '1px solid transparent',
                background: isActive
                  ? `${accent}12`
                  : isHovered
                    ? 'rgba(255,255,255,0.04)'
                    : 'transparent',
                borderLeft: `3px solid ${isActive ? accent : `${accent}44`}`,
                opacity: visible ? 1 : 0.45,
                cursor: isRenaming ? 'default' : 'pointer',
                marginBottom: 1,
                transition: 'all 0.1s',
              }}
            >
              {/* Main row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 10px' }}>
                <span
                  style={{
                    color: 'var(--color-text-muted)',
                    opacity: 0.5,
                    cursor: isRenaming ? 'default' : 'grab',
                    flexShrink: 0,
                  }}
                >
                  <GripVertical size={11} />
                </span>

                {/* Name or inline rename input */}
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') {
                        setRenamingId(null);
                        setRenameValue('');
                      }
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      height: 22,
                      padding: '0 5px',
                      borderRadius: 3,
                      border: '1px solid rgba(139,92,246,0.6)',
                      background: 'rgba(139,92,246,0.12)',
                      color: '#c4b5fd',
                      fontSize: 14,
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(layer.__identifier, layer.__identifier);
                    }}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.65)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {layer.__identifier}
                  </span>
                )}

                {/* Rename confirm/cancel when renaming */}
                {isRenaming ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        commitRename();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                        color: '#4ade80',
                      }}
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(null);
                        setRenameValue('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <>
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
                        padding: 2,
                        color: visible ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
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
                        padding: 2,
                        color: locked ? 'var(--color-primary, #8b5cf6)' : 'var(--color-text-muted)',
                      }}
                    >
                      {locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                    {/* Delete — visible on hover, only if > 1 tile layer */}
                    {isHovered && tileLayers.length > 1 && onDeleteTileLayer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Supprimer le calque "${layer.__identifier}" ?`)) {
                            onDeleteTileLayer(idx);
                          }
                        }}
                        title="Supprimer ce calque"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                          color: 'rgba(239,68,68,0.7)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#f87171';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(239,68,68,0.7)';
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Opacity slider — shown on hover or when not full opacity */}
              {(isHovered || opacity < 100) && !isRenaming && (
                <div
                  style={{
                    padding: '0 6px 5px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={opacity}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateLayerProps(layer.__identifier, {
                        _ac_opacity: Number(e.target.value),
                      });
                    }}
                    style={{ flex: 1, height: 3, cursor: 'pointer', accentColor: accent }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.35)',
                      flexShrink: 0,
                      minWidth: 24,
                      textAlign: 'right',
                    }}
                  >
                    {opacity}%
                  </span>
                </div>
              )}
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
              onClick={() => onLayerChange(sys.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '9px 10px',
                borderRadius: 5,
                border: isActive ? `1px solid ${sys.color}55` : '1px solid transparent',
                background: isActive ? `${sys.color}12` : 'transparent',
                borderLeft: `3px solid ${isActive ? sys.color : `${sys.color}44`}`,
                opacity: visible ? 1 : 0.45,
                cursor: 'pointer',
                marginBottom: 1,
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>{sys.emoji}</span>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? sys.color : 'rgba(255,255,255,0.65)',
                  whiteSpace: 'nowrap',
                }}
              >
                {sys.label}
              </span>
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
                    padding: 2,
                    color: visible ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {visible ? <Eye size={12} /> : <EyeOff size={12} />}
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
              width: '100%',
              height: 30,
              padding: '0 8px',
              marginTop: 2,
              borderRadius: 5,
              border: '1px solid var(--color-primary, #8b5cf6)',
              background: 'rgba(139,92,246,0.12)',
              color: '#c4b5fd',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>
    </div>
  );
}
