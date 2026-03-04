import { useCallback } from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import type { DialogueBoxStyle } from '@/types/scenes';

/** Défauts affichés dans les contrôles quand la valeur n'est pas encore définie */
const UI_DEFAULTS: Required<DialogueBoxStyle> = {
  typewriterSpeed: 40,
  fontSize: 15,
  boxOpacity: 0.75,
  position: 'bottom',
  showPortrait: true,
  speakerAlign: 'auto',
  borderStyle: 'subtle',
  portraitOffsetX: 50,
  portraitOffsetY: 0,
  portraitScale: 1,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  ariaLabel: string;
}

/** SliderRow — étiquette + valeur (sp-row) + curseur stylisé (sp-slider) */
function SliderRow({ label, value, min, max, step, unit, onChange, ariaLabel }: SliderRowProps) {
  return (
    <div className="mb-3">
      <div className="sp-row">
        <span>{label}</span>
        <span>{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="sp-slider"
        aria-label={ariaLabel}
      />
    </div>
  );
}

interface ToggleGroupProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

/** ToggleGroup — groupe de boutons segmentés (sp-seg + sp-seg-btn) */
function ToggleGroup<T extends string>({ label, value, options, onChange }: ToggleGroupProps<T>) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="sp-seg">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`sp-seg-btn${value === opt.value ? ' active' : ''}`}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * DialogueBoxSection — Panneau de personnalisation globale de la boîte de dialogue.
 *
 * Les valeurs modifiées ici s'appliquent à toutes les scènes du projet.
 * Chaque dialogue peut ensuite les écraser via `dialogue.boxStyle` (override dans le wizard).
 *
 * Persisté dans : settingsStore.projectSettings.game.dialogueBoxDefaults
 */
export function DialogueBoxSection() {
  const dialogueBoxDefaults = useSettingsStore(s => s.projectSettings.game.dialogueBoxDefaults);
  const updateDialogueBoxDefaults = useSettingsStore(s => s.updateDialogueBoxDefaults);

  // Valeurs effectives (defaults du store ou UI_DEFAULTS si non défini)
  const cfg: Required<DialogueBoxStyle> = { ...UI_DEFAULTS, ...dialogueBoxDefaults };

  const update = useCallback((patch: Partial<DialogueBoxStyle>) => {
    updateDialogueBoxDefaults(patch);
  }, [updateDialogueBoxDefaults]);

  const resetPortrait = useCallback(() => {
    update({ portraitOffsetX: 50, portraitOffsetY: 0, portraitScale: 1 });
  }, [update]);

  return (
    <div>

      {/* Aperçu temps réel — en premier */}
      <section className="sp-sec" aria-label="Aperçu de la boîte de dialogue">
        <h3 className="sp-lbl">APERÇU</h3>
        <div className="sp-dia-preview" aria-hidden="true">
          <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', marginBottom: 4 }}>
            — BONJOUR ! JE SUIS LÉA, TON GUIDE.
          </div>
          <span style={{ fontSize: cfg.fontSize }}>Bonjour ! Je suis Léa, ton guide.</span>
        </div>
      </section>

      {/* Texte */}
      <section className="sp-sec" aria-labelledby="dlgbox-text-heading">
        <h3 id="dlgbox-text-heading" className="sp-lbl">TEXTE</h3>
        <SliderRow
          label="Vitesse de frappe"
          value={cfg.typewriterSpeed}
          min={20} max={120} step={5} unit="ms/car"
          onChange={(v) => update({ typewriterSpeed: v })}
          ariaLabel={`Vitesse de frappe : ${cfg.typewriterSpeed} ms par caractère`}
        />
        <SliderRow
          label="Taille du texte"
          value={cfg.fontSize}
          min={12} max={24} step={1} unit="px"
          onChange={(v) => update({ fontSize: v })}
          ariaLabel={`Taille du texte : ${cfg.fontSize} pixels`}
        />
      </section>

      {/* Apparence */}
      <section className="sp-sec" aria-labelledby="dlgbox-style-heading">
        <h3 id="dlgbox-style-heading" className="sp-lbl">APPARENCE</h3>
        <SliderRow
          label="Opacité du fond"
          value={Math.round(cfg.boxOpacity * 100)}
          min={40} max={95} step={5} unit="%"
          onChange={(v) => update({ boxOpacity: v / 100 })}
          ariaLabel={`Opacité du fond : ${Math.round(cfg.boxOpacity * 100)} %`}
        />
        <ToggleGroup
          label="BORDURE"
          value={cfg.borderStyle}
          options={[
            { value: 'none',      label: 'Aucune'  },
            { value: 'subtle',    label: 'Subtile' },
            { value: 'prominent', label: 'Marquée' },
          ]}
          onChange={(v) => update({ borderStyle: v })}
        />
        <ToggleGroup
          label="POSITION"
          value={cfg.position}
          options={[
            { value: 'bottom', label: 'Bas'    },
            { value: 'center', label: 'Centre' },
            { value: 'top',    label: 'Haut'   },
          ]}
          onChange={(v) => update({ position: v })}
        />
      </section>

      {/* Speaker */}
      <section className="sp-sec" aria-labelledby="dlgbox-speaker-heading">
        <h3 id="dlgbox-speaker-heading" className="sp-lbl">SPEAKER</h3>

        {/* Portrait toggle — iOS switch */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
            {cfg.showPortrait
              ? <><Eye className="w-3.5 h-3.5" aria-hidden="true" /> Portrait affiché (48×48px)</>
              : <><EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> Portrait masqué</>
            }
          </span>
          <button
            onClick={() => update({ showPortrait: !cfg.showPortrait })}
            className={[
              'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
              cfg.showPortrait ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-hover)]',
            ].join(' ')}
            role="switch"
            aria-checked={cfg.showPortrait}
            aria-label={cfg.showPortrait ? 'Masquer le portrait' : 'Afficher le portrait'}
          >
            <span className={[
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
              cfg.showPortrait ? 'translate-x-4' : 'translate-x-0.5',
            ].join(' ')} />
          </button>
        </div>

        {/* Cadrage portrait — visible uniquement si portrait activé */}
        {cfg.showPortrait && (
          <div className="space-y-1 pl-2 border-l-2 border-[var(--color-primary)]/30 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">🖼️ Cadrage portrait</p>
              <button
                onClick={resetPortrait}
                className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                title="Réinitialiser le cadrage"
                aria-label="Réinitialiser le cadrage du portrait"
              >
                <RotateCcw className="w-2.5 h-2.5" aria-hidden="true" />
                Réinitialiser
              </button>
            </div>
            <SliderRow
              label="Pan horizontal" value={cfg.portraitOffsetX}
              min={0} max={100} step={5} unit="%"
              onChange={(v) => update({ portraitOffsetX: v })}
              ariaLabel={`Pan horizontal du portrait : ${cfg.portraitOffsetX} %`}
            />
            <SliderRow
              label="Pan vertical" value={cfg.portraitOffsetY}
              min={0} max={100} step={5} unit="%"
              onChange={(v) => update({ portraitOffsetY: v })}
              ariaLabel={`Pan vertical du portrait : ${cfg.portraitOffsetY} %`}
            />
            <SliderRow
              label="Zoom" value={cfg.portraitScale}
              min={1} max={3} step={0.1} unit="×"
              onChange={(v) => update({ portraitScale: Math.round(v * 10) / 10 })}
              ariaLabel={`Zoom du portrait : ${cfg.portraitScale} ×`}
            />
            <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
              Masque non-destructif — déplace et zoome sans recadrer l'image originale.
            </p>
          </div>
        )}

        {/* Alignement du nom du speaker */}
        <div>
          <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
            Alignement du nom
          </p>
          <div className="sp-seg">
            <button
              onClick={() => update({ speakerAlign: 'auto' })}
              className={`sp-seg-btn${cfg.speakerAlign === 'auto' ? ' active' : ''}`}
              aria-pressed={cfg.speakerAlign === 'auto'}
              title="Gauche si sprite x<50%, droite sinon"
            >
              Auto
            </button>
            <button
              onClick={() => update({ speakerAlign: 'left' })}
              className={`sp-seg-btn${cfg.speakerAlign === 'left' ? ' active' : ''}`}
              aria-pressed={cfg.speakerAlign === 'left'}
            >
              Toujours gauche
            </button>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] leading-tight mt-1">
            Auto : nom à gauche si le sprite est dans la moitié gauche du canvas, à droite sinon.
          </p>
        </div>
      </section>

    </div>
  );
}
