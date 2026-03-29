import { useCallback, useMemo, type DragEvent } from 'react';
import { Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IosToggle } from '@/components/ui/IosToggle';
import { useAssets } from '@/hooks/useAssets';
import { useUIStore } from '@/stores/uiStore';
import { useSceneById, useSceneActions } from '@/stores/selectors';
import { buildFilterCSS, BACKGROUND_FILTER_DEFAULTS } from '@/utils/backgroundFilter';
import { PanelSection } from '@/components/ui/CollapsibleSection';
import { SliderRow } from '@/components/ui/SliderRow';
import type { BackgroundFilter } from '@/types/scenes';

// ============================================================================
// TYPES
// ============================================================================

interface BackgroundsSectionProps {
  onOpenModal: (modal: string, context?: unknown) => void;
}

// ⚠️ Module-level constant — évite `?? {}` inline qui crée une nouvelle référence à chaque render.
const EMPTY_FILTER: BackgroundFilter = {};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * BackgroundsSection — Sélection et filtres du fond de scène.
 *
 * - Fonds récents (grille 2 colonnes) en premier
 * - Bouton bibliothèque
 * - Filtres visuels : Activer + Luminosité, Contraste, Saturation, Flou
 */
export function BackgroundsSection({ onOpenModal }: BackgroundsSectionProps) {
  const sceneId = useUIStore((s) => s.selectedSceneForEdit);
  const scene = useSceneById(sceneId);
  const { updateScene } = useSceneActions();
  const { assets: backgrounds } = useAssets({ category: 'backgrounds' });

  const filter = useMemo(() => scene?.backgroundFilter ?? EMPTY_FILTER, [scene?.backgroundFilter]);

  const handleDragStart = (e: DragEvent, backgroundUrl: string) => {
    const dragData = { type: 'background', url: backgroundUrl };
    e.dataTransfer.setData('text/x-drag-type', 'background');
    e.dataTransfer.setData('text/x-drag-type-background', '');
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleFilterChange = useCallback(
    (key: keyof BackgroundFilter, value: number) => {
      if (!sceneId) return;
      updateScene(sceneId, { backgroundFilter: { ...filter, [key]: value } });
    },
    [sceneId, filter, updateScene]
  );

  const handleResetFilters = useCallback(() => {
    if (!sceneId) return;
    updateScene(sceneId, { backgroundFilter: undefined });
  }, [sceneId, updateScene]);

  const hasActiveFilter = buildFilterCSS(filter) !== 'none';
  const filtersEnabled =
    hasActiveFilter ||
    filter.brightness !== undefined ||
    filter.contrast !== undefined ||
    filter.saturation !== undefined ||
    filter.blur !== undefined;

  // "Activer les filtres" toggle : quand activé, applique des valeurs par défaut ;
  // quand désactivé, remet tout à undefined.
  const handleToggleFilters = useCallback(() => {
    if (!sceneId) return;
    if (filtersEnabled) {
      updateScene(sceneId, { backgroundFilter: undefined });
    } else {
      // Active avec valeurs neutres (aucun effet visible mais "activé")
      updateScene(sceneId, {
        backgroundFilter: {
          brightness: BACKGROUND_FILTER_DEFAULTS.brightness,
          contrast: BACKGROUND_FILTER_DEFAULTS.contrast,
          saturation: BACKGROUND_FILTER_DEFAULTS.saturation,
          blur: BACKGROUND_FILTER_DEFAULTS.blur,
        },
      });
    }
  }, [sceneId, filtersEnabled, updateScene]);

  const brightnessValue = filter.brightness ?? BACKGROUND_FILTER_DEFAULTS.brightness;
  const saturationValue = filter.saturation ?? BACKGROUND_FILTER_DEFAULTS.saturation;
  const contrastValue = filter.contrast ?? BACKGROUND_FILTER_DEFAULTS.contrast;
  const blurValue = filter.blur ?? BACKGROUND_FILTER_DEFAULTS.blur;

  return (
    <div>
      {/* === Fonds récents === */}
      <section className="sp-sec" aria-labelledby="bg-recent-heading">
        <h3 id="bg-recent-heading" className="sp-lbl">
          FONDS RÉCENTS
        </h3>

        {backgrounds && backgrounds.length > 0 ? (
          <div className="sp-thumb-grid mb-3">
            {backgrounds.slice(0, 4).map((bg, idx) => (
              <div
                key={bg.path || idx}
                draggable
                onDragStart={(e) => handleDragStart(e, bg.url)}
                className="relative aspect-video rounded-lg overflow-hidden border-2 border-[var(--color-border-base)] hover:border-[var(--color-primary)] cursor-grab active:cursor-grabbing transition-all"
                tabIndex={0}
                role="button"
                aria-label={`Faire glisser le fond ${bg.name} sur le canvas`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                }}
              >
                <img
                  src={bg.url}
                  alt={bg.name}
                  className="w-full h-full object-cover"
                  draggable="false"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            Aucun fond récent — parcours la bibliothèque pour en ajouter.
          </p>
        )}

        <Button
          variant="token-primary"
          size="sm"
          onClick={() =>
            onOpenModal('assets', { category: 'backgrounds', targetSceneId: sceneId ?? undefined })
          }
          className="w-full justify-start"
          aria-label="Parcourir la bibliothèque de fonds"
        >
          <Image className="w-4 h-4" aria-hidden="true" />
          📁 Parcourir la bibliothèque
        </Button>
      </section>

      {/* === Filtres visuels === */}
      <PanelSection title="FILTRES VISUELS" id="bg-filters" defaultOpen={false}>
        {/* Toggle Activer */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--color-text-secondary)]">Activer les filtres</span>
          <IosToggle
            enabled={filtersEnabled}
            onToggle={handleToggleFilters}
            label="Activer les filtres visuels"
          />
        </div>

        {/* Sliders — toujours visibles, grisés si désactivés */}
        <div className={filtersEnabled ? '' : 'opacity-40 pointer-events-none'}>
          <SliderRow
            label="Luminosité"
            value={brightnessValue}
            min={50}
            max={150}
            step={5}
            unit="%"
            onChange={(v) => handleFilterChange('brightness', v)}
            ariaLabel={`Luminosité : ${brightnessValue} %`}
            className="mb-2"
          />
          <SliderRow
            label="Contraste"
            value={contrastValue}
            min={50}
            max={150}
            step={5}
            unit="%"
            onChange={(v) => handleFilterChange('contrast', v)}
            ariaLabel={`Contraste : ${contrastValue} %`}
            className="mb-2"
          />
          <SliderRow
            label="Saturation"
            value={saturationValue}
            min={0}
            max={200}
            step={5}
            unit="%"
            onChange={(v) => handleFilterChange('saturation', v)}
            ariaLabel={`Saturation : ${saturationValue} %`}
            className="mb-2"
          />
          <SliderRow
            label="Flou"
            value={blurValue}
            min={0}
            max={20}
            step={1}
            unit="px"
            onChange={(v) => handleFilterChange('blur', v)}
            ariaLabel={`Flou : ${blurValue} px`}
          />
        </div>

        {hasActiveFilter && (
          <button
            onClick={handleResetFilters}
            className="mt-3 w-full text-xs py-1.5 px-3 rounded-lg border border-dashed border-[var(--color-border-base)] text-[var(--color-text-muted)] hover:border-red-400/60 hover:text-red-400 transition-colors"
          >
            ↩ Réinitialiser les filtres
          </button>
        )}
      </PanelSection>
    </div>
  );
}
