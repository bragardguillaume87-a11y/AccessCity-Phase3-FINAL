/**
 * Animation variants for character entrance/exit animations (Framer Motion)
 *
 * Usage:
 * import { CHARACTER_ANIMATION_VARIANTS } from '@/constants/animations';
 *
 * <motion.div variants={CHARACTER_ANIMATION_VARIANTS.fadeIn} ... />
 */

export const CHARACTER_ANIMATION_VARIANTS = {
  // No animation
  none: {
    initial: { opacity: 1, scale: 1, x: 0, y: 0 },
    animate: { opacity: 1, scale: 1, x: 0, y: 0 },
    exit: { opacity: 1, scale: 1, x: 0, y: 0 }
  },
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  },
  // Slide animations
  slideInLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { x: -100, opacity: 0, transition: { duration: 0.3 } }
  },
  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { x: 100, opacity: 0, transition: { duration: 0.3 } }
  },
  slideInUp: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { y: 100, opacity: 0, transition: { duration: 0.3 } }
  },
  slideInDown: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { y: -100, opacity: 0, transition: { duration: 0.3 } }
  },
  // Pop animations
  pop: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.4, type: 'spring', bounce: 0.5 } },
    exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } }
  },
  // Bounce animation
  bounce: {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.6, type: 'spring', bounce: 0.6 } },
    exit: { y: 50, opacity: 0, transition: { duration: 0.3 } }
  }
};
