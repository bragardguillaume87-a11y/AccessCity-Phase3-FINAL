import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Dices, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ComplexityLevel } from '../hooks/useDialogueWizardState';

interface StepComplexityProps {
  selectedLevel: ComplexityLevel | null;
  onSelect: (level: ComplexityLevel) => void;
  onContinue: () => void;
}

interface ComplexityCard {
  id: ComplexityLevel;
  emoji: string;
  icon: React.ElementType;
  title: string;
  ageLabel: string;
  description: string;
  features: string[];
  color: string;
  gradient: string;
  buttonLabel: string;
  preview: string;
}

const COMPLEXITY_CARDS: ComplexityCard[] = [
  {
    id: 'simple',
    emoji: '🎯',
    icon: Target,
    title: 'Simple',
    ageLabel: '8+',
    description: 'Choix Oui/Non - Parfait pour débuter',
    features: [
      '2 choix seulement',
      'Navigation simple',
      'Pas de calculs'
    ],
    color: 'from-blue-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10',
    buttonLabel: 'Commencer - Mode Simple',
    preview: '💬 → 👍 ou 👎'
  },
  {
    id: 'medium',
    emoji: '🎲',
    icon: Dices,
    title: 'Dés Magiques',
    ageLabel: '10+',
    description: 'Lancers de dés comme Baldur\'s Gate 3',
    features: [
      'Dés à 20 faces',
      'Tests de compétence',
      'Succès ou échec'
    ],
    color: 'from-purple-500 to-purple-600',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-purple-600/10',
    buttonLabel: 'Lancer les dés !',
    preview: '🎲 → ✅ ou ❌'
  },
  {
    id: 'complex',
    emoji: '⚙️',
    icon: Settings,
    title: 'Expert',
    ageLabel: '12+',
    description: 'Variables multiples et effets avancés',
    features: [
      'Jusqu\'à 4 choix',
      'Effets multiples',
      'Logique complexe'
    ],
    color: 'from-orange-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-orange-500/20 to-orange-600/10',
    buttonLabel: 'Mode Expert',
    preview: '🌳 → 1️⃣ 2️⃣ 3️⃣ 4️⃣'
  }
];

/**
 * StepComplexity - Choose dialogue complexity level
 *
 * Three large gaming cards with animations:
 * - Simple (8+): Binary choices
 * - Medium (10+): Dice mechanics
 * - Complex (12+): Multi-choice with effects
 */
export function StepComplexity({
  selectedLevel,
  onSelect,
  onContinue
}: StepComplexityProps) {
  const [hoveredCard, setHoveredCard] = useState<ComplexityLevel | null>(null);

  const handleCardClick = (level: ComplexityLevel) => {
    onSelect(level);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Choisis ton niveau de difficulté
        </h2>
        <p className="text-muted-foreground text-lg">
          Plus c'est complexe, plus tu as de possibilités ! 🎮
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {COMPLEXITY_CARDS.map((card) => {
          const isSelected = selectedLevel === card.id;
          const isHovered = hoveredCard === card.id;
          const Icon = card.icon;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: COMPLEXITY_CARDS.indexOf(card) * 0.1 }}
              onHoverStart={() => setHoveredCard(card.id)}
              onHoverEnd={() => setHoveredCard(null)}
            >
              <motion.button
                type="button"
                onClick={() => handleCardClick(card.id)}
                className={cn(
                  "relative w-full h-[450px] rounded-2xl border-4 transition-all duration-300",
                  "focus:outline-none focus:ring-4 focus:ring-primary focus:ring-offset-4",
                  "overflow-hidden group",
                  isSelected
                    ? "border-primary ring-4 ring-primary/30 shadow-2xl"
                    : isHovered
                      ? card.id === 'simple'
                        ? "border-blue-500 ring-4 ring-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                        : card.id === 'medium'
                          ? "border-purple-500 ring-4 ring-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                          : "border-orange-500 ring-4 ring-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                      : "border-border hover:border-primary/50 shadow-lg"
                )}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Background gradient */}
                <div className={cn("absolute inset-0", card.gradient)} />

                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg z-10"
                  >
                    <span className="text-2xl">✓</span>
                  </motion.div>
                )}

                {/* Age badge */}
                <div className={cn(
                  "absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold text-white shadow-md z-10",
                  `bg-gradient-to-r ${card.color}`
                )}>
                  {card.ageLabel}
                </div>

                {/* Card content */}
                <div className="relative h-full flex flex-col items-center justify-between p-6 pt-16">
                  {/* Icon */}
                  <div className="space-y-4 text-center flex-shrink-0">
                    <motion.div
                      animate={isHovered ? {
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{ duration: 0.6 }}
                      className={cn(
                        "w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg",
                        `bg-gradient-to-br ${card.color}`
                      )}
                    >
                      <span className="text-5xl">{card.emoji}</span>
                    </motion.div>

                    <h3 className="text-2xl font-bold text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground px-2">
                      {card.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 w-full flex-1 flex flex-col justify-center">
                    {card.features.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.1 }}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                          `bg-gradient-to-br ${card.color}`
                        )}>
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Preview */}
                  <div className="w-full py-3 px-4 rounded-xl bg-background/50 backdrop-blur-sm border-2 border-border">
                    <p className="text-center text-lg font-mono">
                      {card.preview}
                    </p>
                  </div>

                  {/* Button (only shown when selected) */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute bottom-6 left-6 right-6"
                    >
                      <div className={cn(
                        "px-6 py-3 rounded-xl text-white font-bold text-center shadow-lg",
                        `bg-gradient-to-r ${card.color}`
                      )}>
                        {card.buttonLabel}
                      </div>
                    </motion.div>
                  )}
                </div>

              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Continue button (shown when a level is selected) */}
      {selectedLevel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-4"
        >
          <Button
            onClick={onContinue}
            size="lg"
            variant="default"
            className="text-lg px-12 py-6 shadow-xl hover:shadow-2xl transition-all"
          >
            Continuer avec {COMPLEXITY_CARDS.find(c => c.id === selectedLevel)?.title} 🚀
          </Button>
        </motion.div>
      )}

      {/* Help text */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>💡 Astuce : Tu peux toujours changer de niveau en revenant en arrière !</p>
      </div>
    </div>
  );
}

export default StepComplexity;
