import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, GitBranch, Dices, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplexityLevel } from '../hooks/useDialogueWizardState';

interface StepComplexityProps {
  selectedLevel: ComplexityLevel | null;
  onSelect: (level: ComplexityLevel) => void;
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
  hoverStyles: string;
  buttonLabel: string;
  preview: string;
}

const COMPLEXITY_CARDS: ComplexityCard[] = [
  {
    id: 'linear',
    emoji: '📝',
    icon: FileText,
    title: 'Simples',
    ageLabel: '8+',
    description: 'Dialogue sans choix, texte uniquement',
    features: [
      'Pas de choix',
      'Histoire linéaire',
      'Simple et rapide'
    ],
    color: 'from-blue-500 to-cyan-600',
    gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-600/10',
    hoverStyles: 'border-blue-500 ring-4 ring-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.5)]',
    buttonLabel: 'Commencer - Mode Simple',
    preview: '💬 → 💬 → 💬'
  },
  {
    id: 'binary',
    emoji: '🔀',
    icon: GitBranch,
    title: 'À choisir',
    ageLabel: '9+',
    description: 'Dialogue avec 2 choix simples',
    features: [
      '2 choix possibles',
      'Décisions faciles',
      'Histoires qui bifurquent'
    ],
    color: 'from-green-500 to-emerald-600',
    gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-600/10',
    hoverStyles: 'border-green-500 ring-4 ring-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.5)]',
    buttonLabel: 'Mode Avec Choix',
    preview: '💬 → 1️⃣ ou 2️⃣'
  },
  {
    id: 'dice',
    emoji: '🎲',
    icon: Dices,
    title: 'Dés magiques',
    ageLabel: '10+',
    description: 'Tests de caractéristique avec succès/échec (1-2 tests)',
    features: [
      'Dés à 20 faces',
      '1 ou 2 tests',
      'Succès ou échec'
    ],
    color: 'from-purple-500 to-pink-600',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-600/10',
    hoverStyles: 'border-purple-500 ring-4 ring-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.5)]',
    buttonLabel: 'Lancer les dés !',
    preview: '🎲 → ✅ ou ❌'
  },
  {
    id: 'expert',
    emoji: '⚡',
    icon: Sparkles,
    title: 'Expert (multi-choix)',
    ageLabel: '12+',
    description: 'Choix multiples avec effets sur variables (2-4 choix)',
    features: [
      '2 à 4 choix',
      'Effets sur variables',
      'Logique avancée'
    ],
    color: 'from-orange-500 to-red-600',
    gradient: 'bg-gradient-to-br from-orange-500/20 to-red-600/10',
    hoverStyles: 'border-orange-500 ring-4 ring-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.5)]',
    buttonLabel: 'Mode Expert',
    preview: '🌳 → 1️⃣ 2️⃣ 3️⃣ 4️⃣'
  }
];

/**
 * StepComplexity - Choose dialogue complexity level (PHASE 2.3: 4 complexity cards)
 *
 * Four large gaming cards with animations:
 * - Simples (8+): No choices, linear story
 * - À choisir (9+): 2 simple binary choices
 * - Dés magiques (10+): Dice mechanics (1-2 tests)
 * - Expert (12+): Multi-choice with effects (2-4 choices)
 */
export function StepComplexity({
  selectedLevel,
  onSelect
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

      {/* Cards Grid (PHASE 2.3: 4 cards in 2x2 grid on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
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
                      ? card.hoverStyles
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

      {/* Help text */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>💡 Astuce : Tu peux toujours changer de niveau en revenant en arrière !</p>
      </div>
    </div>
  );
}

export default StepComplexity;
