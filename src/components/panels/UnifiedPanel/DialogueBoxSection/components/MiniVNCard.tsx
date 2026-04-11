export function MiniVNCard({
  number,
  label,
  color,
  speakerName,
  speakerColor,
  text,
}: {
  number: 1 | 2;
  label: string;
  color: string;
  speakerName: string;
  speakerColor: string;
  text: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        <span
          style={{
            background: color,
            color: '#000',
            borderRadius: '50%',
            width: 16,
            height: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {number}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
      </div>
      {/* Fond sombre style VN — Bret Victor : montrer la chose réelle */}
      <div
        style={{
          background: 'rgba(3,7,18,0.90)',
          borderRadius: 10,
          border: `1px solid ${color}33`,
          padding: '10px 14px',
          boxShadow: `0 0 0 1px ${color}18`,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: speakerColor,
            margin: '0 0 5px',
            letterSpacing: 0.4,
          }}
        >
          {speakerName}
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-text-primary)',
            lineHeight: 1.6,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
