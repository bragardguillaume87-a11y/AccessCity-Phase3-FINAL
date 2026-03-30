import { motion, AnimatePresence } from 'framer-motion';
import type { ComplexityLevel } from '@/types';

interface TypePillSelectorProps {
  value: ComplexityLevel | null;
  onChange: (level: ComplexityLevel) => void;
}

const PILLS: { id: ComplexityLevel; emoji: string; label: string; bg: string; desc: string }[] = [
  {
    id: 'linear',
    emoji: '📖',
    label: 'Simple',
    bg: 'bg-blue-500',
    desc: 'Un seul message, pas de choix',
  },
  {
    id: 'binary',
    emoji: '🔀',
    label: 'À choisir',
    bg: 'bg-green-500',
    desc: 'Deux chemins possibles',
  },
  {
    id: 'dice',
    emoji: '🎲',
    label: 'Dés',
    bg: 'bg-purple-500',
    desc: 'Résultat aléatoire selon stats',
  },
  {
    id: 'expert',
    emoji: '⚡',
    label: 'Expert',
    bg: 'bg-orange-500',
    desc: 'Conditions et effets avancés',
  },
  {
    id: 'minigame',
    emoji: '🎮',
    label: 'Mini-jeu',
    bg: 'bg-teal-500',
    desc: 'FALC · QTE · Braille',
  },
];

// ── Couleurs hex pour le glow des cartes ─────────────────────────────────────
const PILL_GLOW: Record<ComplexityLevel, string> = {
  linear: 'rgba(59,130,246,0.55)',
  binary: 'rgba(34,197,94,0.55)',
  dice: 'rgba(168,85,247,0.55)',
  expert: 'rgba(249,115,22,0.55)',
  minigame: 'rgba(20,184,166,0.55)',
};
const PILL_BORDER: Record<ComplexityLevel, string> = {
  linear: 'rgba(59,130,246,0.5)',
  binary: 'rgba(34,197,94,0.5)',
  dice: 'rgba(168,85,247,0.5)',
  expert: 'rgba(249,115,22,0.5)',
  minigame: 'rgba(20,184,166,0.5)',
};

// ── Couleurs par type pour les onglets actifs (card-tabs mode) ────────────────
const PILL_ACTIVE: Record<
  ComplexityLevel,
  { border: string; bg: string; text: string; badge: string; desc: string }
> = {
  linear: {
    border: 'rgba(59,130,246,0.45)',
    bg: 'rgba(59,130,246,0.18)',
    text: '#93c5fd',
    badge: '#3b82f6',
    desc: 'rgba(147,197,253,0.80)',
  },
  binary: {
    border: 'rgba(34,197,94,0.45)',
    bg: 'rgba(34,197,94,0.18)',
    text: '#86efac',
    badge: '#22c55e',
    desc: 'rgba(134,239,172,0.80)',
  },
  dice: {
    border: 'rgba(168,85,247,0.45)',
    bg: 'rgba(168,85,247,0.18)',
    text: '#c4b5fd',
    badge: '#a855f7',
    desc: 'rgba(196,181,253,0.80)',
  },
  expert: {
    border: 'rgba(249,115,22,0.45)',
    bg: 'rgba(249,115,22,0.18)',
    text: '#fdba74',
    badge: '#f97316',
    desc: 'rgba(253,186,116,0.80)',
  },
  minigame: {
    border: 'rgba(20,184,166,0.45)',
    bg: 'rgba(20,184,166,0.18)',
    text: '#5eead4',
    badge: '#14b8a6',
    desc: 'rgba(94,234,212,0.80)',
  },
};

/**
 * TypePillSelector — deux modes :
 * - value === null : grille de 5 grandes cartes (sélection initiale)
 * - value !== null : bande de mini-pills (navigation rapide)
 */
export function TypePillSelector({ value, onChange }: TypePillSelectorProps) {
  // ── Mode grandes cartes (première ouverture) ──────────────────────────────
  if (value === null) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          padding: '28px 24px 24px',
          background: 'rgba(0,0,0,0.6)',
        }}
        role="radiogroup"
        aria-label="Type de dialogue"
      >
        {PILLS.map((pill, idx) => (
          <motion.button
            key={pill.id}
            type="button"
            role="radio"
            aria-checked={false}
            initial={{ opacity: 0, y: 18, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22, delay: idx * 0.055 }}
            whileHover={{
              y: -5,
              scale: 1.04,
              boxShadow: `0 12px 32px ${PILL_GLOW[pill.id]}`,
              borderColor: PILL_BORDER[pill.id],
              transition: { duration: 0.15 },
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(pill.id)}
            style={{
              aspectRatio: '1 / 1.08',
              borderRadius: 14,
              border: '2px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              cursor: 'pointer',
              padding: '12px 8px',
              outline: 'none',
              color: 'white',
            }}
          >
            <span style={{ fontSize: 34, lineHeight: 1 }}>{pill.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em' }}>
              {pill.label}
            </span>
            <span
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.42)',
                textAlign: 'center',
                lineHeight: 1.35,
                padding: '0 4px',
              }}
            >
              {pill.desc}
            </span>
          </motion.button>
        ))}
      </div>
    );
  }

  // ── Mode card-tabs (après sélection) — style mockup .mcard ────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      role="radiogroup"
      aria-label="Type de dialogue"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        padding: '16px 16px 12px',
        flexShrink: 0,
        background: 'rgba(0,0,0,0.18)',
        overflow: 'visible',
      }}
    >
      {PILLS.map((pill) => {
        const isSelected = value === pill.id;
        return (
          <motion.button
            key={pill.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(pill.id)}
            animate={{ y: isSelected ? -4 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              padding: '11px 6px 10px',
              borderRadius: 14,
              border: `1.5px solid ${isSelected ? PILL_ACTIVE[pill.id].border : 'transparent'}`,
              background: isSelected ? PILL_ACTIVE[pill.id].bg : 'rgba(255,255,255,0.06)',
              cursor: 'pointer',
              color: isSelected ? PILL_ACTIVE[pill.id].text : 'rgba(255,255,255,0.55)',
              outline: 'none',
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
          >
            {/* Badge "actif" — position absolute top:-10px (mockup .active-pip) */}
            <AnimatePresence>
              {isSelected && (
                <motion.span
                  key="actif"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: PILL_ACTIVE[pill.id].badge,
                    fontSize: 9,
                    fontWeight: 900,
                    padding: '2px 9px',
                    borderRadius: 6,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  actif
                </motion.span>
              )}
            </AnimatePresence>

            <span style={{ fontSize: 22, lineHeight: 1 }}>{pill.emoji}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              {pill.label}
            </span>

            {/* Description — uniquement pour l'onglet actif (mockup .mcard-desc) */}
            {isSelected && (
              <span
                style={{
                  fontSize: 9,
                  color: PILL_ACTIVE[pill.id].desc,
                  textAlign: 'center',
                  lineHeight: 1.3,
                  maxWidth: 72,
                  display: 'block',
                }}
              >
                {pill.desc}
              </span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export default TypePillSelector;
