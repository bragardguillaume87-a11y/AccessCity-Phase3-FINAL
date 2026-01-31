import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { DialogueChoice, Scene } from '@/types';
import { TemplateSelector } from './TemplateSelector';
import { ChoiceCard, type CardConfig } from './ChoiceCard';
import { ChoicePreview } from './ChoicePreview';

interface SimpleChoiceBuilderProps {
  choices: [DialogueChoice, DialogueChoice];
  scenes: Scene[];
  currentSceneId: string;
  onUpdateChoice: (index: 0 | 1, updates: Partial<DialogueChoice>) => void;
  onValidChange: (isValid: boolean) => void;
}

const CARD_CONFIGS: CardConfig[] = [
  {
    index: 0,
    emoji: '👍',
    gradient: 'from-emerald-500 to-green-600',
    borderValid: 'border-emerald-400',
    ringValid: 'ring-emerald-400/30',
    bgLight: 'bg-emerald-500/10',
    label: 'Premier chemin',
    hint: 'Que peut faire le joueur ?',
    placeholder: 'Accepter, Aider, Explorer...',
  },
  {
    index: 1,
    emoji: '👎',
    gradient: 'from-rose-500 to-red-600',
    borderValid: 'border-rose-400',
    ringValid: 'ring-rose-400/30',
    bgLight: 'bg-rose-500/10',
    label: 'Deuxième chemin',
    hint: 'Ou bien que peut-il faire d\'autre ?',
    placeholder: 'Refuser, Ignorer, Fuir...',
  },
];

/**
 * SimpleChoiceBuilder - Kid-friendly binary choice creator (8+)
 *
 * Design principles (NN/g, Scratch, Duolingo):
 * - Visual progress bars instead of numeric counters
 * - Preset templates for quick start
 * - Large touch targets (48px+)
 * - Micro-celebrations per card
 * - Progressive disclosure for advanced options
 * - Live preview of choices as player would see them
 * - WCAG 2.2 AA compliant
 */
export function SimpleChoiceBuilder({
  choices,
  scenes,
  currentSceneId,
  onUpdateChoice,
  onValidChange
}: SimpleChoiceBuilderProps) {
  const currentScene = scenes.find(s => s.id === currentSceneId);
  const [showAdvanced, setShowAdvanced] = useState<[boolean, boolean]>([false, false]);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    choices.forEach((choice, idx) => {
      if (!choice.text || choice.text.trim().length < 5) {
        errors.push(`Le choix ${idx + 1} doit avoir au moins 5 lettres`);
      }
    });
    return { isValid: errors.length === 0, errors };
  }, [choices]);

  useEffect(() => {
    onValidChange(validation.isValid);
  }, [validation.isValid, onValidChange]);

  // How many choices are valid
  const validCount = choices.filter(c => c.text && c.text.trim().length >= 5).length;

  return (
    <div className="space-y-6 px-2">

      {/* Guide character speech bubble */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <span className="text-3xl">🎭</span>
        </div>
        <div className="flex-1 p-4 rounded-2xl bg-card border-2 border-border relative">
          {/* Speech bubble arrow */}
          <div className="absolute left-[-8px] top-5 w-4 h-4 bg-card border-l-2 border-b-2 border-border rotate-45" />
          <p className="text-base font-semibold text-foreground relative z-10">
            Ton personnage arrive à un carrefour !
          </p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">
            Écris deux chemins différents que le joueur pourra choisir.
          </p>
        </div>
      </div>

      {/* Mini progress: 0/2, 1/2, 2/2 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors duration-500",
              validCount === 0 ? "bg-muted-foreground/30" :
              validCount === 1 ? "bg-amber-400" : "bg-emerald-500"
            )}
            animate={{ width: `${(validCount / 2) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <span className="text-sm font-bold text-muted-foreground">
          {validCount}/2
        </span>
      </div>

      {/* Preset templates */}
      <TemplateSelector
        onApply={(template) => {
          onUpdateChoice(0, { text: template.a });
          onUpdateChoice(1, { text: template.b });
        }}
      />

      {/* Two choice cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {CARD_CONFIGS.map((config) => (
          <ChoiceCard
            key={config.index}
            config={config}
            choice={choices[config.index]}
            scenes={scenes}
            currentScene={currentScene}
            currentSceneId={currentSceneId}
            advancedOpen={showAdvanced[config.index]}
            onToggleAdvanced={() => {
              const newState: [boolean, boolean] = [...showAdvanced];
              newState[config.index] = !showAdvanced[config.index];
              setShowAdvanced(newState);
            }}
            onUpdateChoice={onUpdateChoice}
          />
        ))}
      </div>

      {/* Live preview + validation feedback */}
      <ChoicePreview choices={choices} isValid={validation.isValid} />
    </div>
  );
}

export default SimpleChoiceBuilder;
