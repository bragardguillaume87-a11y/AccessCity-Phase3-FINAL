/**
 * LayerPanel — Sélecteur de couche active + outils + contrôles de rendu
 *
 * Sprint 10 — système de calques robuste (GDevelop style) :
 * - Par calque : visibilité 👁, verrou 🔒, opacité%, drag-to-reorder ⠿
 * - Couches tuiles : dynamiques (add/rename/delete/reorder/lock)
 * - Couches système : Collision + Zones (fixes, non-supprimables, mais contrôlables)
 *
 * @module components/modules/TopdownEditor/LayerPanel
 */

import { useState, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  GripVertical,
} from 'lucide-react';
import type { LayerType, LayerInstance } from '@/types/map';
import type { EditorTool } from './hooks/useMapEditor';

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: Array<{ id: EditorTool; label: string; emoji: string; title: string }> = [
  { id: 'paint', label: 'Peindre', emoji: '🖌️', title: 'Peindre (B)' },
  { id: 'erase', label: 'Effacer', emoji: '🧹', title: 'Effacer (E)' },
  { id: 'fill', label: 'Remplir', emoji: '🪣', title: 'Remplir (F) — flood fill' },
  { id: 'eyedropper', label: 'Pipette', emoji: '💉', title: 'Pipette (I ou Alt+clic)' },
];

// ── System layers config ───────────────────────────────────────────────────────

const SYSTEM_LAYERS: Array<{
  id: 'collision' | 'triggers';
  label: string;
  description: string;
  emoji: string;
  color: string;
}> = [
  {
    id: 'collision',
    label: 'Collision',
    description: 'Zones solides que le joueur ne peut pas traverser',
    emoji: '🔴',
    color: '#f87171',
  },
  {
    id: 'triggers',
    label: 'Zones',
    description: 'Passages, dialogues et sons déclenchés au contact',
    emoji: '🟢',
    color: '#4ade80',
  },
];

// Layer accent colors (index → color) — 8 couleurs cycliques, style GDevelop
const TILE_ACCENT_COLORS = [
  '#60a5fa', // bleu
  '#f472b6', // rose
  '#34d399', // vert
  '#fb923c', // orange
  '#a78bfa', // violet
  '#fbbf24', // jaune
  '#38bdf8', // cyan
  '#f87171', // rouge (evite si collision)
];

function getTileAccentColor(layer: LayerInstance, idx: number): string {
  const ci = layer._ac_colorIndex ?? idx;
  return TILE_ACCENT_COLORS[ci % TILE_ACCENT_COLORS.length];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface LayerPanelProps {
  /** All layer instances of the current map (tiles + system) */
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

export default function LayerPanel({
  allLayers,
  activeLayer,
  activeTileLayerIndex,
  activeTool,
  flipX,
  flipY,
  stackMode,
  onTileLayerSelect,
  onLayerChange,
  onToolChange,
  onUpdateLayerProps,
  onReorderTileLayer,
  onToggleFlipX,
  onToggleFlipY,
  onToggleStackMode,
  onAddTileLayer,
  onRemoveTileLayer,
  onRenameTileLayer,
}: LayerPanelProps) {
  const tileLayers = allLayers.filter((l) => l.__type === 'tiles');

  // ── Inline rename state ───────────────────────────────────────────────────
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (identifier: string) => {
    setRenamingId(identifier);
    setRenameValue(identifier);
  };
  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameTileLayer(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  // ── Add layer inline ──────────────────────────────────────────────────────
  const [isAdding, setIsAdding] = useState(false);
  const [addValue, setAddValue] = useState('');

  const commitAdd = () => {
    const name = addValue.trim() || `Couche ${tileLayers.length + 1}`;
    onAddTileLayer(name);
    setIsAdding(false);
    setAddValue('');
  };

  // ── Drag-to-reorder ───────────────────────────────────────────────────────
  const dragIndexRef = useRef<number | null>(null);

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

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* ── Outils ──────────────────────────────────────────────── */}
      <div>
        <p style={sectionHeaderStyle()}>Outil</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {TOOLS.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className="transition-all hover:-translate-y-0.5 active:scale-95"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  padding: '8px 4px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 600,
                  background: isActive
                    ? 'linear-gradient(135deg, var(--color-primary-30), var(--color-primary-15))'
                    : 'rgba(255,255,255,0.04)',
                  border: isActive
                    ? '1.5px solid var(--color-primary-70)'
                    : '1.5px solid rgba(255,255,255,0.09)',
                  color: isActive ? '#c4b5fd' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 0 10px var(--color-primary-25)' : 'none',
                }}
                aria-pressed={isActive}
                title={tool.title}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{tool.emoji}</span>
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Modificateurs ───────────────────────────────────────── */}
      <div>
        <p style={sectionHeaderStyle()}>Modificateurs</p>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            {
              active: flipX,
              onToggle: onToggleFlipX,
              label: '↔',
              sublabel: 'Miroir X',
              title: 'Miroir horizontal (X)',
            },
            {
              active: flipY,
              onToggle: onToggleFlipY,
              label: '↕',
              sublabel: 'Miroir Y',
              title: 'Miroir vertical (Y)',
            },
            {
              active: stackMode,
              onToggle: onToggleStackMode,
              label: '⊕',
              sublabel: 'Empiler',
              title: 'Empilage — plusieurs tuiles par cellule (T)',
            },
          ].map(({ active, onToggle, label, sublabel, title }) => (
            <button
              key={label}
              onClick={onToggle}
              title={title}
              className="transition-all hover:-translate-y-0.5 active:scale-95"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '6px 2px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: active ? 700 : 600,
                cursor: 'pointer',
                background: active ? 'var(--color-primary-20)' : 'rgba(255,255,255,0.04)',
                border: active
                  ? '1.5px solid var(--color-primary-60)'
                  : '1.5px solid rgba(255,255,255,0.09)',
                color: active ? '#c4b5fd' : 'var(--color-text-secondary)',
              }}
              aria-pressed={active}
            >
              <span style={{ fontSize: 14 }}>{label}</span>
              <span>{sublabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Couches tuiles (dynamiques) ──────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
          <p style={{ ...sectionHeaderStyle(), margin: 0, flex: 1 }}>Tuiles</p>
          <button
            onClick={() => {
              setIsAdding(true);
              setAddValue('');
            }}
            title="Ajouter une couche tuile"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: 4,
              cursor: 'pointer',
              border: '1px solid var(--color-primary-50)',
              background: 'var(--color-primary-12)',
              color: 'var(--color-primary)',
              flexShrink: 0,
            }}
          >
            <Plus size={11} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {tileLayers.map((layer, idx) => {
            const isActive = activeLayer === 'tiles' && activeTileLayerIndex === idx;
            const isRenaming = renamingId === layer.__identifier;
            const isEmpty = layer.gridTiles.length === 0;
            const visible = layer._ac_visible ?? true;
            const locked = layer._ac_locked ?? false;
            const opacity = layer._ac_opacity ?? 1.0;
            const accent = getTileAccentColor(layer, idx);

            return (
              <div
                key={`${layer.__identifier}-${idx}`}
                draggable={!isRenaming}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                style={{
                  borderRadius: 7,
                  border: isActive
                    ? `1.5px solid ${accent}55`
                    : '1.5px solid rgba(255,255,255,0.05)',
                  background: isActive ? `${accent}15` : 'rgba(255,255,255,0.02)',
                  overflow: 'hidden',
                  opacity: visible ? 1 : 0.45,
                  transition: 'all 0.12s ease',
                  // Left color accent bar (GDevelop style)
                  boxShadow: isActive ? `inset 3px 0 0 ${accent}` : `inset 3px 0 0 ${accent}55`,
                }}
              >
                {/* ── Row principale ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 6px' }}>
                  {/* Drag handle */}
                  <span
                    title="Glisser pour réorganiser"
                    style={{
                      color: 'var(--color-text-muted)',
                      cursor: 'grab',
                      flexShrink: 0,
                      display: 'flex',
                      opacity: 0.6,
                    }}
                  >
                    <GripVertical size={11} />
                  </span>

                  {/* Layer name — click to select, double-click to rename */}
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={commitRename}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--color-primary-50)',
                        borderRadius: 3,
                        padding: '1px 5px',
                        fontSize: 12,
                        color: 'var(--color-text-base)',
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => {
                        onTileLayerSelect(idx);
                        onLayerChange('tiles');
                      }}
                      onDoubleClick={() => startRename(layer.__identifier)}
                      title={
                        locked
                          ? `${layer.__identifier} (verrouillée)`
                          : `${layer.__identifier} — double-clic pour renommer`
                      }
                      style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0,
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive
                          ? 'var(--color-text-primary)'
                          : 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: locked ? 'none' : undefined,
                      }}
                    >
                      {layer.__identifier}
                    </button>
                  )}

                  {/* Opacity % label */}
                  {!isRenaming && (
                    <span
                      style={{
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        flexShrink: 0,
                        minWidth: 22,
                        textAlign: 'right',
                      }}
                    >
                      {Math.round(opacity * 100)}%
                    </span>
                  )}

                  {/* Eye toggle */}
                  {!isRenaming && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayerProps(layer.__identifier, { _ac_visible: !visible });
                      }}
                      title={visible ? 'Masquer la couche' : 'Afficher la couche'}
                      className="transition-all hover:scale-110 active:scale-90"
                      style={iconBtnStyle(visible ? undefined : accent)}
                    >
                      {visible ? <Eye size={10} /> : <EyeOff size={10} />}
                    </button>
                  )}

                  {/* Lock toggle */}
                  {!isRenaming && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayerProps(layer.__identifier, { _ac_locked: !locked });
                      }}
                      title={locked ? 'Déverrouiller la couche' : 'Verrouiller la couche'}
                      className="transition-all hover:scale-110 active:scale-90"
                      style={iconBtnStyle(locked ? '#fbbf24' : undefined)}
                    >
                      {locked ? <Lock size={10} /> : <Unlock size={10} />}
                    </button>
                  )}

                  {/* Rename button */}
                  {!isRenaming && (
                    <button
                      onClick={() => startRename(layer.__identifier)}
                      title="Renommer"
                      style={iconBtnStyle()}
                    >
                      <Pencil size={9} />
                    </button>
                  )}

                  {/* Confirm rename */}
                  {isRenaming && (
                    <button
                      onClick={commitRename}
                      title="Confirmer"
                      style={{ ...iconBtnStyle(), color: '#4ade80' }}
                    >
                      <Check size={10} />
                    </button>
                  )}

                  {/* Delete — only if >1 tile layer and layer is empty */}
                  {tileLayers.length > 1 && !isRenaming && (
                    <button
                      onClick={() => onRemoveTileLayer(layer.__identifier)}
                      title={isEmpty ? 'Supprimer cette couche' : "Vider la couche d'abord"}
                      disabled={!isEmpty}
                      style={{
                        ...iconBtnStyle(),
                        color: isEmpty ? '#f87171' : 'var(--color-text-muted)',
                        opacity: isEmpty ? 1 : 0.25,
                        cursor: isEmpty ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Trash2 size={9} />
                    </button>
                  )}
                </div>

                {/* ── Opacity slider ── */}
                {!isRenaming && (
                  <div style={{ paddingLeft: 22, paddingRight: 6, paddingBottom: 5 }}>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={opacity}
                      onChange={(e) =>
                        onUpdateLayerProps(layer.__identifier, {
                          _ac_opacity: parseFloat(e.target.value),
                        })
                      }
                      title={`Opacité : ${Math.round(opacity * 100)}%`}
                      style={{ width: '100%', height: 3, accentColor: accent, cursor: 'pointer' }}
                    />
                  </div>
                )}

                {/* Tile count badge */}
                {layer.gridTiles.length > 0 && !isRenaming && (
                  <div style={{ paddingLeft: 22, paddingBottom: 5 }}>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-overlay-06)',
                        borderRadius: 3,
                        padding: '1px 5px',
                      }}
                    >
                      {layer.gridTiles.length} tuile{layer.gridTiles.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add layer inline form */}
          {isAdding && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 7px',
                borderRadius: 7,
                border: '1.5px dashed var(--color-primary-50)',
                background: 'rgba(96,165,250,0.08)',
              }}
            >
              <input
                autoFocus
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitAdd();
                  if (e.key === 'Escape') {
                    setIsAdding(false);
                  }
                }}
                placeholder={`Couche ${tileLayers.length + 1}`}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--color-primary-50)',
                  borderRadius: 3,
                  padding: '2px 6px',
                  fontSize: 12,
                  color: 'var(--color-text-base)',
                  outline: 'none',
                }}
              />
              <button
                onClick={commitAdd}
                title="Créer"
                style={{ ...iconBtnStyle(), color: '#4ade80' }}
              >
                <Check size={11} />
              </button>
              <button
                onClick={() => setIsAdding(false)}
                title="Annuler"
                style={{ ...iconBtnStyle(), color: '#f87171' }}
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Couches système (fixes) ───────────────────────────────── */}
      <div>
        <p style={sectionHeaderStyle()}>Système</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {SYSTEM_LAYERS.map((sysLayer) => {
            const instance = allLayers.find((l) => l.__type === sysLayer.id);
            const isActive = activeLayer === sysLayer.id;
            const visible = instance?._ac_visible ?? true;
            const locked = instance?._ac_locked ?? false;
            const opacity = instance?._ac_opacity ?? 1.0;

            return (
              <div
                key={sysLayer.id}
                style={{
                  borderRadius: 7,
                  border: isActive
                    ? `1.5px solid ${sysLayer.color}55`
                    : '1.5px solid rgba(255,255,255,0.05)',
                  background: isActive ? `${sysLayer.color}12` : 'rgba(255,255,255,0.02)',
                  overflow: 'hidden',
                  opacity: visible ? 1 : 0.45,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive
                    ? `inset 3px 0 0 ${sysLayer.color}`
                    : `inset 3px 0 0 ${sysLayer.color}55`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px' }}>
                  <span style={{ fontSize: 11, flexShrink: 0 }}>{sysLayer.emoji}</span>
                  <button
                    onClick={() => onLayerChange(sysLayer.id)}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                    aria-pressed={isActive}
                    title={sysLayer.description}
                  >
                    {sysLayer.label}
                  </button>

                  {/* Opacity % */}
                  <span
                    style={{
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                      flexShrink: 0,
                      minWidth: 22,
                      textAlign: 'right',
                    }}
                  >
                    {Math.round(opacity * 100)}%
                  </span>

                  {/* Eye toggle */}
                  {instance && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayerProps(instance.__identifier, { _ac_visible: !visible });
                      }}
                      title={visible ? 'Masquer' : 'Afficher'}
                      className="transition-all hover:scale-110 active:scale-90"
                      style={iconBtnStyle(visible ? undefined : sysLayer.color)}
                    >
                      {visible ? <Eye size={10} /> : <EyeOff size={10} />}
                    </button>
                  )}

                  {/* Lock toggle */}
                  {instance && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayerProps(instance.__identifier, { _ac_locked: !locked });
                      }}
                      title={locked ? 'Déverrouiller' : 'Verrouiller'}
                      className="transition-all hover:scale-110 active:scale-90"
                      style={iconBtnStyle(locked ? '#fbbf24' : undefined)}
                    >
                      {locked ? <Lock size={10} /> : <Unlock size={10} />}
                    </button>
                  )}
                </div>

                {/* Opacity slider */}
                {instance && (
                  <div style={{ paddingLeft: 22, paddingRight: 6, paddingBottom: 5 }}>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={opacity}
                      onChange={(e) =>
                        onUpdateLayerProps(instance.__identifier, {
                          _ac_opacity: parseFloat(e.target.value),
                        })
                      }
                      title={`Opacité : ${Math.round(opacity * 100)}%`}
                      style={{
                        width: '100%',
                        height: 3,
                        accentColor: sysLayer.color,
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function sectionHeaderStyle(): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-text-primary)',
    paddingLeft: 2,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  };
}

function iconBtnStyle(activeColor?: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: 4,
    cursor: 'pointer',
    border: activeColor ? `1px solid ${activeColor}55` : '1px solid rgba(255,255,255,0.1)',
    background: activeColor ? `${activeColor}18` : 'transparent',
    color: activeColor ?? 'var(--color-text-muted)',
    flexShrink: 0,
    padding: 0,
  };
}
