import { useState, useCallback } from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import { PanelSection } from '@/components/ui/CollapsibleSection';
import type { DialogueBoxStyle } from '@/types/scenes';
import {
  NAME_FONTS,
  NAME_SHADOW_LABELS,
  DEFAULT_NAME_FONT_ID,
  DEFAULT_NAME_SHADOW,
  type NameShadowPreset,
} from '@/config/nameFonts';

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
  nameFont: DEFAULT_NAME_FONT_ID,
  nameColor: '',
  nameShadow: DEFAULT_NAME_SHADOW,
  nameLetterSpacing: 1.5,
  narratorBgColor: '#070a1a',
  narratorTextColor: '#ede8d5',
  narratorBorderColor: '#c9a84c',
  narratorBgOpacity: 0.93,
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

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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

/**
 * SubSection — sous-accordéon léger (sans sp-sec wrapper) pour nester
 * dans une PanelSection parent sans double padding/border.
 */
function SubSection({
  title,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Résumé de l'état courant, affiché quand la section est fermée */
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between mb-1.5 py-1 text-[10.5px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide hover:text-[var(--color-text-secondary)] transition-colors border-b border-[var(--color-border-base)]/40 pb-1"
      >
        <span>{title}</span>
        {!open && badge && (
          <span
            className="ml-2 text-[9px] font-normal normal-case tracking-normal text-[var(--color-text-muted)] opacity-70 truncate max-w-[90px]"
            aria-label={`Réglage actuel : ${badge}`}
          >
            {badge}
          </span>
        )}
        <svg
          aria-hidden="true"
          style={{
            width: 10,
            height: 10,
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
          }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pt-1">{children}</div>
        </div>
      </div>
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
      {/* ── Aperçu — sticky (Bret Victor §7 : connexion immédiate créateur/création) ──
           position:sticky dans le container flex-1 overflow-y-auto de SectionContentPanel.
           boxShadow : signal visuel "du contenu défile en dessous" (pattern Chrome DevTools). */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: 'var(--color-bg-elevated)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.28)',
        }}
      >
        <PanelSection title="APERÇU" id="dlgbox-apercu" defaultOpen={true}>
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
        </PanelSection>
      </div>
      {/* /sticky-apercu */}

      {/* ── Thèmes — promu au premier niveau (usage primaire : choisir un preset avant de personnaliser) ──
           Extrait de la SubSection APPARENCE pour réduire le scroll initial.
           Source : Fitts's Law — l'action la plus fréquente doit être la plus accessible. */}
      <PanelSection title="THÈMES" id="dlgbox-themes" defaultOpen={true}>
        <div className="grid grid-cols-5 gap-1 mb-2">
          {THEMES.map((theme) => (
            <button
              key={theme.label}
              onClick={() => update(theme.patch)}
              title={theme.label}
              aria-label={`Appliquer le thème ${theme.label}`}
              className="flex flex-col items-center gap-0.5 py-1.5 px-0.5 rounded-md border border-[var(--color-border-base)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition-all text-center"
            >
              <span className="text-base leading-none">{theme.icon}</span>
              <span className="text-[9px] text-[var(--color-text-muted)] leading-none">
                {theme.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
          Applique couleurs, bordure et arrondi — personnalisable dans APPARENCE ci-dessous.
        </p>
      </PanelSection>

      {/* ── Texte — vitesse + taille ── */}
      <PanelSection title="TEXTE" id="dlgbox-text" defaultOpen={true}>
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
      </PanelSection>

      {/* ── Apparence — 4 sous-accordéons (mise en page, transitions, couleurs, style) ──
           THÈMES déplacé au premier niveau ci-dessus.
           SubSections fermées par défaut : réduisent le scroll, badges montrent l'état courant. */}
      <PanelSection title="APPARENCE" id="dlgbox-style" defaultOpen={true}>
        {/* Mise en page */}
        <SubSection
          title="MISE EN PAGE"
          defaultOpen={false}
          badge={cfg.layout === 'classique' ? 'Classique' : 'Visual'}
        >
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
        </SubSection>

        {/* Transitions */}
        <SubSection
          title="TRANSITIONS"
          defaultOpen={false}
          badge={{ aucune: 'Instantané', fondu: 'Fondu', glisse: 'Glisse' }[cfg.dialogueTransition]}
        >
          <div className="grid grid-cols-3 gap-2 mb-1">
            {[
              { value: 'aucune' as const, icon: '⚡', label: 'Instantané', desc: 'Swap direct' },
              { value: 'fondu' as const, icon: '🌅', label: 'Fondu', desc: 'Fade doux' },
              { value: 'glisse' as const, icon: '🎭', label: 'Glisse', desc: 'Style VN' },
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
        </SubSection>

        {/* Couleurs & Opacité */}
        <SubSection
          title="COULEURS & OPACITÉ"
          defaultOpen={false}
          badge={`Opacité ${Math.round(cfg.boxOpacity * 100)}%`}
        >
          <ColorRow label="Fond" value={cfg.bgColor} onChange={(v) => update({ bgColor: v })} />
          <ColorRow
            label="Texte"
            value={cfg.textColor}
            onChange={(v) => update({ textColor: v })}
          />
          <ColorRow
            label="Bordure"
            value={cfg.borderColor}
            onChange={(v) => update({ borderColor: v })}
          />
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
        </SubSection>

        {/* Style */}
        <SubSection
          title="STYLE"
          defaultOpen={false}
          badge={`${cfg.borderStyle === 'none' ? 'Sans bordure' : cfg.borderStyle === 'subtle' ? 'Subtile' : 'Marquée'} · ${cfg.borderRadius.toUpperCase()}`}
        >
          <ToggleGroup
            label="BORDURE"
            value={cfg.borderStyle}
            options={[
              { value: 'none', label: 'Aucune' },
              { value: 'subtle', label: 'Subtile' },
              { value: 'prominent', label: 'Marquée' },
            ]}
            onChange={(v) => update({ borderStyle: v })}
          />
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
        </SubSection>
      </PanelSection>

      {/* ── Portrait ── */}
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
      </PanelSection>

      {/* ── Nom du personnage ── */}
      <PanelSection title="NOM DU PERSONNAGE" id="dlgbox-name-style" defaultOpen={false}>
        {/* Polices */}
        <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          POLICE
        </p>
        <div className="grid grid-cols-4 gap-1 mb-4">
          {NAME_FONTS.map((font) => {
            const isActive = (cfg.nameFont ?? DEFAULT_NAME_FONT_ID) === font.id;
            return (
              <button
                key={font.id}
                onClick={() => update({ nameFont: font.id })}
                title={font.description}
                aria-pressed={isActive}
                className={[
                  'flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-md border transition-all',
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border-base)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-muted)]',
                ].join(' ')}
              >
                <span className="text-sm leading-none">{font.emoji}</span>
                <span
                  className="text-[10px] leading-tight text-center font-bold"
                  style={{ fontFamily: font.fontFamily }}
                >
                  ABC
                </span>
                <span className="text-[8.5px] leading-none text-center opacity-80">
                  {font.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ombre */}
        <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          OMBRE
        </p>
        <div className="sp-seg mb-3">
          {(Object.keys(NAME_SHADOW_LABELS) as NameShadowPreset[]).map((s) => (
            <button
              key={s}
              onClick={() => update({ nameShadow: s })}
              className={`sp-seg-btn${(cfg.nameShadow ?? DEFAULT_NAME_SHADOW) === s ? ' active' : ''}`}
              aria-pressed={(cfg.nameShadow ?? DEFAULT_NAME_SHADOW) === s}
            >
              {NAME_SHADOW_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Couleur du nom */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--color-text-secondary)]">Couleur du nom</span>
          <div className="flex items-center gap-2">
            {cfg.nameColor && cfg.nameColor !== '' && (
              <button
                onClick={() => update({ nameColor: '' })}
                className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                title="Utiliser la couleur automatique du personnage"
                aria-label="Réinitialiser la couleur du nom"
              >
                <RotateCcw className="w-2.5 h-2.5" aria-hidden="true" />
                Auto
              </button>
            )}
            {!(cfg.nameColor && cfg.nameColor !== '') && (
              <span className="text-[10px] text-[var(--color-text-muted)] italic">Auto</span>
            )}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span
                className="w-5 h-5 rounded border border-[var(--color-border-base)] shadow-inner flex-shrink-0"
                style={{
                  background: cfg.nameColor && cfg.nameColor !== '' ? cfg.nameColor : '#8b5cf6',
                  opacity: cfg.nameColor && cfg.nameColor !== '' ? 1 : 0.35,
                }}
                aria-hidden="true"
              />
              <input
                type="color"
                value={cfg.nameColor && cfg.nameColor !== '' ? cfg.nameColor : '#8b5cf6'}
                onChange={(e) => update({ nameColor: e.target.value })}
                className="sr-only"
                aria-label="Couleur du nom du personnage"
              />
            </label>
          </div>
        </div>

        {/* Espacement lettres */}
        <SliderRow
          label="Espacement lettres"
          value={cfg.nameLetterSpacing ?? 1.5}
          min={0}
          max={8}
          step={0.5}
          unit="px"
          onChange={(v) => update({ nameLetterSpacing: v })}
          ariaLabel={`Espacement des lettres du nom : ${cfg.nameLetterSpacing ?? 1.5} px`}
        />
        <p className="text-[10px] text-[var(--color-text-muted)] leading-tight -mt-1">
          Aperçu en temps réel dans la boîte de dialogue.
        </p>

        {/* Alignement du nom — déplacé ici depuis PORTRAIT (propriété du nom, pas du portrait) */}
        <div className="mt-3">
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

      {/* ── Narrateur ── */}
      <PanelSection title="NARRATEUR" id="dlgbox-narrator" defaultOpen={false}>
        <p className="text-[10px] text-[var(--color-text-muted)] mb-3 leading-relaxed">
          Dialogues sans speaker — style Octopath Traveler (boîte navy + bordure dorée).
        </p>

        {/* Mini-preview live (Bret Victor — montrer la chose réelle) */}
        <div
          className="mb-3 relative overflow-hidden"
          style={{
            background: `${cfg.narratorBgColor}${Math.round((cfg.narratorBgOpacity ?? 0.93) * 255)
              .toString(16)
              .padStart(2, '0')}`,
            border: `1.5px solid ${cfg.narratorBorderColor}`,
            borderRadius: 4,
            padding: '10px 14px',
            boxShadow: `0 0 0 1px ${cfg.narratorBorderColor}18, inset 0 0 20px rgba(0,0,0,0.3)`,
          }}
          aria-hidden="true"
        >
          {/* Coins décoratifs */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
            <span
              key={pos}
              style={{
                position: 'absolute',
                width: 7,
                height: 7,
                top: pos.startsWith('t') ? 3 : undefined,
                bottom: pos.startsWith('b') ? 3 : undefined,
                left: pos.endsWith('l') ? 4 : undefined,
                right: pos.endsWith('r') ? 4 : undefined,
                borderTop: pos.startsWith('t')
                  ? `1.5px solid ${cfg.narratorBorderColor}`
                  : undefined,
                borderBottom: pos.startsWith('b')
                  ? `1.5px solid ${cfg.narratorBorderColor}`
                  : undefined,
                borderLeft: pos.endsWith('l')
                  ? `1.5px solid ${cfg.narratorBorderColor}`
                  : undefined,
                borderRight: pos.endsWith('r')
                  ? `1.5px solid ${cfg.narratorBorderColor}`
                  : undefined,
              }}
            />
          ))}
          {/* Séparateur ornemental */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to right, transparent, ${cfg.narratorBorderColor}55)`,
              }}
            />
            <span style={{ color: cfg.narratorBorderColor, fontSize: 7, lineHeight: 1 }}>✦</span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to left, transparent, ${cfg.narratorBorderColor}55)`,
              }}
            />
          </div>
          <p
            style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 11,
              color: cfg.narratorTextColor,
              lineHeight: 1.7,
              textAlign: 'center',
              margin: 0,
            }}
          >
            Le vent soufflait sur la plaine silencieuse…
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to right, transparent, ${cfg.narratorBorderColor}55)`,
              }}
            />
            <span style={{ color: cfg.narratorBorderColor, fontSize: 7, lineHeight: 1 }}>✦</span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to left, transparent, ${cfg.narratorBorderColor}55)`,
              }}
            />
          </div>
        </div>

        {/* Couleurs */}
        <ColorRow
          label="Fond"
          value={cfg.narratorBgColor ?? '#070a1a'}
          onChange={(v) => update({ narratorBgColor: v })}
        />
        <ColorRow
          label="Texte"
          value={cfg.narratorTextColor ?? '#ede8d5'}
          onChange={(v) => update({ narratorTextColor: v })}
        />
        <ColorRow
          label="Bordure / ✦"
          value={cfg.narratorBorderColor ?? '#c9a84c'}
          onChange={(v) => update({ narratorBorderColor: v })}
        />
        <SliderRow
          label="Opacité du fond"
          value={Math.round((cfg.narratorBgOpacity ?? 0.93) * 100)}
          min={20}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => update({ narratorBgOpacity: v / 100 })}
          ariaLabel={`Opacité fond narrateur : ${Math.round((cfg.narratorBgOpacity ?? 0.93) * 100)} %`}
        />

        {/* Reset Octopath */}
        <button
          onClick={() =>
            update({
              narratorBgColor: '#070a1a',
              narratorTextColor: '#ede8d5',
              narratorBorderColor: '#c9a84c',
              narratorBgOpacity: 0.93,
            })
          }
          className="mt-2 w-full text-xs py-1.5 px-3 rounded-lg border border-dashed border-[var(--color-border-base)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors"
        >
          ↩ Réinitialiser style Octopath
        </button>
      </PanelSection>
    </div>
  );
}
