/**
 * CountBadge — pastille de comptage pour les panneaux éditeur.
 *
 * Remplace le pattern répété (14+ occurrences) :
 *   <span style={{ fontSize: 10-11, color: 'var(--color-text-secondary)',
 *     background: 'var(--color-border-base)', padding: '1px 6px', borderRadius: 8 }}>N</span>
 *
 * @example
 *   <CountBadge>{sprites.length}</CountBadge>
 *   <CountBadge variant="primary" ml>3</CountBadge>
 */
import * as React from 'react';

interface CountBadgeProps {
  children: React.ReactNode;
  /** Couleur de fond — neutre (défaut) ou primary pour les badges actifs */
  variant?: 'neutral' | 'primary';
  /** Ajoute marginLeft: 'auto' pour pousser le badge à droite dans un flex row */
  ml?: boolean;
  style?: React.CSSProperties;
}

export function CountBadge({ children, variant = 'neutral', ml, style }: CountBadgeProps) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        color: variant === 'primary' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        background: variant === 'primary' ? 'var(--color-primary-15)' : 'var(--color-border-base)',
        padding: '1px 6px',
        borderRadius: 8,
        flexShrink: 0,
        ...(ml ? { marginLeft: 'auto' } : {}),
        ...style,
      }}
    >
      {children}
    </span>
  );
}
