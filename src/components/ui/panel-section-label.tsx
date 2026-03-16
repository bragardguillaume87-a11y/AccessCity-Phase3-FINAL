/**
 * PanelSectionLabel — étiquette de section uppercase pour les panneaux éditeur.
 *
 * Remplace le pattern répété dans TopdownEditor (17+ occurrences) :
 *   <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
 *     letterSpacing: '0.08em', color: 'var(--color-text-secondary)' }}>…</span>
 *
 * @example
 *   <PanelSectionLabel>Calques</PanelSectionLabel>
 *   <PanelSectionLabel as="p" spacing="bottom">Animation</PanelSectionLabel>
 */
import * as React from 'react';

interface PanelSectionLabelProps {
  children: React.ReactNode;
  /** Élément HTML rendu — span par défaut, p pour les sections avec margin-bottom */
  as?: 'span' | 'p' | 'div';
  /** Ajoute margin-bottom: 6px pour séparer la section du contenu */
  spacing?: 'bottom';
  style?: React.CSSProperties;
  className?: string;
}

const BASE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: 'var(--color-text-secondary)',
  margin: 0,
};

export function PanelSectionLabel({
  children,
  as: Tag = 'span',
  spacing,
  style,
  className,
}: PanelSectionLabelProps) {
  return (
    <Tag
      className={className}
      style={{
        ...BASE_STYLE,
        ...(spacing === 'bottom' ? { marginBottom: 6, display: 'block' } : {}),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
