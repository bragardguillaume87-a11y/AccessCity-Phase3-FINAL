/**
 * Animation variants for character entrance/exit animations (Framer Motion)
 *
 * Usage:
 * import { CHARACTER_ANIMATION_VARIANTS } from '@/constants/animations';
 *
 * <motion.div variants={CHARACTER_ANIMATION_VARIANTS.fadeIn} ... />
 */

import { TIMING } from '@/config/timing';

// Convert milliseconds to seconds for Framer Motion
const toSeconds = (ms: number): number => ms / 1000;

/**
 * Animation variant type for Framer Motion
 */
interface AnimationVariant {
  initial: {
    opacity?: number;
    scale?: number;
    x?: number;
    y?: number;
  };
  animate: {
    opacity?: number;
    scale?: number;
    x?: number;
    y?: number;
    transition?: {
      duration?: number;
      ease?: string;
      type?: string;
      bounce?: number;
    };
  };
  exit: {
    opacity?: number;
    scale?: number;
    x?: number;
    y?: number;
    transition?: {
      duration?: number;
    };
  };
}

/**
 * Available character animation variants
 */
export type CharacterAnimationVariantName =
  | 'none'
  | 'fadeIn'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideInUp'
  | 'slideInDown'
  | 'pop'
  | 'bounce';

export const CHARACTER_ANIMATION_VARIANTS: Record<CharacterAnimationVariantName, AnimationVariant> = {
  // No animation
  none: {
    initial: { opacity: 1, scale: 1, x: 0, y: 0 },
    animate: { opacity: 1, scale: 1, x: 0, y: 0 },
    exit: { opacity: 1, scale: 1, x: 0, y: 0 }
  },
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: toSeconds(TIMING.ANIMATION_SLOW) } },
    exit: { opacity: 0, transition: { duration: toSeconds(TIMING.ANIMATION_DELAY) } }
  },
  // Slide animations
  slideInLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: toSeconds(TIMING.ANIMATION_SLOW), ease: 'easeOut' } },
    exit: { x: -100, opacity: 0, transition: { duration: toSeconds(TIMING.ANIMATION_DELAY) } }
  },
  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: toSeconds(TIMING.ANIMATION_SLOW), ease: 'easeOut' } },
    exit: { x: 100, opacity: 0, transition: { duration: toSeconds(TIMING.ANIMATION_DELAY) } }
  },
  slideInUp: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: toSeconds(TIMING.ANIMATION_SLOW), ease: 'easeOut' } },
    exit: { y: 100, opacity: 0, transition: { duration: toSeconds(TIMING.ANIMATION_DELAY) } }
  },
  slideInDown: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: toSeconds(TIMING.ANIMATION_SLOW), ease: 'easeOut' } },
    exit: { y: -100, opacity: 0, transition: { duration: toSeconds(TIMING.ANIMATION_DELAY) } }
  },
  // Pop animations
  pop: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: toSeconds(TIMING.ANIMATION_MEDIUM), type: 'spring', bounce: 0.5 } },
    exit: { scale: 0, opacity: 0, transition: { duration: toSeconds(TIMING.ANIMATION_VERY_FAST) } }
  },
  // Bounce animation
  bounce: {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: toSeconds(TIMING.ANIMATION_BOUNCE), type: 'spring', bounce: 0.6 } },
    exit: { y: 50, opacity: 0, transition: { duration: toSeconds(TIMING.ANIMATION_DELAY) } }
  }
} as const;
