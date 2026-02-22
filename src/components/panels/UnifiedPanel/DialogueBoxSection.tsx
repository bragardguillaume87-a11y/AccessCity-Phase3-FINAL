import { useCallback } from 'react';
import { MessageSquare, AlignLeft, AlignRight, Eye, EyeOff, RotateCcw } from 'lucide-react';
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

function SliderRow({ label, value, min, max, step, unit, onChange, ariaLabel }: SliderRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
        <span className="text-xs text-[var(--color-text-muted)]">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-[var(--color-primary)] cursor-pointer"
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

function ToggleGroup<T extends string>({ label, value, options, onChange }: ToggleGroupProps<T>) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
      <div className="flex gap-1">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              'flex-1 text-xs py-1.5 px-2 rounded-lg border transition-colors',
              value === opt.value
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-primary)]',
            ].join(' ')}
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
  const cfg: Required<DialogueBoxStyle> = {
    ...UI_DEFAULTS,
    ...dialogueBoxDefaults,
  };

  const update = useCallback((patch: Partial<DialogueBoxStyle>) => {
    updateDialogueBoxDefaults(patch);
  }, [updateDialogueBoxDefaults]);

  const resetPortrait = useCallback(() => {
    update({ portraitOffsetX: 50, portraitOffsetY: 0, portraitScale: 1 });
  }, [update]);

  return (
    <div className="p-3 space-y-4">

      {/* Intro */}
      <div className="flex items-start gap-2 p-2 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
        <MessageSquare className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Personnalise la boîte de dialogue pour toutes les scènes du projet.
          Chaque dialogue peut ensuite avoir ses propres réglages.
        </p>
      </div>

      {/* === Texte === */}
      <section aria-labelledby="dlgbox-text-heading">
        <h3
          id="dlgbox-text-heading"
          className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2"
        >
          ✏️ Texte
        </h3>
        <div className="space-y-3">
          <SliderRow
            label="Vitesse de frappe"
            value={cfg.typewriterSpeed}
            min={20}
            max={120}
            step={5}
            unit="ms/car"
            onChange={(v) => update({ typewriterSpeed: v })}
            ariaLabel={`Vitesse de frappe : ${cfg.typewriterSpeed} ms par caractère`}
          />
          <SliderRow
            label="Taille du texte"
            value={cfg.fontSize}
            min={12}
            max={24}
            step={1}
            unit="px"
            onChange={(v) => update({ fontSize: v })}
            ariaLabel={`Taille du texte : ${cfg.fontSize} pixels`}
          />
          {/* Aperçu en temps réel — visible sans scène active */}
          <div
            className="px-3 py-2 rounded-lg bg-black/70 border border-white/10 backdrop-blur-sm"
            aria-hidden="true"
          >
            <p style={{ fontSize: `${cfg.fontSize}px` }} className="text-white leading-relaxed">
              — Bonjour ! Je suis Léa, ton guide.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-[var(--color-border-base)]" aria-hidden="true" />

      {/* === Apparence === */}
      <section aria-labelledby="dlgbox-style-heading">
        <h3
          id="dlgbox-style-heading"
          className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2"
        >
          🎨 Apparence
        </h3>
        <div className="space-y-3">
          <SliderRow
            label="Opacité du fond"
            value={Math.round(cfg.boxOpacity * 100)}
            min={40}
            max={95}
            step={5}
            unit="%"
            onChange={(v) => update({ boxOpacity: v / 100 })}
            ariaLabel={`Opacité du fond : ${Math.round(cfg.boxOpacity * 100)} %`}
          />

          <ToggleGroup
            label="Bordure"
            value={cfg.borderStyle}
            options={[
              { value: 'none',      label: 'Aucune' },
              { value: 'subtle',    label: 'Subtile' },
              { value: 'prominent', label: 'Marquée' },
            ]}
            onChange={(v) => update({ borderStyle: v })}
          />

          <ToggleGroup
            label="Position de la boîte"
            value={cfg.position}
            options={[
              { value: 'bottom', label: 'Bas' },
              { value: 'center', label: 'Centre' },
              { value: 'top',    label: 'Haut' },
            ]}
            onChange={(v) => update({ position: v })}
          />
        </div>
      </section>

      <div className="border-t border-[var(--color-border-base)]" aria-hidden="true" />

      {/* === Speaker === */}
      <section aria-labelledby="dlgbox-speaker-heading">
        <h3
          id="dlgbox-speaker-heading"
          className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2"
        >
          🎭 Speaker
        </h3>
        <div className="space-y-3">

          {/* Portrait toggle */}
          <button
            onClick={() => update({ showPortrait: !cfg.showPortrait })}
            className={[
              'w-full flex items-center gap-2 text-xs py-2 px-3 rounded-lg border transition-colors',
              cfg.showPortrait
                ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'bg-[var(--color-bg-base)] border-[var(--color-border-base)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
            ].join(' ')}
            aria-pressed={cfg.showPortrait}
          >
            {cfg.showPortrait
              ? <><Eye className="w-4 h-4" aria-hidden="true" /> Portrait affiché (48×48px)</>
              : <><EyeOff className="w-4 h-4" aria-hidden="true" /> Portrait masqué</>
            }
          </button>

          {/* Cadrage portrait — visible uniquement si portrait activé */}
          {cfg.showPortrait && (
            <div className="space-y-2.5 pl-2 border-l-2 border-[var(--color-primary)]/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                  🖼️ Cadrage portrait
                </p>
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
                label="Pan horizontal"
                value={cfg.portraitOffsetX}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => update({ portraitOffsetX: v })}
                ariaLabel={`Pan horizontal du portrait : ${cfg.portraitOffsetX} %`}
              />
              <SliderRow
                label="Pan vertical"
                value={cfg.portraitOffsetY}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => update({ portraitOffsetY: v })}
                ariaLabel={`Pan vertical du portrait : ${cfg.portraitOffsetY} %`}
              />
              <SliderRow
                label="Zoom"
                value={cfg.portraitScale}
                min={1}
                max={3}
                step={0.1}
                unit="×"
                onChange={(v) => update({ portraitScale: Math.round(v * 10) / 10 })}
                ariaLabel={`Zoom du portrait : ${cfg.portraitScale} ×`}
              />
              <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
                Masque non-destructif — déplace et zoome sans recadrer l'image originale.
              </p>
            </div>
          )}

          {/* Speaker name alignment */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Alignement du nom</p>
            <div className="flex gap-1">
              <button
                onClick={() => update({ speakerAlign: 'auto' })}
                className={[
                  'flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg border transition-colors',
                  cfg.speakerAlign === 'auto'
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-primary)]',
                ].join(' ')}
                aria-pressed={cfg.speakerAlign === 'auto'}
                title="Gauche si sprite x<50%, droite sinon"
              >
                <AlignLeft className="w-3 h-3" aria-hidden="true" />
                <AlignRight className="w-3 h-3 -ml-1.5" aria-hidden="true" />
                Auto
              </button>
              <button
                onClick={() => update({ speakerAlign: 'left' })}
                className={[
                  'flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg border transition-colors',
                  cfg.speakerAlign === 'left'
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-primary)]',
                ].join(' ')}
                aria-pressed={cfg.speakerAlign === 'left'}
              >
                <AlignLeft className="w-3 h-3" aria-hidden="true" />
                Toujours gauche
              </button>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
              Auto : nom à gauche si le sprite est dans la moitié gauche du canvas, à droite sinon.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
