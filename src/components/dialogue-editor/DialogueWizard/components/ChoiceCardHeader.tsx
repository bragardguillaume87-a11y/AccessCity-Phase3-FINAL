/**
 * ChoiceCardHeader — Shared header for DiceChoiceCard and ComplexChoiceCard
 *
 * Eliminates the duplicated header pattern (icon badge + title + delete button).
 * The title animates smoothly when it changes (e.g. "Dés" → "Dés A").
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChoiceCardHeaderProps {
  /** Content inside the icon badge (emoji or Lucide icon) */
  icon: React.ReactNode;
  /** Gradient classes for the icon badge (e.g. "from-purple-500 to-pink-500") */
  iconGradient: string;
  /** Card title (e.g. "Dés", "Dés A", "Choix #2") */
  title: string;
  /** Whether the card can be removed */
  canRemove: boolean;
  /** Called when the delete button is clicked */
  onRemove: () => void;
  /** aria-label for the delete button */
  removeAriaLabel: string;
}

export function ChoiceCardHeader({
  icon,
  iconGradient,
  title,
  canRemove,
  onRemove,
  removeAriaLabel,
}: ChoiceCardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
          iconGradient
        )}>
          {icon}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h4
            key={title}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="text-sm font-semibold"
          >
            {title}
          </motion.h4>
        </AnimatePresence>
      </div>
      {canRemove && (
        <Button
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
          aria-label={removeAriaLabel}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
