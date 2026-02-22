import { useState } from 'react';
import { ChevronLeft, Layers, Plus, Minus } from 'lucide-react';
import { t } from '@/lib/translations';

interface LayerPickerPanelProps {
  characterName: string;
  currentLayer: number;
  onSelect: (zIndex: number) => void;
  onBack: () => void;
}

const LAYER_Z_INDEX = { MIN: 1, MAX: 20 } as const;

const LAYER_PRESETS = [
  { value: 1,  label: 'Arrière', icon: '🏔️' },
  { value: 5,  label: 'Milieu',  icon: '🌳' },
  { value: 10, label: 'Devant',  icon: '👤' },
  { value: 15, label: '1er plan',icon: '⭐' },
] as const;

/**
 * LayerPickerPanel — Sélecteur de couche compact.
 *
 * 4 presets en grille + ajustement fin +/-.
 * Supprime le graphique visuel au profit d'une UI plus dense.
 */
export function LayerPickerPanel({
  currentLayer,
  onSelect,
  onBack,
}: LayerPickerPanelProps) {
  const [tempLayer, setTempLayer] = useState(currentLayer);

  const handlePreset  = (v: number) => setTempLayer(v);
  const handleInc     = () => setTempLayer(prev => Math.min(LAYER_Z_INDEX.MAX, prev + 1));
  const handleDec     = () => setTempLayer(prev => Math.max(LAYER_Z_INDEX.MIN, prev - 1));
  const handleApply   = () => onSelect(tempLayer);

  return (
    <div className="space-y-3">
      {/* Retour */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.45)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Ordre d'affichage
      </button>

      {/* Presets */}
      <div className="grid grid-cols-4 gap-1">
        {LAYER_PRESETS.map(preset => {
          const isActive = tempLayer === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePreset(preset.value)}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-colors"
              style={{
                background: isActive ? 'rgba(124,58,237,0.12)' : 'var(--color-bg-base)',
                borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border-base)',
              }}
            >
              <span className="text-base leading-none">{preset.icon}</span>
              <span
                className="text-[9px] leading-tight text-center"
                style={{ color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)' }}
              >
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ajustement fin */}
      <div
        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
        style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-base)' }}
      >
        <button
          type="button"
          onClick={handleDec}
          disabled={tempLayer <= LAYER_Z_INDEX.MIN}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ background: 'var(--color-bg-hover)' }}
          aria-label="Diminuer le niveau"
        >
          <Minus className="w-3.5 h-3.5" style={{ color: 'var(--color-text-primary)' }} />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-lg font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
            {tempLayer}
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {t('layerPicker.help') || 'Couche'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleInc}
          disabled={tempLayer >= LAYER_Z_INDEX.MAX}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ background: 'var(--color-bg-hover)' }}
          aria-label="Augmenter le niveau"
        >
          <Plus className="w-3.5 h-3.5" style={{ color: 'var(--color-text-primary)' }} />
        </button>
      </div>

      {/* Appliquer */}
      <button
        type="button"
        onClick={handleApply}
        disabled={tempLayer === currentLayer}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-40"
        style={{
          background: tempLayer === currentLayer ? 'var(--color-bg-hover)' : 'var(--color-primary)',
          color: tempLayer === currentLayer ? 'var(--color-text-muted)' : '#fff',
        }}
      >
        <Layers className="w-3.5 h-3.5" aria-hidden="true" />
        Appliquer
      </button>
    </div>
  );
}

export default LayerPickerPanel;
