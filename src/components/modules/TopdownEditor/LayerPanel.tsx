/**
 * LayerPanel — Sélecteur de couche active + outils + contrôles de rendu
 *
 * Outils : Peindre (B) / Effacer (E) / Remplir (F) / Pipette (I)
 * Couches : Décor / Collision / Triggers — avec visibility toggle + opacity slider
 *
 * @module components/modules/TopdownEditor/LayerPanel
 */

import { Image as ImageIcon, Shield, Zap, Eye, EyeOff, type LucideIcon } from 'lucide-react';
import type { LayerType } from '@/types/map';
import type { EditorTool, LayerVisibility, LayerOpacity } from './hooks/useMapEditor';
import { MAP_LAYER_COLORS } from '@/config/mapEditorConfig';

interface LayerConfig {
  id: LayerType;
  label: string;
  description: string;
  Icon: LucideIcon;
}

const LAYERS: LayerConfig[] = [
  {
    id: 'tiles',
    label: 'Décor',
    description: 'Posez des tuiles visuelles',
    Icon: ImageIcon,
  },
  {
    id: 'collision',
    label: 'Collision',
    description: 'Zones que le joueur ne peut pas traverser',
    Icon: Shield,
  },
  {
    id: 'triggers',
    label: 'Triggers',
    description: 'Zones qui déclenchent un dialogue ou une sortie',
    Icon: Zap,
  },
];

const TOOLS: Array<{ id: EditorTool; label: string; emoji: string; title: string }> = [
  { id: 'paint',      label: 'Peindre',  emoji: '🖌️', title: 'Peindre (B)' },
  { id: 'erase',      label: 'Effacer',  emoji: '🧹', title: 'Effacer (E)' },
  { id: 'fill',       label: 'Remplir',  emoji: '🪣', title: 'Remplir (F) — flood fill' },
  { id: 'eyedropper', label: 'Pipette',  emoji: '💉', title: 'Pipette — sélectionne la tuile sous le curseur (I ou Alt+clic)' },
];

interface LayerPanelProps {
  activeLayer: LayerType;
  activeTool: EditorTool;
  layerVisibility: LayerVisibility;
  layerOpacity: LayerOpacity;
  flipX: boolean;
  flipY: boolean;
  stackMode: boolean;
  onLayerChange: (layer: LayerType) => void;
  onToolChange: (tool: EditorTool) => void;
  onToggleLayerVisibility: (layer: LayerType) => void;
  onSetLayerOpacity: (layer: LayerType, opacity: number) => void;
  onToggleFlipX: () => void;
  onToggleFlipY: () => void;
  onToggleStackMode: () => void;
}

export default function LayerPanel({
  activeLayer,
  activeTool,
  layerVisibility,
  layerOpacity,
  flipX,
  flipY,
  stackMode,
  onLayerChange,
  onToolChange,
  onToggleLayerVisibility,
  onSetLayerOpacity,
  onToggleFlipX,
  onToggleFlipY,
  onToggleStackMode,
}: LayerPanelProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {/* Tool selector — 2×2 grid */}
      <p className="text-xs font-semibold uppercase tracking-wide px-1 mb-1" style={{ color: 'var(--color-text-muted)' }}>
        Outil
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
        {TOOLS.map(tool => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '5px 4px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(139,92,246,0.18)' : 'transparent',
                border: isActive ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--color-border-base)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
              aria-pressed={isActive}
              title={tool.title}
            >
              <span style={{ fontSize: 13 }}>{tool.emoji}</span>
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Brush modifiers */}
      <p className="text-xs font-semibold uppercase tracking-wide px-1 mb-1" style={{ color: 'var(--color-text-muted)' }}>
        Modif.
      </p>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[
          { active: flipX, onToggle: onToggleFlipX, label: '↔ X', title: 'Miroir horizontal (X)' },
          { active: flipY, onToggle: onToggleFlipY, label: '↕ Y', title: 'Miroir vertical (Y)' },
          { active: stackMode, onToggle: onToggleStackMode, label: '⊕ T', title: 'Empilage — plusieurs tuiles par cellule (T)' },
        ].map(({ active, onToggle, label, title }) => (
          <button
            key={label}
            onClick={onToggle}
            title={title}
            style={{
              flex: 1,
              padding: '4px 0',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
              background: active ? 'rgba(139,92,246,0.18)' : 'transparent',
              border: active ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--color-border-base)',
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: active ? 600 : 400,
            }}
            aria-pressed={active}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Layer selector with visibility + opacity */}
      <p className="text-xs font-semibold uppercase tracking-wide px-1 mb-1" style={{ color: 'var(--color-text-muted)' }}>
        Couche
      </p>
      {LAYERS.map(layer => {
        const isActive = activeLayer === layer.id;
        const visible = layerVisibility[layer.id];
        const opacity = layerOpacity[layer.id];
        const { Icon } = layer;
        return (
          <div key={layer.id} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Main layer button */}
              <button
                onClick={() => onLayerChange(layer.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 6px',
                  borderRadius: 4,
                  textAlign: 'left',
                  background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(139,92,246,0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  opacity: visible ? 1 : 0.45,
                }}
                aria-pressed={isActive}
                title={layer.description}
              >
                <span
                  style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: MAP_LAYER_COLORS[layer.id].panel }}
                  aria-hidden="true"
                />
                <Icon size={11} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden="true" />
                <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--color-text-base)' : 'var(--color-text-muted)' }}>
                  {layer.label}
                </span>
              </button>

              {/* Visibility toggle */}
              <button
                onClick={e => { e.stopPropagation(); onToggleLayerVisibility(layer.id); }}
                title={visible ? 'Masquer la couche' : 'Afficher la couche'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: 3, flexShrink: 0,
                  border: '1px solid var(--color-border-base)',
                  background: 'transparent',
                  color: visible ? 'var(--color-text-muted)' : 'rgba(139,92,246,0.5)',
                  cursor: 'pointer',
                }}
              >
                {visible ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
            </div>

            {/* Opacity slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 22, paddingRight: 2, marginTop: 3 }}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={opacity}
                onChange={e => onSetLayerOpacity(layer.id, parseFloat(e.target.value))}
                title={`Opacité : ${Math.round(opacity * 100)}%`}
                style={{ flex: 1, height: 2, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)', minWidth: 26, textAlign: 'right' }}>
                {Math.round(opacity * 100)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
