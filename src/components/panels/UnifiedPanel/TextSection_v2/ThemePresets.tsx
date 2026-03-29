/**
 * TextSection_v2/ThemePresets.tsx
 * 5 presets de thème avec état actif persistant.
 * Miyamoto §1.1 : feedback immédiat + état visible (Norman §9.4).
 */

import type { DialogueBoxStyle } from '@/types/scenes';

export const THEMES: Array<{
  label: string;
  icon: string;
  patch: Partial<DialogueBoxStyle>;
}> = [
  {
    label: 'Sombre',
    icon: '🌙',
    patch: {
      bgColor: '#030712',
      textColor: '#ffffff',
      borderColor: '#ffffff',
      borderRadius: 'xl',
      borderStyle: 'subtle',
    },
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

interface ThemePresetsProps {
  /** Nom du thème actif (null si personnalisé) */
  activeTheme: string | null;
  onApply: (patch: Partial<DialogueBoxStyle>, label: string) => void;
}

export function ThemePresets({ activeTheme, onApply }: ThemePresetsProps) {
  return (
    <>
      <div className="grid grid-cols-5 gap-1 mb-2">
        {THEMES.map((theme) => {
          const isActive = activeTheme === theme.label;
          return (
            <button
              key={theme.label}
              onClick={() => onApply(theme.patch, theme.label)}
              aria-label={`Appliquer le thème ${theme.label}`}
              aria-pressed={isActive}
              title={theme.label}
              className={[
                'flex flex-col items-center gap-0.5 py-1.5 px-0.5 rounded-md border transition-all text-center',
                isActive
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'border-[var(--color-border-base)] hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              <span className="text-base leading-none">{theme.icon}</span>
              <span className="text-[9px] leading-none">{theme.label}</span>
              {isActive && (
                <span
                  className="text-[8px] leading-none text-[var(--color-primary)]"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
        {activeTheme
          ? `Thème actif : ${activeTheme} — modifiez ci-dessous pour personnaliser.`
          : 'Applique couleurs, bordure et arrondi — personnalisable dans BOÎTE ci-dessous.'}
      </p>
    </>
  );
}
