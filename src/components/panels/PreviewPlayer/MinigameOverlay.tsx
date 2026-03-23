/**
 * MinigameOverlay — Shell overlay pour les mini-jeux.
 * Architecture identique à DiceOverlay : fullscreen absolu, z-index 50.
 * Dispatche vers MinigameFalc | MinigameQte | MinigameBraille.
 *
 * Résultat : effet Balatro-style (gold flash → punch-scale → rayons radiaux → fermeture).
 */
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import type { MinigameConfig } from '@/types';
import { uiSounds } from '@/utils/uiSounds';
import { MinigameFalc } from './MinigameFalc';
import { MinigameQte } from './MinigameQte';
import { MinigameBraille } from './MinigameBraille';
import { Z_INDEX } from '@/utils/zIndexLayers';

export interface MinigameOverlayProps {
  isOpen: boolean;
  config: MinigameConfig | null;
  onResult: ((success: boolean) => void) | null;
}

const TYPE_LABELS: Record<string, { emoji: string; label: string }> = {
  falc: { emoji: '🗂️', label: 'Mise en ordre' },
  qte: { emoji: '⌨️', label: 'Séquence de touches' },
  braille: { emoji: '⠿', label: 'Identification Braille' },
};

// Rayons radiaux — 8 directions en degrés
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

type ResultPhase = 'idle' | 'flash' | 'reveal' | 'done';

export function MinigameOverlay({ isOpen, config, onResult }: MinigameOverlayProps) {
  const [resultPhase, setResultPhase] = useState<ResultPhase>('idle');
  const [lastSuccess, setLastSuccess] = useState<boolean>(false);
  const committedRef = useRef(false);

  const handleResult = useCallback(
    (success: boolean) => {
      if (committedRef.current) return;
      committedRef.current = true;
      setLastSuccess(success);

      if (success) {
        // Séquence Balatro : flash (80ms) → reveal + fanfare → rayons → fermeture
        setResultPhase('flash');
        setTimeout(() => {
          setResultPhase('reveal');
          uiSounds.overlayVictoryFanfare(); // ← fanfare héroïque synchro reveal
        }, 80);
        setTimeout(() => {
          setResultPhase('done');
          onResult?.(true);
        }, 1600);
      } else {
        // Échec : flash rouge court → mélodie mélancolique → fermeture
        setResultPhase('flash');
        setTimeout(() => {
          setResultPhase('reveal');
          uiSounds.overlayDefeatTheme(); // ← thème triste synchro reveal
        }, 80);
        setTimeout(() => {
          setResultPhase('done');
          onResult?.(false);
        }, 900);
      }
    },
    [onResult]
  );

  // Reset state quand l'overlay se ferme
  if (!isOpen || !config || !onResult) return null;

  const typeInfo = TYPE_LABELS[config.type] ?? { emoji: '🎮', label: 'Mini-jeu' };
  const isActive = resultPhase === 'idle';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="minigame-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={(def) => {
            // Remise à zéro après fermeture
            if (
              def === 'exit' ||
              (typeof def === 'object' && 'opacity' in def && def.opacity === 0)
            ) {
              setResultPhase('idle');
              committedRef.current = false;
            }
          }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: Z_INDEX.PREVIEW_OVERLAY,
            background: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 20px',
            gap: 20,
            overflow: 'hidden',
          }}
        >
          {/* ── Flash overlay (succès: or, échec: rouge) ── */}
          <AnimatePresence>
            {resultPhase === 'flash' && (
              <motion.div
                key="result-flash"
                initial={{ opacity: lastSuccess ? 0.85 : 0.7 }}
                animate={{ opacity: 0 }}
                transition={{ duration: lastSuccess ? 0.28 : 0.22 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: Z_INDEX.PREVIEW_OVERLAY + 10,
                  pointerEvents: 'none',
                  background: lastSuccess
                    ? 'radial-gradient(ellipse at center, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.7) 50%, transparent 80%)'
                    : 'radial-gradient(ellipse at center, rgba(239,68,68,0.88) 0%, rgba(220,38,38,0.6) 50%, transparent 80%)',
                }}
              />
            )}
          </AnimatePresence>

          {/* ── Rayons radiaux (succès uniquement) ── */}
          <AnimatePresence>
            {resultPhase === 'reveal' && lastSuccess && (
              <>
                {RAY_ANGLES.map((angle) => (
                  <motion.div
                    key={`ray-${angle}`}
                    initial={{ opacity: 0.9, scaleY: 0, originY: 1 }}
                    animate={{ opacity: 0, scaleY: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut', delay: 0.04 }}
                    style={{
                      position: 'absolute',
                      bottom: '50%',
                      left: '50%',
                      width: 3,
                      height: '55%',
                      background: 'linear-gradient(to top, rgba(251,191,36,0.95), transparent)',
                      transformOrigin: 'bottom center',
                      transform: `translateX(-50%) rotate(${angle}deg)`,
                      zIndex: 58,
                      pointerEvents: 'none',
                      borderRadius: 2,
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* ── Aberration chromatique CSS — injectée uniquement au moment du reveal ── */}
          {resultPhase === 'reveal' && (
            <style>{`
              @keyframes chromaSuccess {
                0%   { text-shadow: -5px 0 3px rgba(255,0,80,0.95), 5px 0 3px rgba(0,220,255,0.95), 0 0 50px rgba(251,191,36,1);   filter: brightness(2.8); }
                20%  { text-shadow: -3px 0 2px rgba(255,0,80,0.6),  3px 0 2px rgba(0,220,255,0.6),  0 0 40px rgba(251,191,36,0.9); filter: brightness(1.9); }
                55%  { text-shadow: -1px 0 1px rgba(255,0,80,0.2),  1px 0 1px rgba(0,220,255,0.2),  0 0 30px rgba(251,191,36,0.7); filter: brightness(1.3); }
                100% { text-shadow: 0 0 40px rgba(251,191,36,0.9), 0 4px 16px rgba(0,0,0,0.7);                                     filter: brightness(1);   }
              }
              @keyframes chromaFail {
                0%   { text-shadow: -4px 0 2px rgba(255,0,80,0.85), 4px 0 2px rgba(0,220,255,0.75), 0 0 35px rgba(239,68,68,0.95); filter: brightness(2.4); }
                35%  { text-shadow: -2px 0 1px rgba(255,0,80,0.4),  2px 0 1px rgba(0,220,255,0.35), 0 0 25px rgba(239,68,68,0.7);  filter: brightness(1.5); }
                100% { text-shadow: 0 0 30px rgba(239,68,68,0.8), 0 4px 12px rgba(0,0,0,0.7);                                      filter: brightness(1);   }
              }
            `}</style>
          )}

          {/* ── Texte résultat punch-scale ── */}
          <AnimatePresence>
            {resultPhase === 'reveal' && (
              <motion.div
                key="result-text"
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  lastSuccess
                    ? { scale: [0, 2.2, 0.85, 1.1, 1], opacity: 1, scaleX: [0, 1.4, 0.9, 1.05, 1] }
                    : { scale: [0, 1.6, 0.9, 1], opacity: 1 }
                }
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: lastSuccess ? 0.52 : 0.35, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  zIndex: 65,
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: lastSuccess ? 52 : 46,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    color: lastSuccess ? '#fbbf24' : '#f87171',
                    animation: lastSuccess
                      ? 'chromaSuccess 0.45s ease-out forwards'
                      : 'chromaFail 0.38s ease-out forwards',
                  }}
                >
                  {lastSuccess ? '✓ RÉUSSI' : '✗ RATÉ'}
                </span>
                {lastSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'rgba(251,191,36,0.75)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Bravo !
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Header ── */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: isActive ? 1 : 0.2 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            style={{ textAlign: 'center' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(20,184,166,0.25)',
                  border: '2px solid #14b8a6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Gamepad2 size={18} color="#14b8a6" />
              </div>
              <span
                style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}
              >
                {typeInfo.emoji} {typeInfo.label}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                fontSize: 12,
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              <span>Difficulté : {'⭐'.repeat(config.difficulty)}</span>
            </div>
          </motion.div>

          {/* ── Game content ── */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: isActive ? 1 : 0.15 }}
            transition={{ delay: 0.18, duration: 0.22 }}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            {config.type === 'falc' && <MinigameFalc config={config} onResult={handleResult} />}
            {config.type === 'qte' && <MinigameQte config={config} onResult={handleResult} />}
            {config.type === 'braille' && (
              <MinigameBraille config={config} onResult={handleResult} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MinigameOverlay;
