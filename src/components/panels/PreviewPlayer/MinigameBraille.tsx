/**
 * MinigameBraille — Identifier une lettre en Braille.
 * v3 : mode mot (pendu à 6 vies), intégration résultat dé, failurePenalty.
 * 6 points cliquables (grille 2×3), lookup table dans src/config/braillePatterns.ts.
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Heart } from 'lucide-react';
import { BRAILLE_PATTERNS, BRAILLE_LETTERS } from '@/config/braillePatterns';
import { uiSounds } from '@/utils/uiSounds';
import type { MinigameConfig } from '@/types';

// ── Constantes grille ────────────────────────────────────────────────────────
const POINT_POSITIONS = [
  { col: 0, row: 0 }, // p1
  { col: 0, row: 1 }, // p2
  { col: 0, row: 2 }, // p3
  { col: 1, row: 0 }, // p4
  { col: 1, row: 1 }, // p5
  { col: 1, row: 2 }, // p6
];
const DOT_SIZE = 44;
const GAP = 14;

type DotReveal = 'idle' | 'correct' | 'wrong';

// ── Mots de fallback selon difficulté (dé 1-20) ──────────────────────────────
const FALLBACK_WORDS: Record<'easy' | 'medium' | 'hard', string[]> = {
  easy: ['BAL', 'CAR', 'FEU', 'MER', 'SOL', 'VIE', 'AIR', 'ROI'],
  medium: ['ARBRE', 'ECLAT', 'GUIDE', 'LUMIE', 'MONDE', 'OCEAN', 'PARIS'],
  hard: ['BRAILLE', 'LIBERTÉ', 'COULEUR', 'SILENCE', 'HORIZON', 'PASSAGE'],
};

function pickWord(words: string[] | undefined, diceResult: number | undefined): string {
  const pool = words && words.length > 0 ? words : null;

  if (diceResult !== undefined) {
    // Dé 1-20 → facile/moyen/difficile
    const tier: 'easy' | 'medium' | 'hard' =
      diceResult <= 6 ? 'easy' : diceResult <= 13 ? 'medium' : 'hard';

    if (pool) {
      // Trier les mots auteur par longueur, sélectionner dans la tranche correspondante
      const sorted = [...pool].sort((a, b) => a.length - b.length);
      const third = Math.ceil(sorted.length / 3);
      const tierWords =
        tier === 'easy'
          ? sorted.slice(0, third)
          : tier === 'medium'
            ? sorted.slice(third, third * 2)
            : sorted.slice(third * 2);
      const chosen = tierWords.length > 0 ? tierWords : sorted;
      return chosen[Math.floor(Math.random() * chosen.length)].toUpperCase();
    }
    const fallback = FALLBACK_WORDS[tier];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  if (pool) return pool[Math.floor(Math.random() * pool.length)].toUpperCase();
  // Sans dé et sans mots auteur → lettre aléatoire (mode lettre classique)
  return BRAILLE_LETTERS[Math.floor(Math.random() * BRAILLE_LETTERS.length)] as string;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface MinigameBrailleProps {
  config?: MinigameConfig;
  onResult: (success: boolean) => void;
}

// ── Composant lettre unique ──────────────────────────────────────────────────
interface SingleLetterProps {
  targetLetter: string;
  targetPattern: [boolean, boolean, boolean, boolean, boolean, boolean];
  onLetterResult: (correct: boolean) => void;
  attemptKey: number; // incrémenté pour reset l'état quand on passe à la lettre suivante
}

function SingleLetterChallenge({
  targetLetter,
  targetPattern,
  onLetterResult,
  attemptKey,
}: SingleLetterProps) {
  const [userPattern, setUserPattern] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [revealState, setRevealState] = useState<DotReveal[]>(Array(6).fill('idle') as DotReveal[]);
  const [isValidating, setIsValidating] = useState(false);

  // ⚠️ BUG FIX : useMemo avec setState = violation React (effets de bord pendant le render).
  // Remplacé par useEffect — reset propre quand attemptKey change (nouvelle tentative).
  // Note : le composant remonte déjà via la key du parent, ce reset est une sécurité.
  useEffect(() => {
    setUserPattern([false, false, false, false, false, false]);
    setRevealState(Array(6).fill('idle') as DotReveal[]);
    setIsValidating(false);
  }, [attemptKey]);

  // Cleanup de tous les setTimeout à la destruction du composant (évite setState sur composant démonté)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  const togglePoint = useCallback(
    (idx: number) => {
      if (isValidating) return;
      uiSounds.minigameDot();
      setUserPattern((prev) => prev.map((v, i) => (i === idx ? !v : v)));
    },
    [isValidating]
  );

  const handleValidate = useCallback(() => {
    if (isValidating) return;
    setIsValidating(true);
    const results = userPattern.map(
      (v, i): DotReveal => (v === targetPattern[i] ? 'correct' : 'wrong')
    );
    const correct = results.every((r) => r === 'correct');
    results.forEach((result, i) => {
      const t = setTimeout(() => {
        setRevealState((prev) => prev.map((s, j) => (j === i ? result : s)));
      }, i * 80);
      timeoutsRef.current.push(t);
    });
    if (correct) uiSounds.minigameDing();
    else uiSounds.minigameFail();
    const t = setTimeout(() => onLetterResult(correct), 6 * 80 + 400);
    timeoutsRef.current.push(t);
  }, [isValidating, userPattern, targetPattern, onLetterResult]);

  return (
    <>
      {/* Référence lettre + grille */}
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
          padding: '14px 28px',
          background: 'rgba(30,20,60,0.85)',
          borderRadius: 18,
          border: '2px solid rgba(139,92,246,0.5)',
        }}
      >
        <motion.span
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.05 }}
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {targetLetter}
        </motion.span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: GAP / 2 + 2 }}>
          {[...Array(6)].map((_, i) => {
            const { col, row } = POINT_POSITIONS[i];
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 500, damping: 24 }}
                style={{
                  gridColumn: col + 1,
                  gridRow: row + 1,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: targetPattern[i] ? '#FFD700' : '#1e1e38',
                  border: `2px solid ${targetPattern[i] ? '#FFF5A0' : '#585878'}`,
                  boxShadow: targetPattern[i]
                    ? '0 0 12px rgba(255,215,0,0.75), 0 3px 8px rgba(0,0,0,0.5)'
                    : 'none',
                  transform: targetPattern[i] ? 'scale(1.12) translateY(-1px)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Input utilisateur */}
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 14 }}>
        Clique les points correspondants
      </p>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `${DOT_SIZE}px ${DOT_SIZE}px`,
          gridTemplateRows: `repeat(3, ${DOT_SIZE}px)`,
          gap: GAP,
          marginBottom: 24,
        }}
      >
        {[...Array(6)].map((_, i) => {
          const { col, row } = POINT_POSITIONS[i];
          const active = userPattern[i];
          const reveal = revealState[i];
          const dotBg =
            reveal === 'correct'
              ? '#16a34a'
              : reveal === 'wrong'
                ? '#dc2626'
                : active
                  ? '#7c3aed'
                  : '#1e1e38';
          const dotBorder =
            reveal === 'correct'
              ? '2.5px solid #4ade80'
              : reveal === 'wrong'
                ? '2.5px solid #f87171'
                : active
                  ? '2.5px solid #c4b5fd'
                  : '2.5px solid #585878';
          const dotShadow =
            reveal === 'correct'
              ? '0 0 16px rgba(34,197,94,0.80), 0 3px 8px rgba(0,0,0,0.4)'
              : reveal === 'wrong'
                ? '0 0 12px rgba(239,68,68,0.70)'
                : active
                  ? '0 0 16px rgba(167,139,250,0.80), 0 4px 10px rgba(0,0,0,0.5)'
                  : 'inset 0 2px 4px rgba(0,0,0,0.6)';
          const dotTransform = active && reveal === 'idle' ? 'scale(1.1) translateY(-2px)' : 'none';
          const revealAnimate =
            reveal === 'correct'
              ? { scale: [1, 1.35, 0.95, 1.12, 1] }
              : reveal === 'wrong'
                ? { scale: [1, 0.8, 1] }
                : {};

          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => togglePoint(i)}
              disabled={isValidating}
              whileTap={!isValidating ? { scale: 0.78 } : {}}
              animate={reveal !== 'idle' ? revealAnimate : {}}
              transition={
                reveal === 'correct'
                  ? { duration: 0.45, ease: 'easeOut', delay: i * 0.08 }
                  : reveal === 'wrong'
                    ? { duration: 0.3, ease: 'easeOut', delay: i * 0.08 }
                    : { type: 'spring', stiffness: 600, damping: 18 }
              }
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: '50%',
                background: dotBg,
                border: dotBorder,
                boxShadow: dotShadow,
                cursor: isValidating ? 'default' : 'pointer',
                padding: 0,
                transform: dotTransform,
                transition: 'background 0.15s, border 0.15s, box-shadow 0.15s, transform 0.15s',
              }}
              aria-label={`Point Braille ${i + 1} ${active ? 'actif' : 'inactif'}`}
              aria-pressed={active}
            />
          );
        })}
      </div>

      {/* Bouton valider — toujours visible, désactivé pendant validation (Norman §9.1) */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        onClick={handleValidate}
        disabled={isValidating}
        whileHover={!isValidating ? { scale: 1.02 } : {}}
        whileTap={!isValidating ? { scale: 0.97 } : {}}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: 'none',
          background: isValidating
            ? 'rgba(124,58,237,0.4)'
            : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          color: isValidating ? 'rgba(255,255,255,0.55)' : 'white',
          fontWeight: 800,
          fontSize: 16,
          cursor: isValidating ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: isValidating ? 'none' : '0 4px 20px rgba(139,92,246,0.5)',
          letterSpacing: '0.02em',
          transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
        }}
      >
        <CheckCircle size={18} />
        {isValidating ? 'Vérification…' : 'Valider'}
      </motion.button>
    </>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
export function MinigameBraille({ config, onResult }: MinigameBrailleProps) {
  const isWordMode = config?.brailleMode === 'word';
  const maxLives = config?.brailleLives ?? 6;
  const diceResult = config?.brailleDiceResult;

  // Mot choisi au montage (stable)
  const targetWord = useMemo<string>(
    () => pickWord(config?.brailleWords, diceResult),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const wordLetters = useMemo(() => [...targetWord], [targetWord]);

  // ── State mode lettre simple ─────────────────────────────────────────────
  const targetLetterSingle = useMemo(
    () => {
      if (isWordMode) return 'A';
      const pool =
        config?.brailleLetters && config.brailleLetters.length > 0
          ? config.brailleLetters
          : (BRAILLE_LETTERS as string[]);
      return pool[Math.floor(Math.random() * pool.length)];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── State mode mot ───────────────────────────────────────────────────────
  const [currentLetterIdx, setCurrentLetterIdx] = useState(0);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [livesLeft, setLivesLeft] = useState(maxLives);
  const [attemptKey, setAttemptKey] = useState(0);
  const [wordComplete, setWordComplete] = useState(false);
  const [wordFailed, setWordFailed] = useState(false);

  const currentLetter = isWordMode ? wordLetters[currentLetterIdx] : targetLetterSingle;
  const currentPattern = BRAILLE_PATTERNS[currentLetter] ?? BRAILLE_PATTERNS['A'];

  // Tracking des timers du composant parent — cleanup au démontage (§3 hallucination_patterns)
  const parentTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = parentTimersRef.current; // copie locale obligatoire (react-hooks/exhaustive-deps)
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const handleLetterResult = useCallback(
    (correct: boolean) => {
      if (!isWordMode) {
        onResult(correct);
        return;
      }

      if (correct) {
        uiSounds.minigameDing();
        const nextRevealed = [...revealedIndices, currentLetterIdx];
        setRevealedIndices(nextRevealed);

        if (nextRevealed.length === wordLetters.length) {
          // Mot complet !
          const t1 = setTimeout(() => {
            uiSounds.minigameSuccess();
            setWordComplete(true);
            const t2 = setTimeout(() => onResult(true), 1400);
            parentTimersRef.current.push(t2);
          }, 300);
          parentTimersRef.current.push(t1);
        } else {
          // Prochaine lettre
          const t3 = setTimeout(() => {
            setCurrentLetterIdx((i) => i + 1);
            setAttemptKey((k) => k + 1);
          }, 600);
          parentTimersRef.current.push(t3);
        }
      } else {
        const newLives = livesLeft - 1;
        setLivesLeft(newLives);
        if (newLives <= 0) {
          uiSounds.minigameFail();
          const t4 = setTimeout(() => {
            setWordFailed(true);
            const t5 = setTimeout(() => onResult(false), 1200);
            parentTimersRef.current.push(t5);
          }, 300);
          parentTimersRef.current.push(t4);
        } else {
          // Réessayer la même lettre
          const t6 = setTimeout(() => setAttemptKey((k) => k + 1), 600);
          parentTimersRef.current.push(t6);
        }
      }
    },
    [isWordMode, revealedIndices, currentLetterIdx, wordLetters.length, livesLeft, onResult]
  );

  // ── Mode lettre simple ───────────────────────────────────────────────────
  if (!isWordMode) {
    return (
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 12 }}>
          Reproduis ce caractère Braille
        </p>
        <SingleLetterChallenge
          targetLetter={targetLetterSingle}
          targetPattern={
            BRAILLE_PATTERNS[targetLetterSingle] as [
              boolean,
              boolean,
              boolean,
              boolean,
              boolean,
              boolean,
            ]
          }
          onLetterResult={handleLetterResult}
          attemptKey={0}
        />
      </div>
    );
  }

  // ── Mode mot (pendu) ─────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
      {/* Mot à deviner — affichage pendu */}
      <AnimatePresence>
        {!wordFailed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 16 }}
          >
            {/* Lettres révélées */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {wordLetters.map((letter, idx) => {
                const revealed = revealedIndices.includes(idx);
                const isCurrent = idx === currentLetterIdx && !wordComplete;
                return (
                  <motion.div
                    key={`letter-${idx}`}
                    animate={
                      revealed
                        ? { scale: [1, 1.25, 1], backgroundColor: 'rgba(139,92,246,0.3)' }
                        : {}
                    }
                    transition={{ duration: 0.35 }}
                    style={{
                      width: 36,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: `3px solid ${
                        revealed
                          ? '#a78bfa'
                          : isCurrent
                            ? 'rgba(245,158,11,0.9)'
                            : 'rgba(255,255,255,0.35)'
                      }`,
                      borderRadius: 4,
                      background: revealed ? 'rgba(139,92,246,0.15)' : 'transparent',
                    }}
                  >
                    {revealed || wordComplete ? (
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: wordComplete ? '#4ade80' : 'white',
                        }}
                      >
                        {letter}
                      </span>
                    ) : isCurrent ? (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                        style={{ fontSize: 14, color: 'rgba(245,158,11,0.9)' }}
                      >
                        ?
                      </motion.span>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>

            {/* Progression */}
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
              {revealedIndices.length}/{wordLetters.length} lettre
              {revealedIndices.length > 1 ? 's' : ''} trouvée{revealedIndices.length > 1 ? 's' : ''}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vies (cœurs) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
        {Array.from({ length: maxLives }).map((_, i) => {
          const alive = i < livesLeft;
          return (
            <motion.div
              key={i}
              animate={!alive ? { scale: [1, 1.4, 0.8, 1] } : {}}
              transition={{ duration: 0.35 }}
            >
              <Heart
                size={20}
                fill={alive ? '#ef4444' : 'transparent'}
                color={alive ? '#ef4444' : 'rgba(255,255,255,0.2)'}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Zone de jeu — mode="sync" (défaut) : entrée et sortie simultanées.
           mode="wait" bloquait en Tauri/WebView2 si l'animation de sortie ne se terminait pas. */}
      <AnimatePresence>
        {wordComplete ? (
          <motion.div
            key="word-complete"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{ padding: '24px 0', textAlign: 'center' }}
          >
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#4ade80', letterSpacing: '0.05em' }}>
              {targetWord}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
              Mot complet !
            </p>
          </motion.div>
        ) : wordFailed ? (
          <motion.div
            key="word-failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '20px 0' }}
          >
            <p style={{ fontSize: 16, color: '#f87171', fontWeight: 700 }}>
              Le mot était : <span style={{ color: 'white' }}>{targetWord}</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`letter-${currentLetterIdx}-${attemptKey}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 10 }}>
              Lettre {currentLetterIdx + 1} sur {wordLetters.length}
            </p>
            <SingleLetterChallenge
              targetLetter={currentLetter}
              targetPattern={
                currentPattern as [boolean, boolean, boolean, boolean, boolean, boolean]
              }
              onLetterResult={handleLetterResult}
              attemptKey={attemptKey}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MinigameBraille;
