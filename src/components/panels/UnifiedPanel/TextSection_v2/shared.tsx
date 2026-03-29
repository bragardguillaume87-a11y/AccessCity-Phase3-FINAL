/**
 * TextSection_v2/shared.tsx
 * Composants utilitaires partagés entre les sous-sections du panneau Style.
 */

import { useState } from 'react';

// ─── ToggleGroup ──────────────────────────────────────────────────────────────

export function ToggleGroup<T extends string>({
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

// ─── ColorRow ─────────────────────────────────────────────────────────────────

export function ColorRow({
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

// ─── SubSection ───────────────────────────────────────────────────────────────

export function SubSection({
  title,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
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

// ─── CardGrid ─────────────────────────────────────────────────────────────────
// Grille de cartes avec emoji + label + description (layout/transition cards)

export function CardGrid<T extends string>({
  cols,
  options,
  value,
  onChange,
}: {
  cols: 2 | 3;
  options: readonly { value: T; icon: string; label: string; desc: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={`grid gap-2 mb-1 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={[
            'flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all',
            value === opt.value
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
  );
}
