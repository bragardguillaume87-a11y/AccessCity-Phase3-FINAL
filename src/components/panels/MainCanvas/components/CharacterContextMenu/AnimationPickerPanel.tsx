import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { t } from '@/lib/translations';
import { CHARACTER_ANIMATION_VARIANTS } from '@/constants/animations';

interface AnimationPickerPanelProps {
  characterName: string;
  currentAnimation: string;
  onSelect: (animation: string) => void;
  onBack: () => void;
}

const ANIMATIONS = [
  { id: 'none',        emoji: '⏹️', key: 'animationPicker.none'        as const },
  { id: 'fadeIn',      emoji: '✨', key: 'animationPicker.fadeIn'      as const },
  { id: 'slideInLeft', emoji: '👈', key: 'animationPicker.slideInLeft' as const },
  { id: 'slideInRight',emoji: '👉', key: 'animationPicker.slideInRight'as const },
  { id: 'slideInUp',   emoji: '👆', key: 'animationPicker.slideInUp'   as const },
  { id: 'slideInDown', emoji: '👇', key: 'animationPicker.slideInDown' as const },
  { id: 'pop',         emoji: '💥', key: 'animationPicker.pop'         as const },
  { id: 'bounce',      emoji: '🏀', key: 'animationPicker.bounce'      as const },
];

/** Emoji animé au survol — preview de l'animation d'entrée. */
function AnimatedEmoji({
  emoji,
  animationId,
  isHovered,
}: {
  emoji: string;
  animationId: string;
  isHovered: boolean;
}) {
  const variant = CHARACTER_ANIMATION_VARIANTS[animationId as keyof typeof CHARACTER_ANIMATION_VARIANTS]
    ?? CHARACTER_ANIMATION_VARIANTS.none;

  if (!isHovered || animationId === 'none') {
    return <span className="text-base leading-none">{emoji}</span>;
  }

  return (
    <motion.span
      className="text-base leading-none"
      initial={{ opacity: variant.initial.opacity, scale: variant.initial.scale, x: variant.initial.x, y: variant.initial.y }}
      animate={{ opacity: variant.animate.opacity, scale: variant.animate.scale, x: variant.animate.x, y: variant.animate.y }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'loop', repeatDelay: 0.4, ease: 'easeOut' }}
    >
      {emoji}
    </motion.span>
  );
}

/**
 * AnimationPickerPanel — Sélecteur d'animation d'entrée compact.
 *
 * Liste verticale avec preview hover sur chaque emoji.
 */
export function AnimationPickerPanel({
  characterName,
  currentAnimation,
  onSelect,
  onBack,
}: AnimationPickerPanelProps) {
  const [hoveredAnim, setHoveredAnim] = useState<string | null>(null);

  return (
    <div>
      {/* Retour */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 mb-2 text-xs font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.45)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {t('animationPicker.title', { name: characterName })}
      </button>

      {/* Liste */}
      <div className="space-y-0.5 overflow-y-auto" style={{ maxHeight: '280px' }}>
        {ANIMATIONS.map((anim, idx) => {
          const isActive = currentAnimation === anim.id;
          return (
            <motion.div
              key={anim.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.12 }}
            >
              <button
                type="button"
                onClick={() => onSelect(anim.id)}
                onMouseEnter={e => { setHoveredAnim(anim.id); if (!isActive) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={e => { setHoveredAnim(null);   if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                onFocus={()  => setHoveredAnim(anim.id)}
                onBlur={()   => setHoveredAnim(null)}
                className="w-full flex items-center gap-2.5 rounded-lg text-left transition-colors"
                style={{
                  padding: '6px 8px',
                  background: isActive ? 'var(--color-primary-muted, rgba(124,58,237,0.12))' : 'transparent',
                }}
              >
                {/* Icône animée */}
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: 'var(--color-bg-hover)' }}
                >
                  <AnimatedEmoji
                    emoji={anim.emoji}
                    animationId={anim.id}
                    isHovered={hoveredAnim === anim.id}
                  />
                </div>

                {/* Nom */}
                <span
                  className="flex-1 text-xs font-medium leading-tight truncate"
                  style={{ color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.9)' }}
                >
                  {t(anim.key)}
                </span>

                {/* Checkmark */}
                {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0 text-primary" />}
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Survole un item pour prévisualiser
      </p>
    </div>
  );
}

export default AnimationPickerPanel;
