/**
 * SpriteImportDialog.styles.ts — constantes de style CSS-in-JS
 *
 * Extrait de SpriteImportDialog.tsx pour réduire la taille du fichier principal
 * et faciliter la réutilisation/modification des styles sans toucher à la logique.
 */
import type React from 'react';

export const sectionLabel: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

export const textInputStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 5,
  boxSizing: 'border-box',
  border: '1px solid var(--color-border-base)',
  background: 'rgba(0,0,0,0.3)',
  color: 'var(--color-text-base)',
  fontSize: 13,
  outline: 'none',
};

export const numInput: React.CSSProperties = {
  width: 58,
  padding: '5px 6px',
  borderRadius: 4,
  textAlign: 'center',
  border: '1px solid var(--color-border-base)',
  background: 'rgba(0,0,0,0.3)',
  color: 'var(--color-text-base)',
  fontSize: 12,
  outline: 'none',
};

export const labelRow: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };

export const labelText: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

export const lpcBtnSmall: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 7px',
  borderRadius: 5,
  cursor: 'pointer',
  border: '1px solid var(--color-primary-glow)',
  background: 'var(--color-primary-subtle)',
  color: 'var(--color-primary)',
  fontSize: 10,
  fontWeight: 600,
};

export const badgeStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-secondary)',
  flexShrink: 0,
  background: 'rgba(255,255,255,0.06)',
  padding: '2px 7px',
  borderRadius: 4,
};

export const cancelBtn: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  border: '1px solid var(--color-border-base)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
};

export const confirmBtn: React.CSSProperties = {
  padding: '7px 18px',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  background: 'var(--color-primary)',
  color: '#fff',
};

export const zoomBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  borderRadius: 5,
  cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(0,0,0,0.6)',
  color: 'rgba(255,255,255,0.7)',
};

export const previewCtrlBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: 5,
  cursor: 'pointer',
  border: '1px solid var(--color-border-base)',
  background: 'transparent',
};

/** Onglet du panneau droit (inactif) */
export const rightPanelTab: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  borderBottom: '2px solid transparent',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  transition: 'all 0.15s',
};

/** Onglet du panneau droit (actif) */
export const rightPanelTabActive: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  borderBottom: '2px solid var(--color-primary)',
  background: 'transparent',
  color: 'var(--color-primary)',
  transition: 'all 0.15s',
};
