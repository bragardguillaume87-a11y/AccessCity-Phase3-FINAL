/**
 * DialogueSmsCard — Vue "bulle SMS/WhatsApp" d'un dialogue.
 *
 * Conseillers :
 *   Nijman §8.1-8.2 — entry slide spring, hover lift, squash/release
 *   Will Wright §4.1 — speaker identifiable immédiatement (nom, couleur, côté)
 *   Norman §9.1 — affordance : bulle + queue + numéro lisible hors fond coloré
 *   Quilez §14.1 — couleur déterministe depuis hash du speaker id
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2 } from 'lucide-react';
import type { Dialogue } from '@/types';

// ── Palette SMS — droite (vivid) et gauche (foncé/teinté) ───────────────────
const PALETTE_RIGHT = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1', // indigo
  '#f97316', // orange
] as const;

const PALETTE_LEFT = [
  '#2d3748', // slate neutre
  '#1e2d45', // slate-bleu
  '#2d1f45', // slate-violet
  '#1a3028', // slate-vert
  '#3a2810', // slate-amber
  '#3a1428', // slate-rose
  '#1e2445', // slate-indigo
  '#3a2410', // slate-orange
] as const;

// ── Couleur déterministe depuis hash d'ID (Quilez §14.1) ────────────────────
function hashIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getSmsColors(speakerId: string, side: 'left' | 'right') {
  const idx = hashIndex(speakerId) % PALETTE_RIGHT.length;
  if (side === 'right') {
    return { bg: PALETTE_RIGHT[idx], text: '#ffffff', border: 'rgba(255,255,255,0.12)' };
  }
  return {
    bg: PALETTE_LEFT[idx],
    text: 'rgba(238,240,248,0.92)',
    border: 'rgba(255,255,255,0.10)',
  };
}

// ── Props ────────────────────────────────────────────────────────────────────
export interface DialogueSmsCardProps {
  dialogue: Dialogue;
  index: number;
  sceneId: string;
  speakerName: string;
  side: 'left' | 'right';
  showSpeakerLabel: boolean;
  isSelected?: boolean;
  onDialogueSelect?: (sceneId: string, index: number) => void;
  onEditWithWizard?: (index: number) => void;
}

// ── Composant ────────────────────────────────────────────────────────────────
export function DialogueSmsCard({
  dialogue,
  index,
  sceneId,
  speakerName,
  side,
  showSpeakerLabel,
  isSelected = false,
  onDialogueSelect,
  onEditWithWizard,
}: DialogueSmsCardProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const colors = getSmsColors(dialogue.speaker || 'narrator', side);

  const isRight = side === 'right';

  // Rayon asymétrique → coin sans queue = 4px (identifie clairement la queue)
  const bubbleRadius = isRight ? '18px 18px 4px 18px' : '18px 18px 18px 4px';

  // Couleur active (sélectionnée)
  const activeBg = isRight ? 'rgba(109,40,217,0.92)' : 'rgba(109,40,217,0.45)';
  const bubbleBg = isSelected ? activeBg : colors.bg;
  const tailColor = bubbleBg;

  // Badge type de dialogue
  const typeLabel = dialogue.choices?.some((c) => c.diceCheck)
    ? '🎲'
    : dialogue.choices && dialogue.choices.length > 0
      ? `⟁ ${dialogue.choices.length}`
      : null;

  // Ombres en 3 couches : proche (netteté) + ambiante (profondeur) + couleur (identité)
  // + inset highlight (verre) — Quilez §14.2
  const shadowIdle = `
    0 1px 2px rgba(0,0,0,0.45),
    0 4px 10px rgba(0,0,0,0.28),
    0 10px 28px rgba(0,0,0,0.16),
    inset 0 1px 0 rgba(255,255,255,0.16),
    inset 0 -1px 0 rgba(0,0,0,0.12)
  `;
  const shadowHover = `
    0 2px 4px rgba(0,0,0,0.5),
    0 8px 20px rgba(0,0,0,0.32),
    0 16px 40px ${colors.bg}44,
    inset 0 1px 0 rgba(255,255,255,0.22),
    inset 0 -1px 0 rgba(0,0,0,0.15)
  `;
  const shadowSelected = `0 4px 16px rgba(109,40,217,0.45), inset 0 1px 0 rgba(255,255,255,0.18)`;

  return (
    // Nijman §8.2 — entrée depuis le bon côté, stagger limité à 0.5s max
    <motion.div
      initial={{ opacity: 0, x: isRight ? 32 : -32, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 360,
        damping: 28,
        delay: Math.min(index * 0.035, 0.45),
      }}
      style={{
        display: 'flex',
        flexDirection: isRight ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingLeft: isRight ? 48 : 8,
        paddingRight: isRight ? 8 : 48,
        // Espace supplémentaire entre groupes de speaker
        marginBottom: showSpeakerLabel ? 4 : 2,
        paddingBottom: 16, // espace pour le numéro hors-bulle
      }}
      role="button"
      tabIndex={0}
      aria-label={`Dialogue ${index + 1} — ${speakerName}`}
      onClick={() => onDialogueSelect?.(sceneId, index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onDialogueSelect?.(sceneId, index);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {/* ── Colonne : speaker label + bulle + numéro ────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isRight ? 'flex-end' : 'flex-start',
          maxWidth: '76%',
          position: 'relative',
        }}
      >
        {/* Nom du speaker — affiché uniquement lors du changement */}
        {showSpeakerLabel && (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: colors.bg,
              marginBottom: 5,
              paddingLeft: isRight ? 0 : 6,
              paddingRight: isRight ? 6 : 0,
              letterSpacing: '0.015em',
              filter: 'brightness(1.25) saturate(1.1)',
            }}
          >
            {speakerName}
          </span>
        )}

        {/* ── Bulle + queue ────────────────────────────────────────────── */}
        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
          {/* Bulle principale */}
          <div
            style={{
              backgroundColor: bubbleBg,
              // Gradient interne pour le relief (glass highlight top-gauche)
              backgroundImage:
                'linear-gradient(148deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.06) 100%)',
              color: colors.text,
              borderRadius: bubbleRadius,
              border: `1px solid ${isSelected ? 'rgba(139,92,246,0.65)' : colors.border}`,
              padding: '10px 14px 8px',
              boxShadow: isSelected ? shadowSelected : hovered ? shadowHover : shadowIdle,
              // Nijman §8.1 — lift au hover, squash au press
              transform: pressed
                ? 'scale(0.98) translateY(0)'
                : hovered
                  ? 'translateY(-2px)'
                  : 'translateY(0)',
              transition: pressed
                ? 'transform 0.06s ease, box-shadow 0.06s ease'
                : 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {/* Texte du dialogue */}
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.5,
                wordBreak: 'break-word',
                fontWeight: 420,
                letterSpacing: '0.008em',
              }}
            >
              {dialogue.text ? (
                dialogue.text
              ) : (
                <em style={{ opacity: 0.45, fontSize: 13 }}>(vide)</em>
              )}
            </p>

            {/* Footer : type badge + bouton édition
                Toujours rendu (taille bulle constante) — bouton animé en opacité/scale */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isRight ? 'flex-end' : 'flex-start',
                gap: 5,
                marginTop: 6,
                minHeight: 22,
              }}
            >
              {typeLabel && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: 'rgba(0,0,0,0.28)',
                    borderRadius: 4,
                    padding: '1px 6px',
                    color: 'rgba(255,255,255,0.82)',
                    letterSpacing: '0.03em',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {typeLabel}
                </span>
              )}

              {/* Nijman §8.1 — apparition spring, jamais de jump layout */}
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditWithWizard?.(index);
                }}
                aria-label="Modifier avec l'assistant"
                initial={false}
                animate={{
                  opacity: hovered ? 1 : 0,
                  scale: hovered ? 1 : 0.65,
                  y: hovered ? 0 : 4,
                }}
                transition={{
                  opacity: { duration: 0.16, ease: 'easeOut' },
                  scale: { type: 'spring', stiffness: 420, damping: 22 },
                  y: { duration: 0.16, ease: 'easeOut' },
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.22)',
                  background: 'rgba(0,0,0,0.32)',
                  color: 'rgba(255,255,255,0.88)',
                  cursor: 'pointer',
                  padding: 0,
                  pointerEvents: hovered ? 'auto' : 'none',
                }}
              >
                <Wand2 size={12} />
              </motion.button>
            </div>
          </div>

          {/* Queue / triangle CSS (sans pseudo-éléments) */}
          <div
            style={{
              position: 'absolute',
              bottom: 3,
              ...(isRight ? { right: -5 } : { left: -5 }),
              width: 0,
              height: 0,
              borderStyle: 'solid',
              ...(isRight
                ? {
                    borderWidth: '7px 0 0 8px',
                    borderColor: `transparent transparent transparent ${tailColor}`,
                  }
                : {
                    borderWidth: '7px 8px 0 0',
                    borderColor: `transparent ${tailColor} transparent transparent`,
                  }),
              // Micro-ombre sur la queue pour cohérence
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            }}
          />
        </div>

        {/* ── Numéro hors-bulle — Norman §9.1 : lisible sans concurrencer le texte */}
        <div
          style={{
            marginTop: 5,
            paddingLeft: isRight ? 0 : 6,
            paddingRight: isRight ? 6 : 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'var(--font-family-mono)',
              letterSpacing: '0.06em',
              color: 'rgba(238,240,248,0.40)',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 4,
              padding: '1px 5px',
              userSelect: 'none',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
