import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

/**
 * SERP-6: SerpentineControls - Controls for serpentine (snake) layout mode
 *
 * Features:
 * - Toggle button with snake icon (🐍) to enable/disable serpentine layout
 * - Popover menu to select mode ('auto-y' = auto-detect rows, 'by-count' = fixed count)
 * - Slider (4-10) to set group size (only visible when mode is 'by-count')
 *
 * Designed for children aged 8+ with simple terminology and emoji icons.
 */
export function SerpentineControls() {
  const serpentineEnabled = useUIStore((state) => state.serpentineEnabled);
  const serpentineMode = useUIStore((state) => state.serpentineMode);
  const serpentineGroupSize = useUIStore((state) => state.serpentineGroupSize);
  const setSerpentineEnabled = useUIStore((state) => state.setSerpentineEnabled);
  const setSerpentineMode = useUIStore((state) => state.setSerpentineMode);
  const setSerpentineGroupSize = useUIStore((state) => state.setSerpentineGroupSize);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleToggle = () => {
    setSerpentineEnabled(!serpentineEnabled);
  };

  const handleModeChange = (newMode: 'auto-y' | 'by-count') => {
    setSerpentineMode(newMode);
  };

  const handleGroupSizeChange = (value: number[]) => {
    setSerpentineGroupSize(value[0]);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Toggle Button */}
      <Button
        variant={serpentineEnabled ? 'default' : 'ghost'}
        size="sm"
        onClick={handleToggle}
        title={serpentineEnabled ? 'Désactiver le mode serpent' : 'Activer le mode serpent'}
        aria-label={serpentineEnabled ? 'Désactiver le mode serpent (zigzag)' : 'Activer le mode serpent (zigzag)'}
        className={
          serpentineEnabled
            ? 'bg-purple-600 hover:bg-purple-700 text-white transition-colors'
            : 'hover:bg-accent transition-colors'
        }
      >
        <span className="text-base" aria-hidden="true">
          🐍
        </span>
        <span className="ml-2 text-xs font-medium">Serpent</span>
      </Button>

      {/* Configuration Popover (only visible when enabled) */}
      {serpentineEnabled && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              title="Configurer le mode serpent"
              aria-label="Configurer les options du mode serpent"
              className="hover:bg-accent transition-colors"
            >
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="space-y-4">
              {/* Header */}
              <div className="font-semibold text-sm">
                ⚙️ Configuration Serpent
              </div>

              {/* Mode Selection */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Mode d'organisation
                </div>
                <div className="space-y-2">
                  {/* Auto-detect option */}
                  <button
                    onClick={() => handleModeChange('auto-y')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      serpentineMode === 'auto-y'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                        {serpentineMode === 'auto-y' && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">✨ Auto-détection</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Détecte les rangées automatiquement par position verticale
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Fixed count option */}
                  <button
                    onClick={() => handleModeChange('by-count')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      serpentineMode === 'by-count'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                        {serpentineMode === 'by-count' && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">🔢 Comptage fixe</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Nombre de dialogues par rangée (configurable ci-dessous)
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Group Size Slider (only for 'by-count' mode) */}
              {serpentineMode === 'by-count' && (
                <div className="pt-2 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Dialogues par rangée
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[serpentineGroupSize]}
                      onValueChange={handleGroupSizeChange}
                      min={4}
                      max={10}
                      step={1}
                      className="flex-1"
                      aria-label="Nombre de dialogues par rangée"
                    />
                    <div className="w-8 text-center">
                      <span className="text-sm font-bold text-primary">{serpentineGroupSize}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Min: 4 • Max: 10
                  </div>
                </div>
              )}

              {/* Help text */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                💡 Le mode serpent organise les dialogues en zigzag comme un serpent ! 🐍
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
