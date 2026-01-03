import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour animation typewriter (machine à écrire)
 * OPTIMISÉ: RequestAnimationFrame pour sync 60fps + support prefers-reduced-motion
 *
 * @param {string} text - Texte à afficher progressivement
 * @param {Object} options - Configuration
 * @param {number} options.speed - Vitesse en ms/caractère (défaut: 40, range: 30-80)
 * @param {boolean} options.cursor - Afficher curseur clignotant (défaut: true)
 * @param {Function} options.onComplete - Callback quand animation terminée
 * @param {boolean} options.contextAware - Pauses sur ponctuation (., !, ? = 400ms, , ; = 150ms)
 * @returns {Object} { displayText, isComplete, skip, reset, prefersReduced }
 */
export function useTypewriter(text = '', options = {}) {
  const {
    speed = 40,
    cursor = true,
    onComplete,
    contextAware = true // Pauses naturelles sur ponctuation (Ren'Py style)
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(cursor);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const indexRef = useRef(0);
  const rafIdRef = useRef(null);
  const lastTimeRef = useRef(null); // Changed to null for first-frame detection
  const accumulatedTimeRef = useRef(0); // Time accumulator for smoother timing

  // Détection prefers-reduced-motion (WCAG 2.2)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (e) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Calculer pause selon caractère (Ren'Py style - Visual Novel standard)
  const getPauseForCharacter = useCallback((char) => {
    if (!contextAware) return speed;

    switch (char) {
      case '.':
      case '!':
      case '?':
        return 400; // Pause longue fin de phrase
      case ',':
      case ';':
      case ':':
        return 150; // Pause moyenne
      case '\n':
        return 250; // Retour ligne
      default:
        return speed;
    }
  }, [speed, contextAware]);

  // Animation progressive avec RAF (60fps sync)
  useEffect(() => {
    if (!text) {
      setDisplayText('');
      setIsComplete(true);
      return;
    }

    // Si prefers-reduced-motion, afficher instantanément (accessibilité)
    if (prefersReduced) {
      setDisplayText(text);
      setIsComplete(true);
      setShowCursor(false);
      onComplete?.();
      return;
    }

    // Reset
    indexRef.current = 0;
    setDisplayText('');
    setIsComplete(false);
    setShowCursor(cursor);
    lastTimeRef.current = null; // Reset to null for first-frame detection
    accumulatedTimeRef.current = 0;

    const animate = (currentTime) => {
      // Skip first frame to establish timing baseline (MDN pattern)
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
        rafIdRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate delta time since last frame
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Accumulate time
      accumulatedTimeRef.current += deltaTime;

      // Get the speed for the CURRENT character we're about to display
      const nextChar = text[indexRef.current];
      const charSpeed = nextChar ? getPauseForCharacter(nextChar) : speed;

      // Check if enough time has passed to display next character
      if (accumulatedTimeRef.current >= charSpeed) {
        accumulatedTimeRef.current = 0; // Reset accumulator

        if (indexRef.current < text.length) {
          indexRef.current++;
          setDisplayText(text.substring(0, indexRef.current));
        } else {
          // Animation complete
          setIsComplete(true);
          setShowCursor(false);
          onComplete?.();
          return;
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [text, speed, cursor, onComplete, prefersReduced, getPauseForCharacter]);

  // Skip animation (click ou spacebar - gaming standard)
  const skip = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    setDisplayText(text);
    setIsComplete(true);
    setShowCursor(false);
    onComplete?.();
  }, [text, onComplete]);

  // Reset animation
  const reset = useCallback(() => {
    indexRef.current = 0;
    setDisplayText('');
    setIsComplete(false);
    setShowCursor(cursor);
    lastTimeRef.current = null;
    accumulatedTimeRef.current = 0;
  }, [cursor]);

  // Curseur clignotant (géré en CSS pour meilleure performance)
  const cursorText = showCursor && !isComplete && !prefersReduced ? '|' : '';

  return {
    displayText: displayText + cursorText,
    isComplete,
    skip,
    reset,
    prefersReduced
  };
}
