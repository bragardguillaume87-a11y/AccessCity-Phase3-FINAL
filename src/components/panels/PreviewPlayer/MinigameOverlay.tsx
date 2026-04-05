/**
 * MinigameOverlay — Shell overlay pour les mini-jeux.
 * Architecture identique à DiceOverlay : fullscreen absolu, z-index 50.
 * Dispatche vers MinigameFalc | MinigameQte | MinigameBraille.
 *
 * Résultat : effet Balatro-style (gold flash → punch-scale → rayons radiaux → fermeture).
 * Fond : voie lactée CSS box-shadow (3 couches blanc/violet/bleu) + 2 nébuleuses pulsantes.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, X } from 'lucide-react';
import type { MinigameConfig } from '@/types';
import { uiSounds } from '@/utils/uiSounds';
import { MinigameFalc } from './MinigameFalc';
import { MinigameQte } from './MinigameQte';
import { MinigameBraille } from './MinigameBraille';
import { Z_INDEX } from '@/utils/zIndexLayers';

// ── Génération de box-shadow étoilée — exécutée UNE fois au chargement du module ─────────
// Y-range = 1800px (2× hauteur overlay) → le drift translateY(-900px) boucle sans saut visible.
// seedOffset permet de générer des sub-couches à positions distinctes (twinkle désynchronisé).
function generateStars(count: number, spread: number, color: string, seedOffset = 0): string {
  let seed = count * 7919 + spread * 997 + color.length * 31 + seedOffset * 1_000_003;
  const rand = () => {
    seed = (seed * 16807) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  return Array.from({ length: count }, () => {
    const x = Math.floor(rand() * 1440);
    const y = Math.floor(rand() * 1800); // 2× height → seamless loop
    const extra = spread > 0 ? ` ${spread}px` : '';
    return `${x}px ${y}px 0${extra} ${color}`;
  }).join(', ');
}

// 3 sub-couches par couleur → twinkle désynchronisé (Nijman §8.1 — sent vivant)
const STARS_WHITE_A = generateStars(55, 0, '#ffffff', 0);
const STARS_WHITE_B = generateStars(55, 0, '#ffffff', 1);
const STARS_WHITE_C = generateStars(50, 0, '#ffffff', 2);
const STARS_VIOLET_A = generateStars(25, 0, '#c4b5fd', 3);
const STARS_VIOLET_B = generateStars(25, 0, '#c4b5fd', 4);
const STARS_VIOLET_C = generateStars(20, 0, '#c4b5fd', 5);
const STARS_BLUE = generateStars(35, 1, '#93c5fd', 6);

export interface MinigameOverlayProps {
  isOpen: boolean;
  config: MinigameConfig | null;
  onResult: ((success: boolean) => void) | null;
  /** Quitter le mini-jeu et revenir à la séquence précédente. */
  onQuit?: () => void;
}

const TYPE_LABELS: Record<string, { emoji: string; label: string }> = {
  falc: { emoji: '🗂️', label: 'Mise en ordre' },
  qte: { emoji: '⌨️', label: 'Séquence de touches' },
  braille: { emoji: '⠿', label: 'Identification Braille' },
};

// Rayons radiaux — 8 directions en degrés
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

type ResultPhase = 'idle' | 'flash' | 'reveal' | 'done';

export function MinigameOverlay({ isOpen, config, onResult, onQuit }: MinigameOverlayProps) {
  const [resultPhase, setResultPhase] = useState<ResultPhase>('idle');
  const [lastSuccess, setLastSuccess] = useState<boolean>(false);
  const committedRef = useRef(false);
  // Tracking des timers de séquence résultat — cleanup au démontage (§3 hallucination_patterns)
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ⚠️ BUG FIX : committedRef n'était jamais réinitialisé après fermeture de l'overlay
  // (onAnimationComplete exit ne se déclenche pas en Tauri car le composant retourne null directement).
  // → Reset à chaque nouvelle ouverture pour que le prochain mini-jeu soit jouable.
  useEffect(() => {
    if (isOpen) {
      setResultPhase('idle');
      committedRef.current = false;
    }
  }, [isOpen]);

  // Cleanup des timers au démontage — évite setState sur composant démonté
  useEffect(() => {
    return () => {
      timerRefs.current.forEach(clearTimeout);
    };
  }, []);

  const handleResult = useCallback(
    (success: boolean) => {
      if (committedRef.current) return;
      committedRef.current = true;
      setLastSuccess(success);
      // Annuler les timers précédents avant d'en créer de nouveaux
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];

      if (success) {
        // Séquence Balatro : flash (80ms) → reveal + fanfare → rayons → fermeture
        setResultPhase('flash');
        timerRefs.current.push(
          setTimeout(() => {
            setResultPhase('reveal');
            uiSounds.overlayVictoryFanfare(); // ← fanfare héroïque synchro reveal
          }, 80)
        );
        timerRefs.current.push(
          setTimeout(() => {
            setResultPhase('done');
            onResult?.(true);
          }, 1600)
        );
      } else {
        // Échec : flash rouge court → mélodie mélancolique → fermeture
        setResultPhase('flash');
        timerRefs.current.push(
          setTimeout(() => {
            setResultPhase('reveal');
            uiSounds.overlayDefeatTheme(); // ← thème triste synchro reveal
          }, 80)
        );
        timerRefs.current.push(
          setTimeout(() => {
            setResultPhase('done');
            onResult?.(false);
          }, 900)
        );
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
            background: '#030712',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 20px',
            gap: 20,
          }}
        >
          {/* ── Keyframes étoiles + parallaxe + nébuleuse + étoiles filantes ── */}
          <style>{`
            /* Twinkle — 2 variantes d'opacité pour varier l'intensité par sub-couche */
            @keyframes twinkle-hi {
              0%, 100% { opacity: 1; }
              50%       { opacity: 0.12; }
            }
            @keyframes twinkle-lo {
              0%, 100% { opacity: 0.65; }
              50%       { opacity: 0.04; }
            }
            /* Drift parallaxe — 3 vitesses, boucle seamless sur 900px */
            @keyframes drift-slow { to { transform: translateY(-900px); } }
            @keyframes drift-mid  { to { transform: translateY(-900px); } }
            @keyframes drift-fast { to { transform: translateY(-900px); } }
            /* Nébuleuse */
            @keyframes nebula-breathe {
              0%, 100% { opacity: 1;    transform: scale(1); }
              50%       { opacity: 0.52; transform: scale(1.08); }
            }
            /* Étoiles filantes — 3 trajectoires décalées */
            @keyframes shoot-1 {
              0%, 78%, 100% { opacity: 0; transform: translateX(-80px) translateY(-40px) rotate(22deg) scaleX(0.2); }
              82%            { opacity: 0.9; }
              94%            { opacity: 0; transform: translateX(700px) translateY(315px) rotate(22deg) scaleX(1); }
            }
            @keyframes shoot-2 {
              0%, 45%, 100% { opacity: 0; transform: translateX(-60px) translateY(-30px) rotate(16deg) scaleX(0.2); }
              49%            { opacity: 0.7; }
              61%            { opacity: 0; transform: translateX(800px) translateY(230px) rotate(16deg) scaleX(1); }
            }
            @keyframes shoot-3 {
              0%, 20%, 100% { opacity: 0; transform: translateX(-50px) translateY(-25px) rotate(28deg) scaleX(0.2); }
              24%            { opacity: 0.85; }
              34%            { opacity: 0; transform: translateX(550px) translateY(280px) rotate(28deg) scaleX(1); }
            }
          `}</style>

          {/* ── Fond étoilé — 7 sub-couches parallaxe (Quilez §14.2 + Nijman §8.1) ──
               3 vitesses de drift × 3 couleurs → profondeur perçue sans JS.
               Chaque sub-couche a un twinkle déphasé → "sent vivant".
               z-index 1 : sous le contenu du jeu (header/game à z-index 3)           */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
          >
            {/* Blanches lentes — hi contrast, drift lent */}
            <div
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                background: 'transparent',
                boxShadow: STARS_WHITE_A,
                animation: 'drift-slow 95s linear infinite, twinkle-hi 4.2s ease-in-out infinite',
              }}
            />
            {/* Blanches moyennes — lo contrast, drift mid */}
            <div
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                background: 'transparent',
                boxShadow: STARS_WHITE_B,
                animation:
                  'drift-mid 65s linear infinite, twinkle-lo 5.8s ease-in-out infinite 1.4s',
              }}
            />
            {/* Blanches rapides — hi contrast, drift rapide */}
            <div
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                background: 'transparent',
                boxShadow: STARS_WHITE_C,
                animation:
                  'drift-fast 40s linear infinite, twinkle-hi 3.5s ease-in-out infinite 2.7s',
              }}
            />
            {/* Violettes lentes */}
            <div
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                background: 'transparent',
                boxShadow: STARS_VIOLET_A,
                animation:
                  'drift-slow 95s linear infinite, twinkle-lo 7s ease-in-out infinite 0.8s',
              }}
            />
            {/* Violettes moyennes */}
            <div
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                background: 'transparent',
                boxShadow: STARS_VIOLET_B,
                animation:
                  'drift-mid 65s linear infinite, twinkle-hi 6.2s ease-in-out infinite 3.1s',
              }}
            />
            {/* Violettes rapides */}
            <div
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                background: 'transparent',
                boxShadow: STARS_VIOLET_C,
                animation:
                  'drift-fast 40s linear infinite, twinkle-lo 8s ease-in-out infinite 1.9s',
              }}
            />
            {/* Bleues — légèrement plus grandes, vitesse mid */}
            <div
              style={{
                position: 'absolute',
                width: 2,
                height: 2,
                background: 'transparent',
                boxShadow: STARS_BLUE,
                borderRadius: '50%',
                animation: 'drift-mid 65s linear infinite, twinkle-hi 9s ease-in-out infinite 4.5s',
              }}
            />

            {/* Étoiles filantes — 3 trajectoires décalées dans le temps */}
            <div
              style={{
                position: 'absolute',
                top: '18%',
                left: '10%',
                width: 160,
                height: 1.5,
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,0.88), transparent)',
                borderRadius: 1,
                animation: 'shoot-1 14s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '35%',
                left: '5%',
                width: 120,
                height: 1,
                background:
                  'linear-gradient(to right, transparent, rgba(196,181,253,0.75), transparent)',
                borderRadius: 1,
                animation: 'shoot-2 19s ease-in-out infinite 5s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '12%',
                left: '20%',
                width: 90,
                height: 1,
                background:
                  'linear-gradient(to right, transparent, rgba(147,197,253,0.70), transparent)',
                borderRadius: 1,
                animation: 'shoot-3 23s ease-in-out infinite 11s',
              }}
            />
          </div>

          {/* ── Vignette — bords sombres, centre ouvert (Will Wright §4.4) ─── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 30%, rgba(3,7,18,0.72) 100%)',
            }}
          />

          {/* ── Nébuleuse — 2 blobs violet/bleu qui respirent ───────────────
               z-index 2 : au-dessus des étoiles, sous le contenu             */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse 65% 55% at 15% 25%, rgba(139,92,246,0.22) 0%, transparent 70%)',
                animation: 'nebula-breathe 9s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse 55% 65% at 82% 72%, rgba(59,130,246,0.18) 0%, transparent 70%)',
                animation: 'nebula-breathe 12s ease-in-out infinite reverse',
              }}
            />
          </div>

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

          {/* ── Bouton quitter (croix rouge) ── */}
          {onQuit && resultPhase === 'idle' && (
            <button
              type="button"
              onClick={onQuit}
              aria-label="Quitter le mini-jeu"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 70,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid #ef4444',
                background: 'rgba(239,68,68,0.25)',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                boxShadow: '0 0 14px rgba(239,68,68,0.5)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.5)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.25)';
              }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          )}

          {/* ── Header ── */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: isActive ? 1 : 0.2 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            style={{ textAlign: 'center', position: 'relative', zIndex: 3 }}
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
              position: 'relative',
              zIndex: 3,
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
