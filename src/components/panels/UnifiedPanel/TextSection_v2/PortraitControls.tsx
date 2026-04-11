/**
 * TextSection_v2/PortraitControls.tsx
 * Section PORTRAIT — affichage, cadrage (pan X/Y, zoom).
 */

import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { SliderRow } from '@/components/ui/SliderRow';
import { IosToggle } from '@/components/ui/IosToggle';
import type { DialogueBoxStyle } from '@/types/scenes';

interface PortraitControlsProps {
  cfg: Required<DialogueBoxStyle>;
  onUpdate: (patch: Partial<DialogueBoxStyle>) => void;
}

export function PortraitControls({ cfg, onUpdate }: PortraitControlsProps) {
  const handleReset = () => {
    onUpdate({ portraitOffsetX: 50, portraitOffsetY: 0, portraitScale: 1 });
  };

  return (
    <>
      {/* Toggle affichage */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
          {cfg.showPortrait ? (
            <>
              <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Portrait affiché
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> Portrait masqué
            </>
          )}
        </span>
        <IosToggle
          enabled={cfg.showPortrait}
          onToggle={() => onUpdate({ showPortrait: !cfg.showPortrait })}
          label="le portrait"
        />
      </div>

      {/* Cadrage — découverte progressive (Miyamoto §1.3) */}
      {cfg.showPortrait && (
        <div className="space-y-1 pl-2 border-l-2 border-[var(--color-primary)]/30 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              Cadrage portrait
            </p>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              title="Réinitialiser le cadrage"
              aria-label="Réinitialiser le cadrage du portrait"
            >
              <RotateCcw className="w-2.5 h-2.5" aria-hidden="true" />
              Réinitialiser
            </button>
          </div>
          <SliderRow
            label="Pan horizontal"
            value={cfg.portraitOffsetX}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => onUpdate({ portraitOffsetX: v })}
            ariaLabel={`Pan horizontal du portrait : ${cfg.portraitOffsetX} %`}
            className="mb-3"
          />
          <SliderRow
            label="Pan vertical"
            value={cfg.portraitOffsetY}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => onUpdate({ portraitOffsetY: v })}
            ariaLabel={`Pan vertical du portrait : ${cfg.portraitOffsetY} %`}
            className="mb-3"
          />
          <SliderRow
            label="Zoom"
            value={cfg.portraitScale}
            min={1}
            max={3}
            step={0.1}
            unit="×"
            onChange={(v) => onUpdate({ portraitScale: Math.round(v * 10) / 10 })}
            ariaLabel={`Zoom du portrait : ${cfg.portraitScale} ×`}
            className="mb-3"
          />
          <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
            Masque non-destructif — déplace et zoome sans recadrer l'image originale.
          </p>
        </div>
      )}
    </>
  );
}
