/**
 * TextSection_v2/NarratorSection.tsx
 * Section NARRATEUR — style Octopath Traveler (boîte navy + bordure dorée).
 * Preview live des paramètres narrateur (Bret Victor §7).
 */

import { SliderRow } from '@/components/ui/SliderRow';
import { ColorRow } from './shared';
import type { DialogueBoxStyle } from '@/types/scenes';

// Coins décoratifs réutilisés dans la preview narrateur
const CORNER_POSITIONS = ['tl', 'tr', 'bl', 'br'] as const;
type CornerPos = (typeof CORNER_POSITIONS)[number];

function cornerStyle(pos: CornerPos, color: string): React.CSSProperties {
  return {
    position: 'absolute',
    width: 7,
    height: 7,
    top: pos.startsWith('t') ? 3 : undefined,
    bottom: pos.startsWith('b') ? 3 : undefined,
    left: pos.endsWith('l') ? 4 : undefined,
    right: pos.endsWith('r') ? 4 : undefined,
    borderTop: pos.startsWith('t') ? `1.5px solid ${color}` : undefined,
    borderBottom: pos.startsWith('b') ? `1.5px solid ${color}` : undefined,
    borderLeft: pos.endsWith('l') ? `1.5px solid ${color}` : undefined,
    borderRight: pos.endsWith('r') ? `1.5px solid ${color}` : undefined,
  };
}

interface NarratorSectionProps {
  cfg: Required<DialogueBoxStyle>;
  onUpdate: (patch: Partial<DialogueBoxStyle>) => void;
}

export function NarratorSection({ cfg, onUpdate }: NarratorSectionProps) {
  const bgColor = cfg.narratorBgColor ?? '#070a1a';
  const textColor = cfg.narratorTextColor ?? '#ede8d5';
  const borderColor = cfg.narratorBorderColor ?? '#c9a84c';
  const bgOpacity = cfg.narratorBgOpacity ?? 0.93;

  const opacityHex = Math.round(bgOpacity * 255)
    .toString(16)
    .padStart(2, '0');

  const handleReset = () => {
    onUpdate({
      narratorBgColor: '#070a1a',
      narratorTextColor: '#ede8d5',
      narratorBorderColor: '#c9a84c',
      narratorBgOpacity: 0.93,
    });
  };

  return (
    <>
      <p className="text-[10px] text-[var(--color-text-muted)] mb-3 leading-relaxed">
        Dialogues sans speaker — style Octopath Traveler (boîte navy + bordure dorée).
      </p>

      {/* Mini-preview live (Bret Victor §7) */}
      <div
        className="mb-3 relative overflow-hidden"
        aria-hidden="true"
        style={{
          background: `${bgColor}${opacityHex}`,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 4,
          padding: '10px 14px',
          boxShadow: `0 0 0 1px ${borderColor}18, inset 0 0 20px rgba(0,0,0,0.3)`,
        }}
      >
        {CORNER_POSITIONS.map((pos) => (
          <span key={pos} style={cornerStyle(pos, borderColor)} />
        ))}

        {/* Séparateur ornemental haut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <div
            style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(to right, transparent, ${borderColor}55)`,
            }}
          />
          <span style={{ color: borderColor, fontSize: 7, lineHeight: 1 }}>✦</span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(to left, transparent, ${borderColor}55)`,
            }}
          />
        </div>

        <p
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 11,
            color: textColor,
            lineHeight: 1.7,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Le vent soufflait sur la plaine silencieuse…
        </p>

        {/* Séparateur ornemental bas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
          <div
            style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(to right, transparent, ${borderColor}55)`,
            }}
          />
          <span style={{ color: borderColor, fontSize: 7, lineHeight: 1 }}>✦</span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(to left, transparent, ${borderColor}55)`,
            }}
          />
        </div>
      </div>

      {/* Couleurs */}
      <ColorRow label="Fond" value={bgColor} onChange={(v) => onUpdate({ narratorBgColor: v })} />
      <ColorRow
        label="Texte"
        value={textColor}
        onChange={(v) => onUpdate({ narratorTextColor: v })}
      />
      <ColorRow
        label="Bordure / ✦"
        value={borderColor}
        onChange={(v) => onUpdate({ narratorBorderColor: v })}
      />

      <SliderRow
        label="Opacité du fond"
        value={Math.round(bgOpacity * 100)}
        min={20}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onUpdate({ narratorBgOpacity: v / 100 })}
        ariaLabel={`Opacité fond narrateur : ${Math.round(bgOpacity * 100)} %`}
        className="mb-3"
      />

      {/* Reset Octopath */}
      <button
        onClick={handleReset}
        className="mt-2 w-full text-xs py-1.5 px-3 rounded-lg border border-dashed border-[var(--color-border-base)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors"
      >
        ↩ Réinitialiser style Octopath
      </button>
    </>
  );
}
