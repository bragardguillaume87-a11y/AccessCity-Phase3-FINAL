/**
 * TextSection_v2/BoxAppearance.tsx
 * Section BOÎTE — tout le visuel de la dialogue box :
 *   vitesse de frappe (slider inversé), taille, couleurs, opacité, bordure, arrondi, transitions.
 *
 * Slider vitesse inversé : gauche = Rapide (20ms), droite = Lente (120ms).
 * La valeur interne reste en ms ; le display est inversé pour l'intuitivité.
 */

import { SliderRow } from '@/components/ui/SliderRow';
import type { DialogueBoxStyle } from '@/types/scenes';
import { ToggleGroup, ColorRow, SubSection, CardGrid } from './shared';

const SPEED_MIN = 20;
const SPEED_MAX = 120;

/** Convertit ms → valeur affichée sur le slider inversé (gauche = rapide). */
function msToDisplay(ms: number) {
  return SPEED_MAX + SPEED_MIN - ms;
}
/** Convertit valeur slider inversé → ms. */
function displayToMs(display: number) {
  return SPEED_MAX + SPEED_MIN - display;
}
/** Traduit une valeur ms en label lisible. */
function speedLabel(ms: number): string {
  if (ms <= 30) return 'Très rapide';
  if (ms <= 50) return 'Rapide';
  if (ms <= 75) return 'Normal';
  if (ms <= 95) return 'Lente';
  return 'Très lente';
}

const TRANSITION_OPTIONS = [
  { value: 'aucune' as const, icon: '⚡', label: 'Instantané', desc: 'Swap direct' },
  { value: 'fondu' as const, icon: '🌅', label: 'Fondu', desc: 'Fade doux' },
  { value: 'glisse' as const, icon: '🎭', label: 'Glisse', desc: 'Style VN' },
];

interface BoxAppearanceProps {
  cfg: Required<DialogueBoxStyle>;
  /** Met à jour le store ET efface l'activeTheme (édition manuelle). */
  onUpdate: (patch: Partial<DialogueBoxStyle>) => void;
}

export function BoxAppearance({ cfg, onUpdate }: BoxAppearanceProps) {
  return (
    <>
      {/* ── Vitesse de frappe (slider inversé) ── */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--color-text-secondary)]">Vitesse de frappe</span>
          <span
            className="text-[11px] text-[var(--color-primary)] font-mono font-semibold"
            title={`${cfg.typewriterSpeed} ms par caractère`}
          >
            {speedLabel(cfg.typewriterSpeed)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span title="Rapide" style={{ fontSize: 13, lineHeight: 1, cursor: 'default' }}>
            ⚡
          </span>
          <input
            type="range"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={5}
            value={msToDisplay(cfg.typewriterSpeed)}
            onChange={(e) => onUpdate({ typewriterSpeed: displayToMs(Number(e.target.value)) })}
            className="flex-1 accent-[var(--color-primary)]"
            aria-label={`Vitesse de frappe : ${speedLabel(cfg.typewriterSpeed)} (${cfg.typewriterSpeed} ms/car)`}
            style={{ height: 4, cursor: 'pointer' }}
          />
          <span title="Lente" style={{ fontSize: 13, lineHeight: 1, cursor: 'default' }}>
            🐌
          </span>
        </div>
      </div>

      {/* ── Taille du texte ── */}
      <SliderRow
        label="Taille du texte"
        value={cfg.fontSize}
        min={12}
        max={24}
        step={1}
        unit="px"
        onChange={(v) => onUpdate({ fontSize: v })}
        ariaLabel={`Taille du texte : ${cfg.fontSize} pixels`}
        className="mb-3"
      />

      {/* ── Couleurs & Opacité ── */}
      <SubSection
        title="COULEURS & OPACITÉ"
        defaultOpen={false}
        badge={`Opacité ${Math.round(cfg.boxOpacity * 100)}%`}
      >
        <ColorRow label="Fond" value={cfg.bgColor} onChange={(v) => onUpdate({ bgColor: v })} />
        <ColorRow
          label="Texte"
          value={cfg.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
        />
        <ColorRow
          label="Bordure"
          value={cfg.borderColor}
          onChange={(v) => onUpdate({ borderColor: v })}
        />
        <SliderRow
          label="Opacité du fond"
          value={Math.round(cfg.boxOpacity * 100)}
          min={20}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onUpdate({ boxOpacity: v / 100 })}
          ariaLabel={`Opacité du fond : ${Math.round(cfg.boxOpacity * 100)} %`}
          className="mb-3"
        />
      </SubSection>

      {/* ── Style (bordure + arrondi) ── */}
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
          onChange={(v) => onUpdate({ borderStyle: v })}
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
          onChange={(v) => onUpdate({ borderRadius: v })}
        />
      </SubSection>

      {/* ── Transitions ── */}
      <SubSection
        title="TRANSITIONS"
        defaultOpen={false}
        badge={{ aucune: 'Instantané', fondu: 'Fondu', glisse: 'Glisse' }[cfg.dialogueTransition]}
      >
        <CardGrid
          cols={3}
          options={TRANSITION_OPTIONS}
          value={cfg.dialogueTransition}
          onChange={(v) => onUpdate({ dialogueTransition: v })}
        />
      </SubSection>
    </>
  );
}
