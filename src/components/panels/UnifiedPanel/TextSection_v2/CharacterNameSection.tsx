/**
 * TextSection_v2/CharacterNameSection.tsx
 * Section NOM DU PERSONNAGE — police, ombre, couleur, espacement, alignement.
 */

import { RotateCcw } from 'lucide-react';
import { SliderRow } from '@/components/ui/SliderRow';
import {
  NAME_FONTS,
  NAME_SHADOW_LABELS,
  DEFAULT_NAME_FONT_ID,
  DEFAULT_NAME_SHADOW,
  type NameShadowPreset,
} from '@/config/nameFonts';
import type { DialogueBoxStyle } from '@/types/scenes';

interface CharacterNameSectionProps {
  cfg: Required<DialogueBoxStyle>;
  onUpdate: (patch: Partial<DialogueBoxStyle>) => void;
}

export function CharacterNameSection({ cfg, onUpdate }: CharacterNameSectionProps) {
  const hasCustomColor = Boolean(cfg.nameColor && cfg.nameColor !== '');

  return (
    <>
      {/* ── Police ── */}
      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
        POLICE
      </p>
      <div className="grid grid-cols-4 gap-1 mb-4">
        {NAME_FONTS.map((font) => {
          const isActive = (cfg.nameFont ?? DEFAULT_NAME_FONT_ID) === font.id;
          return (
            <button
              key={font.id}
              onClick={() => onUpdate({ nameFont: font.id })}
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
              <span className="text-[8.5px] leading-none text-center opacity-80">{font.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Ombre ── */}
      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
        OMBRE
      </p>
      <div className="sp-seg mb-3">
        {(Object.keys(NAME_SHADOW_LABELS) as NameShadowPreset[]).map((s) => (
          <button
            key={s}
            onClick={() => onUpdate({ nameShadow: s })}
            className={`sp-seg-btn${(cfg.nameShadow ?? DEFAULT_NAME_SHADOW) === s ? ' active' : ''}`}
            aria-pressed={(cfg.nameShadow ?? DEFAULT_NAME_SHADOW) === s}
          >
            {NAME_SHADOW_LABELS[s]}
          </button>
        ))}
      </div>

      {/* ── Couleur du nom ── */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--color-text-secondary)]">Couleur du nom</span>
        <div className="flex items-center gap-2">
          {hasCustomColor ? (
            <button
              onClick={() => onUpdate({ nameColor: '' })}
              className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
              title="Utiliser la couleur automatique du personnage"
              aria-label="Réinitialiser la couleur du nom"
            >
              <RotateCcw className="w-2.5 h-2.5" aria-hidden="true" />
              Auto
            </button>
          ) : (
            <span className="text-[10px] text-[var(--color-text-muted)] italic">Auto</span>
          )}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span
              className="w-5 h-5 rounded border border-[var(--color-border-base)] shadow-inner flex-shrink-0"
              style={{
                background: hasCustomColor ? cfg.nameColor : '#8b5cf6',
                opacity: hasCustomColor ? 1 : 0.35,
              }}
              aria-hidden="true"
            />
            <input
              type="color"
              value={hasCustomColor ? cfg.nameColor : '#8b5cf6'}
              onChange={(e) => onUpdate({ nameColor: e.target.value })}
              className="sr-only"
              aria-label="Couleur du nom du personnage"
            />
          </label>
        </div>
      </div>

      {/* ── Espacement lettres ── */}
      <SliderRow
        label="Espacement lettres"
        value={cfg.nameLetterSpacing ?? 1.5}
        min={0}
        max={8}
        step={0.5}
        unit="px"
        onChange={(v) => onUpdate({ nameLetterSpacing: v })}
        ariaLabel={`Espacement des lettres du nom : ${cfg.nameLetterSpacing ?? 1.5} px`}
        className="mb-3"
      />

      {/* ── Alignement ── */}
      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
        ALIGNEMENT DU NOM
      </p>
      <div className="sp-seg mb-1">
        <button
          onClick={() => onUpdate({ speakerAlign: 'auto' })}
          className={`sp-seg-btn${cfg.speakerAlign === 'auto' ? ' active' : ''}`}
          aria-pressed={cfg.speakerAlign === 'auto'}
          title="Gauche si sprite x<50%, droite sinon"
        >
          Auto
        </button>
        <button
          onClick={() => onUpdate({ speakerAlign: 'left' })}
          className={`sp-seg-btn${cfg.speakerAlign === 'left' ? ' active' : ''}`}
          aria-pressed={cfg.speakerAlign === 'left'}
        >
          Toujours gauche
        </button>
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
        Auto : nom à gauche si le sprite est dans la moitié gauche du canvas, à droite sinon.
      </p>
    </>
  );
}
