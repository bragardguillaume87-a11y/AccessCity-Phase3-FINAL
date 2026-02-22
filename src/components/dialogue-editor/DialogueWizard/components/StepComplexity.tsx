import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, GitBranch, Dices, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplexityLevel } from '../hooks/useDialogueWizardState';

interface StepComplexityProps {
  selectedLevel: ComplexityLevel | null;
  onSelect: (level: ComplexityLevel) => void;
}

interface ComplexityCard {
  id: ComplexityLevel;
  icon: React.ElementType;
  title: string;
  ageLabel: string;
  description: string;
  features: string[];
  color: string;
  gradient: string;
  hoverBorder: string;
}

const COMPLEXITY_CARDS: ComplexityCard[] = [
  {
    id: 'linear',
    icon: FileText,
    title: 'Simples',
    ageLabel: '8+',
    description: 'Texte uniquement, sans choix',
    features: ['Pas de choix', 'Histoire linéaire', 'Simple et rapide'],
    color: 'from-blue-500 to-cyan-600',
    gradient: 'from-blue-500/15 to-cyan-600/5',
    hoverBorder: 'border-blue-500 ring-2 ring-blue-500/30',
  },
  {
    id: 'binary',
    icon: GitBranch,
    title: 'À choisir',
    ageLabel: '9+',
    description: '2 choix simples',
    features: ['2 choix possibles', 'Décisions faciles', 'Histoires qui bifurquent'],
    color: 'from-green-500 to-emerald-600',
    gradient: 'from-green-500/15 to-emerald-600/5',
    hoverBorder: 'border-green-500 ring-2 ring-green-500/30',
  },
  {
    id: 'dice',
    icon: Dices,
    title: 'Dés magiques',
    ageLabel: '10+',
    description: 'Tests de caractéristique',
    features: ['Dés à 20 faces', '1 ou 2 tests', 'Succès ou échec'],
    color: 'from-purple-500 to-pink-600',
    gradient: 'from-purple-500/15 to-pink-600/5',
    hoverBorder: 'border-purple-500 ring-2 ring-purple-500/30',
  },
  {
    id: 'expert',
    icon: Sparkles,
    title: 'Expert',
    ageLabel: '12+',
    description: 'Multi-choix avec effets',
    features: ['2 à 4 choix', 'Effets sur variables', 'Logique avancée'],
    color: 'from-orange-500 to-red-600',
    gradient: 'from-orange-500/15 to-red-600/5',
    hoverBorder: 'border-orange-500 ring-2 ring-orange-500/30',
  }
];

/**
 * StepComplexity - Choose dialogue complexity level
 *
 * Compact horizontal card layout optimized for 1080p viewports.
 * Cards display side-by-side with icon, title, description, and features.
 */
export function StepComplexity({
  selectedLevel,
  onSelect
}: StepComplexityProps) {
  const [hoveredCard, setHoveredCard] = useState<ComplexityLevel | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto py-4 space-y-4">
      {/* Header - compact */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Choisis ton niveau de difficulté
        </h2>
        <p className="text-muted-foreground text-sm">
          Plus c'est complexe, plus tu as de possibilités !
        </p>
      </div>

      {/* Cards Grid - 2x2 compact */}
      <div className="grid grid-cols-2 gap-3 px-2">
        {COMPLEXITY_CARDS.map((card, cardIndex) => {
          const isSelected = selectedLevel === card.id;
          const isHovered = hoveredCard === card.id;
          const Icon = card.icon;

          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              onHoverStart={() => setHoveredCard(card.id)}
              onHoverEnd={() => setHoveredCard(null)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: cardIndex * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "bg-gradient-to-br",
                card.gradient,
                isSelected
                  ? "border-primary ring-2 ring-primary/30 shadow-lg"
                  : isHovered
                    ? card.hoverBorder
                    : "border-border hover:border-primary/40"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md",
                `bg-gradient-to-br ${card.color}`
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Title row */}
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold text-white",
                    `bg-gradient-to-r ${card.color}`
                  )}>
                    {card.ageLabel}
                  </span>
                  <h3 className="text-base font-bold text-foreground truncate">
                    {card.title}
                  </h3>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 ml-auto"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground">{card.description}</p>

                {/* Features - horizontal pills */}
                <div className="flex flex-wrap gap-1.5">
                  {card.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs text-foreground/80 bg-background/60 px-2 py-0.5 rounded-full border border-border/50"
                    >
                      <span className={cn(
                        "w-3 h-3 rounded-full flex items-center justify-center shrink-0",
                        `bg-gradient-to-br ${card.color}`
                      )}>
                        <Check className="w-2 h-2 text-white" />
                      </span>
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Help text - compact */}
      <p className="text-center text-xs text-muted-foreground">
        Tu peux toujours changer de niveau en revenant en arrière
      </p>
    </div>
  );
}

export default StepComplexity;
