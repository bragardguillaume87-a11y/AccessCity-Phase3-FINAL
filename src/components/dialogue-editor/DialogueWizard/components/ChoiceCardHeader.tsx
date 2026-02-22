/**
 * ChoiceCardHeader — Shared header for DiceChoiceCard and ComplexChoiceCard
 *
 * Eliminates the duplicated header pattern (icon badge + title + delete button).
 */
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChoiceCardHeaderProps {
  /** Content inside the icon badge (emoji or Lucide icon) */
  icon: React.ReactNode;
  /** Gradient classes for the icon badge (e.g. "from-purple-500 to-pink-500") */
  iconGradient: string;
  /** Card title (e.g. "Test #1", "Choix #2") */
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
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br",
          iconGradient
        )}>
          {icon}
        </div>
        <h4 className="text-lg font-bold">{title}</h4>
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
