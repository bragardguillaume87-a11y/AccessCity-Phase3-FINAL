import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Options for configuring the typewriter effect
 */
interface UseTypewriterOptions {
  /**
   * Speed in milliseconds per character
   * @default 40
   * @range 30-80
   */
  speed?: number;

  /**
   * Show blinking cursor during animation
   * @default true
   */
  cursor?: boolean;

  /**
   * Callback when animation completes
   */
  onComplete?: () => void;

  /**
   * Enable natural pauses on punctuation (Ren'Py style)
   * - Period, exclamation, question mark: 400ms
   * - Comma, semicolon, colon: 150ms
   * - Newline: 250ms
   * @default true
   */
  contextAware?: boolean;
}

/**
 * Return type for useTypewriter hook
 */
interface UseTypewriterReturn {
  /**
   * The text to display (includes cursor if active)
   */
  displayText: string;

  /**
   * Whether the animation has completed
   */
  isComplete: boolean;

  /**
   * Skip the animation and show full text immediately
   */
  skip: () => void;

  /**
   * Reset the animation to the beginning
   */
  reset: () => void;

  /**
   * Whether user has reduced motion preference enabled
   */
  prefersReduced: boolean;
}

/**
 * Typewriter Animation Hook
 *
 * OPTIMIZED: RequestAnimationFrame for 60fps sync + prefers-reduced-motion support
 *
 * Features:
 * - Smooth character-by-character animation
 * - Context-aware pauses on punctuation
 * - Accessibility: respects prefers-reduced-motion
 * - Performance: uses RAF instead of intervals
 * - Skip function for impatient users
 *
 * @param text - Text to display progressively
 * @param options - Configuration options
 * @returns Typewriter state and control functions
 *
 * @example
 * const { displayText, skip } = useTypewriter(
 *   "Hello, world!",
 *   { speed: 50, contextAware: true }
 * );
 */
export function useTypewriter(
  text: string = '',
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const {
    speed = 40,
    cursor = true,
    onComplete,
    contextAware = true
  } = options;

  const [displayText, setDisplayText] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [showCursor, setShowCursor] = useState<boolean>(cursor);
  const [prefersReduced, setPrefersReduced] = useState<boolean>(false);

  const indexRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);

  // Detect prefers-reduced-motion (WCAG 2.2 accessibility)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Calculate pause duration based on character (Ren'Py style - Visual Novel standard)
  const getPauseForCharacter = useCallback((char: string): number => {
    if (!contextAware) return speed;

    switch (char) {
      case '.':
      case '!':
      case '?':
        return 400; // Long pause at end of sentence
      case ',':
      case ';':
      case ':':
        return 150; // Medium pause
      case '\n':
        return 250; // Line break pause
      default:
        return speed;
    }
  }, [speed, contextAware]);

  // Progressive animation with RAF (60fps sync)
  useEffect(() => {
    if (!text) {
      setDisplayText('');
      setIsComplete(true);
      return;
    }

    // If prefers-reduced-motion, show instantly (accessibility)
    if (prefersReduced) {
      setDisplayText(text);
      setIsComplete(true);
      setShowCursor(false);
      onComplete?.();
      return;
    }

    // Reset state
    indexRef.current = 0;
    setDisplayText('');
    setIsComplete(false);
    setShowCursor(cursor);
    lastTimeRef.current = null;
    accumulatedTimeRef.current = 0;

    const animate = (currentTime: number): void => {
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
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [text, speed, cursor, onComplete, prefersReduced, getPauseForCharacter]);

  // Skip animation (click or spacebar - gaming standard)
  const skip = useCallback((): void => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    setDisplayText(text);
    setIsComplete(true);
    setShowCursor(false);
    onComplete?.();
  }, [text, onComplete]);

  // Reset animation
  const reset = useCallback((): void => {
    indexRef.current = 0;
    setDisplayText('');
    setIsComplete(false);
    setShowCursor(cursor);
    lastTimeRef.current = null;
    accumulatedTimeRef.current = 0;
  }, [cursor]);

  // Blinking cursor (handled in CSS for better performance)
  const cursorText = showCursor && !isComplete && !prefersReduced ? '|' : '';

  return {
    displayText: displayText + cursorText,
    isComplete,
    skip,
    reset,
    prefersReduced
  };
}
