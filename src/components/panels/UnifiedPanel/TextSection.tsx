import { useCallback } from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import { PanelSection } from '@/components/ui/CollapsibleSection';
import type { DialogueBoxStyle } from '@/types/scenes';

// ============================================================================
// HELPERS — boîte de dialogue (paramètres globaux)
// ============================================================================

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
  bgColor: '#030712',
  textColor: '#ffffff',
  borderColor: '#ffffff',
  borderRadius: 'xl',
  layout: 'classique',
  dialogueTransition: 'fondu',
};

// ── Presets thème ──────────────────────────────────────────────────────────────

const THEMES: Array<{
  label: string;
  icon: string;
  patch: Partial<DialogueBoxStyle>;
}> = [
  {
    label: 'Sombre',
    icon: '🌙',
    patch: { bgColor: '#030712', textColor: '#ffffff', borderColor: '#ffffff', borderRadius: 'xl' },
  },
  {
    label: 'Clair',
    icon: '☀️',
    patch: {
      bgColor: '#f0f4f8',
      textColor: '#1e293b',
      borderColor: '#94a3b8',
      borderRadius: 'xl',
      borderStyle: 'subtle',
    },
  },
  {
    label: 'RPG',
    icon: '⚔️',
    patch: {
      bgColor: '#1a0800',
      textColor: '#ffd700',
      borderColor: '#a0522d',
      borderRadius: 'sm',
      borderStyle: 'prominent',
    },
  },
  {
    label: 'Sci-fi',
    icon: '🤖',
    patch: {
      bgColor: '#000d1a',
      textColor: '#00e5ff',
      borderColor: '#0070f3',
      borderRadius: 'none',
      borderStyle: 'prominent',
    },
  },
  {
    label: 'Parchemin',
    icon: '📜',
    patch: {
      bgColor: '#f5e6c4',
      textColor: '#3d2b1f',
      borderColor: '#8b6914',
      borderRadius: 'md',
      borderStyle: 'prominent',
    },
  },
];

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="mb-3">
      <div className="sp-row">
        <span>{label}</span>
        <span>
          {value} {unit}
        </span>
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

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="sp-seg">
        {options.map((opt) => (
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

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <label className="flex items-center gap-2 cursor-pointer">
        <span
          className="w-5 h-5 rounded border border-[var(--color-border-base)] shadow-inner flex-shrink-0"
          style={{ background: value }}
          aria-hidden="true"
        />
        <span className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase">
          {value}
        </span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          aria-label={label}
        />
      </label>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TextSection() {
  const dialogueBoxDefaults = useSettingsStore((s) => s.projectSettings.game.dialogueBoxDefaults);
  const updateDialogueBoxDefaults = useSettingsStore((s) => s.updateDialogueBoxDefaults);

  const cfg: Required<DialogueBoxStyle> = { ...UI_DEFAULTS, ...dialogueBoxDefaults };

  const update = useCallback(
    (patch: Partial<DialogueBoxStyle>) => {
      updateDialogueBoxDefaults(patch);
    },
    [updateDialogueBoxDefaults]
  );

  const resetPortrait = useCallback(() => {
    update({ portraitOffsetX: 50, portraitOffsetY: 0, portraitScale: 1 });
  }, [update]);

  return (
    <div>
      {/* Aperçu boîte de dialogue */}
      <section className="sp-sec" aria-label="Aperçu de la boîte de dialogue">
        <h3 className="sp-lbl">APERÇU</h3>
        <div
          className="p-3 rounded border backdrop-blur-sm"
          aria-hidden="true"
          style={{
            background: `${cfg.bgColor}${Math.round(cfg.boxOpacity * 255)
              .toString(16)
              .padStart(2, '0')}`,
            borderColor:
              cfg.borderStyle === 'none'
                ? 'transparent'
                : cfg.borderColor + (cfg.borderStyle === 'prominent' ? '73' : '2e'),
            borderRadius: { none: '0px', sm: '6px', md: '12px', lg: '16px', xl: '20px' }[
              cfg.borderRadius
            ],
          }}
        >
          <div
            style={{
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.04em',
              marginBottom: 4,
            }}
          >
            — BONJOUR ! JE SUIS LÉA, TON GUIDE.
          </div>
          <span style={{ fontSize: cfg.fontSize, color: cfg.textColor }}>
            Bonjour ! Je suis Léa, ton guide.
          </span>
        </div>
      </section>

      {/* Mise en page */}
      <section className="sp-sec" aria-labelledby="dlgbox-layout-heading">
        <h3 id="dlgbox-layout-heading" className="sp-lbl">
          MISE EN PAGE
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-1">
          {(
            [
              { value: 'classique', icon: '🗨️', label: 'Classique', desc: 'Tout-en-un' },
              { value: 'visual', icon: '🎭', label: 'Visual', desc: 'Tab + boîte' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ layout: opt.value })}
              aria-pressed={cfg.layout === opt.value}
              className={[
                'flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all',
                cfg.layout === opt.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'border-[var(--color-border-base)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              <span className="text-xl leading-none">{opt.icon}</span>
              <span className="text-[11px] font-semibold leading-none">{opt.label}</span>
              <span className="text-[9px] leading-none opacity-70">{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Texte — vitesse + taille */}
      <section className="sp-sec" aria-labelledby="dlgbox-text-heading">
        <h3 id="dlgbox-text-heading" className="sp-lbl">
          TEXTE
        </h3>
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
      </section>

      {/* Transitions entre dialogues */}
      <section className="sp-sec" aria-labelledby="dlgbox-transition-heading">
        <h3 id="dlgbox-transition-heading" className="sp-lbl">
          TRANSITIONS
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-1">
          {[
            {
              value: 'aucune' as const,
              icon: '⚡',
              label: 'Instantané',
              desc: 'Swap direct',
            },
            {
              value: 'fondu' as const,
              icon: '🌅',
              label: 'Fondu',
              desc: 'Fade doux',
            },
            {
              value: 'glisse' as const,
              icon: '🎭',
              label: 'Glisse',
              desc: 'Style VN',
            },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ dialogueTransition: opt.value })}
              aria-pressed={cfg.dialogueTransition === opt.value}
              className={[
                'flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all',
                cfg.dialogueTransition === opt.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'border-[var(--color-border-base)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              <span className="text-xl leading-none">{opt.icon}</span>
              <span className="text-[11px] font-semibold leading-none">{opt.label}</span>
              <span className="text-[9px] leading-none opacity-70">{opt.desc}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] leading-tight mt-1">
          {cfg.dialogueTransition === 'aucune' &&
            'Le texte change sans animation — idéal pour les lecteurs rapides.'}
          {cfg.dialogueTransition === 'fondu' &&
            'La boîte reste fixe, le texte disparaît puis réapparaît en douceur (150 ms).'}
          {cfg.dialogueTransition === 'glisse' &&
            'La boîte glisse légèrement vers le haut à chaque changement de dialogue.'}
        </p>
      </section>

      {/* Apparence — thèmes, couleurs, opacité, bordure, rayon, position */}
      <section className="sp-sec" aria-labelledby="dlgbox-style-heading">
        <h3 id="dlgbox-style-heading" className="sp-lbl">
          APPARENCE
        </h3>

        {/* Presets thème */}
        <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          THÈME
        </p>
        <div className="grid grid-cols-5 gap-1 mb-4">
          {THEMES.map((theme) => (
            <button
              key={theme.label}
              onClick={() => update(theme.patch)}
              title={theme.label}
              aria-label={`Thème ${theme.label}`}
              className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 rounded-md border border-[var(--color-border-base)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition-all text-center"
            >
              <span className="text-base leading-none">{theme.icon}</span>
              <span className="text-[9px] text-[var(--color-text-muted)] leading-none">
                {theme.label}
              </span>
            </button>
          ))}
        </div>

        {/* Couleurs */}
        <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          COULEURS
        </p>
        <ColorRow label="Fond" value={cfg.bgColor} onChange={(v) => update({ bgColor: v })} />
        <ColorRow label="Texte" value={cfg.textColor} onChange={(v) => update({ textColor: v })} />
        <ColorRow
          label="Bordure"
          value={cfg.borderColor}
          onChange={(v) => update({ borderColor: v })}
        />

        {/* Opacité */}
        <SliderRow
          label="Opacité du fond"
          value={Math.round(cfg.boxOpacity * 100)}
          min={20}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => update({ boxOpacity: v / 100 })}
          ariaLabel={`Opacité du fond : ${Math.round(cfg.boxOpacity * 100)} %`}
        />

        {/* Bordure */}
        <ToggleGroup
          label="STYLE BORDURE"
          value={cfg.borderStyle}
          options={[
            { value: 'none', label: 'Aucune' },
            { value: 'subtle', label: 'Subtile' },
            { value: 'prominent', label: 'Marquée' },
          ]}
          onChange={(v) => update({ borderStyle: v })}
        />

        {/* Arrondi */}
        <ToggleGroup
          label="ARRONDI"
          value={cfg.borderRadius}
          options={[
            { value: 'none', label: 'Carré' },
            { value: 'sm', label: 'S' },
            { value: 'md', label: 'M' },
            { value: 'lg', label: 'L' },
            { value: 'xl', label: 'XL' },
          ]}
          onChange={(v) => update({ borderRadius: v })}
        />

        {/* Position */}
        <ToggleGroup
          label="POSITION"
          value={cfg.position}
          options={[
            { value: 'bottom', label: 'Bas' },
            { value: 'center', label: 'Centre' },
            { value: 'top', label: 'Haut' },
          ]}
          onChange={(v) => update({ position: v })}
        />
      </section>

      {/* Portrait */}
      <PanelSection title="PORTRAIT" id="dlgbox-portrait" defaultOpen={false}>
        {/* Afficher / masquer */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
            {cfg.showPortrait ? (
              <>
                <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Portrait affiché (48×48px)
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> Portrait masqué
              </>
            )}
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
            <span
              className={[
                'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                cfg.showPortrait ? 'translate-x-4' : 'translate-x-0.5',
              ].join(' ')}
            />
          </button>
        </div>

        {/* Cadrage */}
        {cfg.showPortrait && (
          <div className="space-y-1 pl-2 border-l-2 border-[var(--color-primary)]/30 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                Cadrage portrait
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

        {/* Alignement du nom */}
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
      </PanelSection>
    </div>
  );
}
