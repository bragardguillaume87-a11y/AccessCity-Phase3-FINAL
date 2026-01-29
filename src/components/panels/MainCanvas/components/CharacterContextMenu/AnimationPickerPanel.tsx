import React, { useState } from 'react';
import { ChevronLeft, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';
import { CHARACTER_ANIMATION_VARIANTS } from '@/constants/animations';

interface AnimationPickerPanelProps {
  characterName: string;
  currentAnimation: string;
  onSelect: (animation: string) => void;
  onBack: () => void;
}

// Animation options with visual representations
const ANIMATIONS = [
  { id: 'none', emoji: '⏹️', key: 'animationPicker.none' as const },
  { id: 'fadeIn', emoji: '✨', key: 'animationPicker.fadeIn' as const },
  { id: 'slideInLeft', emoji: '👈', key: 'animationPicker.slideInLeft' as const },
  { id: 'slideInRight', emoji: '👉', key: 'animationPicker.slideInRight' as const },
  { id: 'slideInUp', emoji: '👆', key: 'animationPicker.slideInUp' as const },
  { id: 'slideInDown', emoji: '👇', key: 'animationPicker.slideInDown' as const },
  { id: 'pop', emoji: '💥', key: 'animationPicker.pop' as const },
  { id: 'bounce', emoji: '🏀', key: 'animationPicker.bounce' as const }
];

/**
 * AnimatedEmoji - Shows emoji with looping animation preview on hover
 */
function AnimatedEmoji({
  emoji,
  animationId,
  isHovered
}: {
  emoji: string;
  animationId: string;
  isHovered: boolean;
}) {
  // Get animation variant, default to 'none' if not found
  const variant = CHARACTER_ANIMATION_VARIANTS[animationId as keyof typeof CHARACTER_ANIMATION_VARIANTS]
    || CHARACTER_ANIMATION_VARIANTS.none;

  if (!isHovered || animationId === 'none') {
    // Static emoji when not hovered or animation is 'none'
    return (
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <span className="text-xl">{emoji}</span>
      </div>
    );
  }

  // Extract animation properties without transition
  const initialProps = {
    opacity: variant.initial.opacity,
    scale: variant.initial.scale,
    x: variant.initial.x,
    y: variant.initial.y
  };

  const animateProps = {
    opacity: variant.animate.opacity,
    scale: variant.animate.scale,
    x: variant.animate.x,
    y: variant.animate.y
  };

  // Animated emoji with looping animation
  return (
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
      <motion.span
        className="text-xl"
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: 'loop',
          repeatDelay: 0.3,
          ease: 'easeOut'
        }}
      >
        {emoji}
      </motion.span>
    </div>
  );
}

/**
 * AnimationPickerPanel - Visual animation selector
 *
 * Shows all entrance animations with emojis and descriptions.
 * Large touch targets for kids.
 */
export function AnimationPickerPanel({
  characterName,
  currentAnimation,
  onSelect,
  onBack
}: AnimationPickerPanelProps) {
  const [hoveredAnimation, setHoveredAnimation] = useState<string | null>(null);

  return (
    <div className="animate-step-slide">
      {/* Header with back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t('animationPicker.title', { name: characterName })}</span>
      </button>

      {/* Current animation indicator */}
      <div className="mb-3 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">{t('animationPicker.current')} :</span>
        <span className="font-medium">
          {t(ANIMATIONS.find(a => a.id === currentAnimation)?.key || 'animationPicker.none')}
        </span>
      </div>

      {/* Animation grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
        {ANIMATIONS.map(anim => (
          <button
            key={anim.id}
            type="button"
            onClick={() => onSelect(anim.id)}
            onMouseEnter={() => setHoveredAnimation(anim.id)}
            onMouseLeave={() => setHoveredAnimation(null)}
            onFocus={() => setHoveredAnimation(anim.id)}
            onBlur={() => setHoveredAnimation(null)}
            className={cn(
              "relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              "border-2",
              currentAnimation === anim.id
                ? "bg-primary/20 border-primary text-foreground"
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            {/* Emoji with animation preview */}
            <AnimatedEmoji
              emoji={anim.emoji}
              animationId={anim.id}
              isHovered={hoveredAnimation === anim.id}
            />

            {/* Label */}
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-sm truncate">{t(anim.key)}</div>
            </div>

            {/* Check if selected */}
            {currentAnimation === anim.id && (
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Help text */}
      <p className="mt-3 text-xs text-muted-foreground text-center">
        L'animation joue quand la scène commence
      </p>
    </div>
  );
}

export default AnimationPickerPanel;
