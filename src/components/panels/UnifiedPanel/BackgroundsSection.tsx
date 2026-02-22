import React, { useCallback } from 'react';
import { Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { useAssets } from '@/hooks/useAssets';
import { useUIStore } from '@/stores/uiStore';
import { useSceneById, useSceneActions } from '@/stores/selectors';
import { buildFilterCSS, BACKGROUND_FILTER_DEFAULTS } from '@/utils/backgroundFilter';
import type { BackgroundFilter } from '@/types/scenes';

// ============================================================================
// TYPES
// ============================================================================

interface BackgroundsSectionProps {
  onOpenModal: (modal: string, context?: unknown) => void;
}

// ============================================================================
// FILTER SLIDER
// ============================================================================

interface FilterSliderProps {
  id: string;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}

function FilterSlider({ id, label, hint, min, max, step, value, unit, onChange }: FilterSliderProps) {
  return (
    <div className="space-y-0.5 py-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
        <span className="text-xs text-[var(--color-text-muted)]">{value}{unit}</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] italic leading-tight">{hint}</p>
      <input
        id={id}
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-[var(--color-primary)] cursor-pointer"
        aria-label={`${label} : ${value}${unit}`}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * BackgroundsSection — Panneau de sélection et personnalisation du fond de scène.
 *
 * Sections repliables :
 * - 🖼️ Bibliothèque de fonds : browse + grille des fonds récents
 * - 🎨 Filtres visuels : flou, luminosité, vivacité, contraste
 *
 * Les filtres sont appliqués uniquement sur le fond — les personnages
 * et la boîte de dialogue restent nets.
 */
export function BackgroundsSection({ onOpenModal }: BackgroundsSectionProps) {
  const sceneId = useUIStore(s => s.selectedSceneForEdit);
  const scene   = useSceneById(sceneId);
  const { updateScene } = useSceneActions();
  const { assets: backgrounds } = useAssets({ category: 'backgrounds' });

  const filter: BackgroundFilter = scene?.backgroundFilter ?? {};

  const handleDragStart = (e: React.DragEvent, backgroundUrl: string) => {
    const dragData = { type: 'background', url: backgroundUrl };
    e.dataTransfer.setData('text/x-drag-type', 'background');
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleFilterChange = useCallback((key: keyof BackgroundFilter, value: number) => {
    if (!sceneId) return;
    updateScene(sceneId, { backgroundFilter: { ...filter, [key]: value } });
  }, [sceneId, filter, updateScene]);

  const handleResetFilters = useCallback(() => {
    if (!sceneId) return;
    updateScene(sceneId, { backgroundFilter: undefined });
  }, [sceneId, updateScene]);

  const blurValue       = filter.blur       ?? BACKGROUND_FILTER_DEFAULTS.blur;
  const brightnessValue = filter.brightness ?? BACKGROUND_FILTER_DEFAULTS.brightness;
  const saturationValue = filter.saturation ?? BACKGROUND_FILTER_DEFAULTS.saturation;
  const contrastValue   = filter.contrast   ?? BACKGROUND_FILTER_DEFAULTS.contrast;
  const hasActiveFilter = buildFilterCSS(filter) !== 'none';

  return (
    <div className="px-3 py-2 space-y-0">

      {/* === Section : Bibliothèque de fonds === */}
      <CollapsibleSection
        title="Bibliothèque de fonds"
        icon={<Image className="w-3.5 h-3.5" />}
        variant="flat"
        defaultOpen={true}
      >
        <div className="pb-3 space-y-3">
          <Button
            variant="token-primary"
            size="sm"
            onClick={() => onOpenModal('assets', { category: 'backgrounds' })}
            className="w-full justify-start"
            aria-label="Parcourir la bibliothèque de fonds"
          >
            <Image className="w-4 h-4" aria-hidden="true" />
            Parcourir la bibliothèque
          </Button>

          {backgrounds && backgrounds.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                Fonds récents
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backgrounds.slice(0, 4).map((bg, idx) => (
                  <div
                    key={bg.path || idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, bg.path)}
                    className="relative aspect-video rounded-lg overflow-hidden border-2 border-[var(--color-border-base)] hover:border-[var(--color-primary)] cursor-grab active:cursor-grabbing transition-all hover:scale-105"
                    tabIndex={0}
                    role="button"
                    aria-label={`Faire glisser le fond ${bg.name} sur le canvas`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
                  >
                    <img src={bg.path} alt={bg.name} className="w-full h-full object-cover" draggable="false" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                      <p className="text-white text-xs font-medium truncate w-full">{bg.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-[var(--color-text-muted)]">
            Fais glisser un fond sur le canvas ou clique sur Parcourir
          </p>
        </div>
      </CollapsibleSection>

      <div className="border-t border-[var(--color-border-base)]" aria-hidden="true" />

      {/* === Section : Filtres visuels === */}
      <CollapsibleSection
        title="Filtres visuels"
        icon={<span aria-hidden="true">🎨</span>}
        variant="flat"
        defaultOpen={false}
        badge={hasActiveFilter ? 'actif' : undefined}
      >
        <div className="pb-3 space-y-1">
          <p className="text-xs text-[var(--color-text-muted)] mb-2">
            Retouche le fond pour que les personnages restent bien visibles.
          </p>

          <FilterSlider
            id="filter-blur"
            label="🔵 Flou"
            hint="rend le fond plus discret derrière les personnages"
            min={0} max={10} step={0.5}
            value={blurValue} unit=" px"
            onChange={v => handleFilterChange('blur', v)}
          />
          <FilterSlider
            id="filter-brightness"
            label="☀️ Luminosité"
            hint="assombris ou éclaircis le fond"
            min={50} max={150} step={5}
            value={brightnessValue} unit=" %"
            onChange={v => handleFilterChange('brightness', v)}
          />
          <FilterSlider
            id="filter-saturation"
            label="🎨 Vivacité"
            hint="couleurs plus vives ou plus ternes"
            min={0} max={200} step={5}
            value={saturationValue} unit=" %"
            onChange={v => handleFilterChange('saturation', v)}
          />
          <FilterSlider
            id="filter-contrast"
            label="⬛ Contraste"
            hint="accentue la différence entre zones claires et sombres"
            min={50} max={150} step={5}
            value={contrastValue} unit=" %"
            onChange={v => handleFilterChange('contrast', v)}
          />

          {hasActiveFilter && (
            <button
              onClick={handleResetFilters}
              className="mt-2 w-full text-xs py-1.5 px-3 rounded-lg border border-dashed border-[var(--color-border-base)] text-[var(--color-text-muted)] hover:border-red-400/60 hover:text-red-400 transition-colors"
            >
              ↩ Réinitialiser les filtres
            </button>
          )}

          {!sceneId && (
            <p className="text-xs text-[var(--color-text-muted)] italic mt-1">
              Sélectionne une scène pour activer les filtres.
            </p>
          )}
        </div>
      </CollapsibleSection>

    </div>
  );
}
