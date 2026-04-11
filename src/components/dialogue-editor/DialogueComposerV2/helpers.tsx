import type { CSSProperties } from 'react';
import { T, FONTS } from './constants';
import { DIALOGUE_MAX_TEXT_LENGTH } from '@/config/dialogueValidation';

// ── Styles Octopath Traveler — partagés entre MinigameFormPanel et ComposerFormPanel ──
const OCTOPATH_CARD: CSSProperties = {
  borderRadius: 12,
  border: '1.5px solid rgba(139,92,246,0.22)',
  overflow: 'hidden',
  background: 'linear-gradient(158deg, #ffffff 0%, #f7f4ff 58%, #ede6ff 100%)',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  boxShadow:
    '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
};

export function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <div style={{ width: 3, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span
        style={{
          fontFamily: FONTS.display,
          fontSize: 13,
          fontWeight: 800,
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Boîte de dialogue style Octopath Traveler — partagée entre
 * ComposerFormPanel (types binary/dice/expert) et MinigameFormPanel.
 */
export function DialogueTextareaCard({
  value,
  onChange,
  placeholder = 'Écris le dialogue…',
  maxLength = DIALOGUE_MAX_TEXT_LENGTH,
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const charCount = value.length;
  const wordCount = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
  const readingTimeSec = Math.ceil(wordCount / 2.5); // ~150 mots/min pour enfants 10-12
  const isLong = wordCount > 80;
  const charWarning = charCount > 300;
  const showFooter = charWarning || wordCount > 0;
  return (
    <div style={OCTOPATH_CARD}>
      <textarea
        className="ac-dialogue-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={maxLength}
        aria-label="Texte du dialogue"
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '10px 14px',
          fontSize: 15,
          fontWeight: 600,
          color: '#1a1233',
          resize: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.55,
          outline: 'none',
          boxSizing: 'border-box',
          minHeight: 80,
          display: 'block',
        }}
      />
      {showFooter && (
        <div
          style={{
            padding: '5px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(139,92,246,0.06)',
            borderTop: '1px solid rgba(139,92,246,0.15)',
            gap: 8,
          }}
        >
          {wordCount > 0 && (
            <span
              title="Nombre de mots et temps de lecture estimé pour enfants 10-12 ans"
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isLong ? '#d97706' : 'rgba(139,92,246,0.7)',
                background: isLong ? 'rgba(217,119,6,0.10)' : 'rgba(139,92,246,0.08)',
                border: `1.5px solid ${isLong ? 'rgba(217,119,6,0.30)' : 'rgba(139,92,246,0.20)'}`,
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              💬 {wordCount} mot{wordCount > 1 ? 's' : ''} · ~{readingTimeSec}s
            </span>
          )}
          {charWarning && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: charCount > 450 ? '#dc2626' : '#d97706',
                background: charCount > 450 ? 'rgba(239,68,68,0.10)' : 'rgba(217,119,6,0.10)',
                border: `1.5px solid ${charCount > 450 ? 'rgba(239,68,68,0.30)' : 'rgba(217,119,6,0.30)'}`,
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              ⚠ {charCount} / {maxLength}
            </span>
          )}
        </div>
      )}
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
