import { motion } from 'framer-motion';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';

// ── Couleurs par mood — design brief §mood-pips ──────────────────────────────
const MOOD_COLORS: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  neutral: {
    border: 'rgba(192,132,252,0.85)',
    bg: 'rgba(139,92,246,0.22)',
    text: '#c4b5fd',
    glow: '0 0 0 3px rgba(139,92,246,0.30), 0 0 16px rgba(139,92,246,0.35)',
  },
  happy: {
    border: 'rgba(74,222,128,0.85)',
    bg: 'rgba(74,222,128,0.22)',
    text: '#86efac',
    glow: '0 0 0 3px rgba(74,222,128,0.30), 0 0 16px rgba(74,222,128,0.35)',
  },
  sad: {
    border: 'rgba(96,165,250,0.85)',
    bg: 'rgba(96,165,250,0.22)',
    text: '#93c5fd',
    glow: '0 0 0 3px rgba(96,165,250,0.30), 0 0 16px rgba(96,165,250,0.35)',
  },
  angry: {
    border: 'rgba(248,113,113,0.85)',
    bg: 'rgba(248,113,113,0.22)',
    text: '#fca5a5',
    glow: '0 0 0 3px rgba(239,68,68,0.30), 0 0 16px rgba(239,68,68,0.35)',
  },
  surprised: {
    border: 'rgba(251,191,36,0.85)',
    bg: 'rgba(251,191,36,0.22)',
    text: '#fde68a',
    glow: '0 0 0 3px rgba(251,191,36,0.30), 0 0 16px rgba(251,191,36,0.35)',
  },
  confused: {
    border: 'rgba(253,164,208,0.85)',
    bg: 'rgba(236,72,153,0.18)',
    text: '#fda4d0',
    glow: '0 0 0 3px rgba(236,72,153,0.30), 0 0 16px rgba(236,72,153,0.35)',
  },
  scared: {
    border: 'rgba(249,115,22,0.85)',
    bg: 'rgba(249,115,22,0.18)',
    text: '#fdba74',
    glow: '0 0 0 3px rgba(249,115,22,0.30), 0 0 16px rgba(249,115,22,0.35)',
  },
  excited: {
    border: 'rgba(250,204,21,0.85)',
    bg: 'rgba(250,204,21,0.18)',
    text: '#fef08a',
    glow: '0 0 0 3px rgba(250,204,21,0.30), 0 0 16px rgba(250,204,21,0.35)',
  },
  professional: {
    border: 'rgba(96,165,250,0.85)',
    bg: 'rgba(59,130,246,0.18)',
    text: '#bfdbfe',
    glow: '0 0 0 3px rgba(59,130,246,0.30), 0 0 16px rgba(59,130,246,0.35)',
  },
  helpful: {
    border: 'rgba(45,212,191,0.85)',
    bg: 'rgba(45,212,191,0.18)',
    text: '#99f6e4',
    glow: '0 0 0 3px rgba(45,212,191,0.30), 0 0 16px rgba(45,212,191,0.35)',
  },
  tired: {
    border: 'rgba(148,163,184,0.85)',
    bg: 'rgba(148,163,184,0.18)',
    text: '#cbd5e1',
    glow: '0 0 0 3px rgba(148,163,184,0.30), 0 0 16px rgba(148,163,184,0.35)',
  },
  thoughtful: {
    border: 'rgba(167,139,250,0.85)',
    bg: 'rgba(167,139,250,0.18)',
    text: '#ddd6fe',
    glow: '0 0 0 3px rgba(167,139,250,0.30), 0 0 16px rgba(167,139,250,0.35)',
  },
};

// Quilez §14.1 — fallback déterministe pour les moods custom
function getMoodActiveColor(id: string): {
  border: string;
  bg: string;
  text: string;
  glow: string;
} {
  if (MOOD_COLORS[id]) return MOOD_COLORS[id];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return {
    border: `hsla(${hue},70%,70%,0.85)`,
    bg: `hsla(${hue},70%,70%,0.20)`,
    text: `hsl(${hue},90%,85%)`,
    glow: `0 0 0 3px hsla(${hue},70%,55%,0.30), 0 0 16px hsla(${hue},70%,55%,0.35)`,
  };
}

interface MoodPipSelectorProps {
  moods: string[];
  activeMood: string | undefined;
  onMoodChange: (mood: string | undefined) => void;
}

export function MoodPipSelector({ moods, activeMood, onMoodChange }: MoodPipSelectorProps) {
  if (moods.length === 0) return null;
  return (
    <div
      role="radiogroup"
      aria-label="Humeur du personnage"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
        gap: 6,
        overflow: 'visible',
      }}
    >
      {moods.map((mood) => {
        const label = getMoodLabel(mood);
        const shortLabel = label.length > 7 ? label.substring(0, 6) + '.' : label;
        const isActive = activeMood === mood;
        const mc = getMoodActiveColor(mood);
        return (
          <motion.button
            key={mood}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={label}
            onClick={() => onMoodChange(isActive ? undefined : mood)}
            animate={{ scale: isActive ? 1.1 : 1 }}
            whileHover={{ scale: isActive ? 1.15 : 1.07, y: -2 }}
            whileTap={{ scaleY: 0.93, scaleX: 1.05 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            style={{
              position: 'relative',
              borderRadius: 11,
              border: `2px solid ${isActive ? mc.border : 'rgba(255,255,255,0.16)'}`,
              background: isActive ? mc.bg : 'rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '5px 3px',
              cursor: 'pointer',
              boxShadow: isActive ? mc.glow : 'none',
            }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>{getMoodEmoji(mood)}</span>
            <span
              style={{
                fontSize: 8.5,
                fontWeight: 700,
                lineHeight: 1,
                color: isActive ? mc.text : 'rgba(255,255,255,0.50)',
                whiteSpace: 'nowrap',
              }}
            >
              {shortLabel}
            </span>
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: 'white',
                  fontWeight: 900,
                }}
              >
                ✓
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
