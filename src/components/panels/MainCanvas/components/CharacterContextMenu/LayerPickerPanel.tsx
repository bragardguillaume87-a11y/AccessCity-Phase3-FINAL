import React, { useState } from 'react';
import { ChevronLeft, Layers, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';
import { Button } from '@/components/ui/button';

interface LayerPickerPanelProps {
  characterName: string;
  currentLayer: number;
  onSelect: (zIndex: number) => void;
  onBack: () => void;
}

// Preset layer values
const LAYER_PRESETS = [
  { value: 1, label: 'Arrière-plan', icon: '🏔️' },
  { value: 5, label: 'Milieu', icon: '🌳' },
  { value: 10, label: 'Devant', icon: '👤' },
  { value: 15, label: 'Tout devant', icon: '⭐' }
];

/**
 * LayerPickerPanel - Visual layer/z-index selector
 *
 * Simplified UI with preset values and +/- buttons.
 * Kid-friendly with visual representation.
 */
export function LayerPickerPanel({
  characterName,
  currentLayer,
  onSelect,
  onBack
}: LayerPickerPanelProps) {
  const [tempLayer, setTempLayer] = useState(currentLayer);

  const handleIncrement = () => {
    const newValue = Math.min(20, tempLayer + 1);
    setTempLayer(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(1, tempLayer - 1);
    setTempLayer(newValue);
  };

  const handleApply = () => {
    onSelect(tempLayer);
  };

  const handlePresetClick = (value: number) => {
    setTempLayer(value);
  };

  return (
    <div className="animate-step-slide">
      {/* Header with back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t('layerPicker.title', { name: characterName })}</span>
      </button>

      {/* Visual layer indicator */}
      <div className="mb-4 p-4 bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl border border-border">
        {/* Layer visualization */}
        <div className="flex items-end justify-center gap-2 h-24 mb-3">
          {[1, 5, 10, 15].map((layer, index) => (
            <div
              key={layer}
              className={cn(
                "w-12 rounded-t-lg transition-all duration-300",
                tempLayer >= layer
                  ? "bg-primary"
                  : "bg-muted"
              )}
              style={{ height: `${20 + index * 20}px` }}
            />
          ))}
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('layerPicker.back')}</span>
          <span>{t('layerPicker.front')}</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {LAYER_PRESETS.map(preset => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetClick(preset.value)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-all duration-200",
              "border-2",
              tempLayer === preset.value
                ? "bg-primary/20 border-primary"
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            <span className="text-xl mb-1">{preset.icon}</span>
            <span className="text-[10px] text-muted-foreground">{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Fine adjustment */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={tempLayer <= 1}
          className="h-12 w-12"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-primary">{tempLayer}</span>
          <span className="text-xs text-muted-foreground">Niveau</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={tempLayer >= 20}
          className="h-12 w-12"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground text-center mb-4">
        {t('layerPicker.help')}
      </p>

      {/* Apply button */}
      <Button
        type="button"
        onClick={handleApply}
        className="w-full h-12"
        disabled={tempLayer === currentLayer}
      >
        <Layers className="w-4 h-4 mr-2" />
        Appliquer
      </Button>
    </div>
  );
}

export default LayerPickerPanel;
