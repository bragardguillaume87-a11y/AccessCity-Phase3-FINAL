/**
 * ToolbarToggleButton — bouton toolbar avec état actif/inactif.
 *
 * Remplace le pattern répété dans TopdownEditor (20+ occurrences) :
 *   <button style={{
 *     padding: '3px 8px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
 *     border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
 *     background: active ? 'var(--color-primary-20)' : 'transparent',
 *     color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
 *   }}>…</button>
 *
 * @example
 *   <ToolbarToggleButton active={showGrid} onClick={toggleGrid} title="Grille (G)">
 *     ⊞ Grille
 *   </ToolbarToggleButton>
 *
 *   <ToolbarToggleButton active={isActive} size="sm" variant="subtle">
 *     <EyeIcon size={12} /> Calque
 *   </ToolbarToggleButton>
 */
import * as React from 'react';

interface ToolbarToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** sm = padding plus petit, md = défaut */
  size?: 'sm' | 'md';
  /** filled = bordure + fond actif (défaut), subtle = fond seul sans bordure active */
  variant?: 'filled' | 'subtle';
  children: React.ReactNode;
}

export function ToolbarToggleButton({
  active = false,
  size = 'md',
  variant = 'filled',
  children,
  style,
  ...props
}: ToolbarToggleButtonProps) {
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        fontSize: 12,
        borderRadius: 4,
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        border:
          variant === 'filled'
            ? `1px solid ${active ? 'var(--color-primary-40)' : 'var(--color-border-base)'}`
            : '1px solid transparent',
        background: active ? 'var(--color-primary-20)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        transition: 'all 0.15s',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
