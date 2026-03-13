import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ComplexityLevel } from '@/types';

interface TypePillSelectorProps {
  value: ComplexityLevel | null;
  onChange: (level: ComplexityLevel) => void;
}

const PILLS: { id: ComplexityLevel; emoji: string; label: string; bg: string }[] = [
  { id: 'linear',  emoji: '📖', label: 'Simple',     bg: 'bg-blue-500'   },
  { id: 'binary',  emoji: '🔀', label: 'À choisir',  bg: 'bg-green-500'  },
  { id: 'dice',    emoji: '🎲', label: 'Dés',         bg: 'bg-purple-500' },
  { id: 'expert',  emoji: '⚡', label: 'Expert',     bg: 'bg-orange-500' },
];

/**
 * TypePillSelector — 4 pills that slide via framer-motion layoutId animation.
 * Replaces StepComplexity (no longer a wizard step — it's always visible).
 */
export function TypePillSelector({ value, onChange }: TypePillSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Type de dialogue"
      className="flex items-center gap-2 px-6 py-4 border-b bg-muted/20 flex-shrink-0"
    >
      {PILLS.map((pill) => {
        const isSelected = value === pill.id;
        return (
          <button
            key={pill.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(pill.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold',
              'transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isSelected ? 'text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {/* Sliding background — the layoutId makes it glide between pills */}
            {isSelected && (
              <motion.span
                layoutId="type-pill-bg"
                className={cn('absolute inset-0 rounded-full', pill.bg)}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{pill.emoji}</span>
            <span className="relative z-10">{pill.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default TypePillSelector;
