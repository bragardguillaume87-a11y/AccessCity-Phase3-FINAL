/**
 * LayerPanel — Sélecteur de couche active + légende
 *
 * 3 couches : Décor (images) / Collision (zones solides) / Triggers (zones évènements)
 * UX Mario Maker : pas de couches techniques exposées, tout est visuel.
 *
 * @module components/modules/TopdownEditor/LayerPanel
 */

import { Image as ImageIcon, Shield, Zap, type LucideIcon } from 'lucide-react';
import type { LayerType } from '@/types/map';
import type { EditorTool } from './hooks/useMapEditor';

interface LayerConfig {
  id: LayerType;
  label: string;
  description: string;
  color: string;
  Icon: LucideIcon;
}

const LAYERS: LayerConfig[] = [
  {
    id: 'tiles',
    label: 'Décor',
    description: 'Posez des tuiles visuelles',
    color: 'rgba(100, 149, 237, 0.8)',
    Icon: ImageIcon,
  },
  {
    id: 'collision',
    label: 'Collision',
    description: 'Zones que le joueur ne peut pas traverser',
    color: 'rgba(255, 60, 60, 0.8)',
    Icon: Shield,
  },
  {
    id: 'triggers',
    label: 'Triggers',
    description: 'Zones qui déclenchent un dialogue ou une sortie',
    color: 'rgba(60, 220, 100, 0.8)',
    Icon: Zap,
  },
];

const TOOLS: Array<{ id: EditorTool; label: string; emoji: string }> = [
  { id: 'paint', label: 'Peindre', emoji: '🖌️' },
  { id: 'erase', label: 'Effacer', emoji: '🧹' },
];

interface LayerPanelProps {
  activeLayer: LayerType;
  activeTool: EditorTool;
  onLayerChange: (layer: LayerType) => void;
  onToolChange: (tool: EditorTool) => void;
}

export default function LayerPanel({ activeLayer, activeTool, onLayerChange, onToolChange }: LayerPanelProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {/* Tool selector */}
      <p className="text-xs font-semibold uppercase tracking-wide px-1 mb-1" style={{ color: 'var(--color-text-muted)' }}>
        Outil
      </p>
      <div className="flex gap-1 mb-2">
        {TOOLS.map(tool => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: isActive ? 'rgba(139,92,246,0.18)' : 'transparent',
                border: isActive ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--color-border-base)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
              aria-pressed={isActive}
              title={tool.label}
            >
              <span>{tool.emoji}</span>
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Layer selector */}
      <p className="text-xs font-semibold uppercase tracking-wide px-1 mb-1" style={{ color: 'var(--color-text-muted)' }}>
        Couche
      </p>
      {LAYERS.map(layer => {
        const isActive = activeLayer === layer.id;
        const { Icon } = layer;
        return (
          <button
            key={layer.id}
            onClick={() => onLayerChange(layer.id)}
            className="flex items-center gap-2 px-2 py-2 rounded text-left transition-colors"
            style={{
              background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(139,92,246,0.35)' : '1px solid transparent',
            }}
            aria-pressed={isActive}
            title={layer.description}
          >
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: layer.color }}
              aria-hidden="true"
            />
            <Icon size={12} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-none" style={{ color: isActive ? 'var(--color-text-base)' : 'var(--color-text-muted)' }}>
                {layer.label}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
