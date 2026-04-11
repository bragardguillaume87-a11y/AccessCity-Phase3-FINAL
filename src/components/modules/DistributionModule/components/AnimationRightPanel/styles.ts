import type React from 'react';

export const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

export const rowBetween: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const emptyText: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
};

export const smallBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '3px 6px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: 600,
  border: '1px solid var(--color-border-base)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
};

export const selectStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 10,
  padding: '2px 4px',
  borderRadius: 4,
  border: '1px solid var(--color-border-base)',
  background: 'var(--color-bg-base)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
};

export function clipRowStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 7px',
    borderRadius: 5,
    cursor: 'pointer',
    fontSize: 11,
    textAlign: 'left',
    border: active ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
    background: active ? 'var(--color-primary-subtle)' : 'transparent',
    color: 'var(--color-text-secondary)',
  };
}
