import { T, FONTS } from './constants';

export function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span
        style={{
          fontFamily: FONTS.display,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: T.card,
        border: `1.5px solid ${T.border}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
