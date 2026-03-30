/**
 * TextSection_v2/BoxPosition.tsx
 * Section POSITION — grille 3×3 de positionnement + mode libre + largeur.
 * Section propre, séparée de l'apparence visuelle (layout ≠ style).
 */

import { Move } from 'lucide-react';
import { SliderRow } from '@/components/ui/SliderRow';
import type { DialogueBoxPosition } from '@/utils/dialogueBoxPosition';
import type { DialogueBoxStyle } from '@/types/scenes';

const POSITION_GRID: Array<{
  value: DialogueBoxPosition;
  label: string;
  row: number;
  col: number;
}> = [
  { value: 'top-left', label: '↖', row: 0, col: 0 },
  { value: 'top', label: '↑', row: 0, col: 1 },
  { value: 'top-right', label: '↗', row: 0, col: 2 },
  { value: 'center', label: '⬜', row: 1, col: 1 },
  { value: 'bottom-left', label: '↙', row: 2, col: 0 },
  { value: 'bottom', label: '↓', row: 2, col: 1 },
  { value: 'bottom-right', label: '↘', row: 2, col: 2 },
];

function cellStyle(active: boolean): React.CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: 5,
    border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border-base)',
    background: active ? 'var(--color-primary-subtle)' : 'rgba(255,255,255,0.04)',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.12s',
  };
}

interface BoxPositionProps {
  cfg: Required<DialogueBoxStyle>;
  onUpdate: (patch: Partial<DialogueBoxStyle>) => void;
}

export function BoxPosition({ cfg, onUpdate }: BoxPositionProps) {
  return (
    <>
      {/* ── Grille 3×3 ── */}
      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
        POSITION
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 28px)',
          gridTemplateRows: 'repeat(3, 28px)',
          gap: 3,
          marginBottom: 8,
        }}
      >
        {/* Ligne 0 */}
        {POSITION_GRID.filter((p) => p.row === 0).map((p) => (
          <button
            key={p.value}
            onClick={() => onUpdate({ position: p.value })}
            aria-label={`Position ${p.value}`}
            aria-pressed={cfg.position === p.value}
            style={{ ...cellStyle(cfg.position === p.value), gridRow: 1, gridColumn: p.col + 1 }}
          >
            {p.label}
          </button>
        ))}

        {/* Ligne 1 : centre seulement (gauche/droite vides) */}
        <div style={{ gridRow: 2, gridColumn: 1, width: 28, height: 28 }} />
        {POSITION_GRID.filter((p) => p.row === 1).map((p) => (
          <button
            key={p.value}
            onClick={() => onUpdate({ position: p.value })}
            aria-label={`Position ${p.value}`}
            aria-pressed={cfg.position === p.value}
            style={{ ...cellStyle(cfg.position === p.value), gridRow: 2, gridColumn: p.col + 1 }}
          >
            {p.label}
          </button>
        ))}
        <div style={{ gridRow: 2, gridColumn: 3, width: 28, height: 28 }} />

        {/* Ligne 2 */}
        {POSITION_GRID.filter((p) => p.row === 2).map((p) => (
          <button
            key={p.value}
            onClick={() => onUpdate({ position: p.value })}
            aria-label={`Position ${p.value}`}
            aria-pressed={cfg.position === p.value}
            style={{ ...cellStyle(cfg.position === p.value), gridRow: 3, gridColumn: p.col + 1 }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Mode libre ── */}
      <button
        onClick={() => onUpdate({ position: 'custom' })}
        aria-pressed={cfg.position === 'custom'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 5,
          border:
            cfg.position === 'custom'
              ? '2px solid var(--color-primary)'
              : '1px solid var(--color-border-base)',
          background:
            cfg.position === 'custom' ? 'var(--color-primary-subtle)' : 'rgba(255,255,255,0.04)',
          color: cfg.position === 'custom' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          fontSize: 10,
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'center',
          transition: 'all 0.12s',
          marginBottom: 6,
        }}
      >
        <Move size={10} /> Mode libre (glisser dans la preview)
      </button>

      {/* Champs X/Y — mode custom uniquement */}
      {cfg.position === 'custom' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontSize: 9,
                color: 'var(--color-text-disabled)',
                fontFamily: 'var(--font-family-mono)',
              }}
            >
              X %
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={cfg.positionX}
              onChange={(e) => onUpdate({ positionX: Number(e.target.value) })}
              aria-label="Position X en pourcentage"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border-base)',
                borderRadius: 4,
                padding: '3px 6px',
                fontSize: 11,
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-family-mono)',
              }}
            />
          </label>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontSize: 9,
                color: 'var(--color-text-disabled)',
                fontFamily: 'var(--font-family-mono)',
              }}
            >
              Y %
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={cfg.positionY}
              onChange={(e) => onUpdate({ positionY: Number(e.target.value) })}
              aria-label="Position Y en pourcentage"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border-base)',
                borderRadius: 4,
                padding: '3px 6px',
                fontSize: 11,
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-family-mono)',
              }}
            />
          </label>
        </div>
      )}

      {/* ── Largeur ── */}
      <SliderRow
        label="Largeur"
        value={cfg.boxWidth ?? 76}
        min={40}
        max={100}
        step={2}
        unit="%"
        onChange={(v) => onUpdate({ boxWidth: v })}
        ariaLabel={`Largeur de la boîte : ${cfg.boxWidth ?? 76} % du canvas`}
        className="mb-1"
      />
    </>
  );
}
