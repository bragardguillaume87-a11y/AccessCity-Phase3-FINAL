import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTemplatesForLevel, type SituationTemplate } from '@/config/dialogueTemplates';
import type { ComplexityLevel } from '../hooks/useDialogueWizardState';

interface StepTemplateProps {
  complexityLevel: ComplexityLevel | null;
  onSelect: (template: SituationTemplate | null) => void;
}

/**
 * StepTemplate - Optional template selection step for dice/expert dialogues
 *
 * Shows a grid of pre-filled situation templates filtered by complexity level.
 * User can select a template to pre-fill the form, or skip to start from scratch.
 */
export function StepTemplate({ complexityLevel, onSelect }: StepTemplateProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const templates = complexityLevel ? getTemplatesForLevel(complexityLevel) : [];

  const handleCardClick = (template: SituationTemplate) => {
    setSelectedId(template.id);
  };

  const handleUseTemplate = () => {
    const template = templates.find(t => t.id === selectedId);
    if (template) onSelect(template);
  };

  const handleSkip = () => {
    onSelect(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Choisis une situation de départ
        </h2>
        <p className="text-muted-foreground text-sm">
          Sélectionne un modèle pour pré-remplir ton dialogue — ou commence depuis zéro.
        </p>
      </div>

      {/* Templates grid */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
          {templates.map((template, idx) => {
            const isSelected = selectedId === template.id;

            return (
              <motion.button
                key={template.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.08 }}
                onClick={() => handleCardClick(template)}
                className={cn(
                  'text-left w-full rounded-xl border-2 p-3 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'hover:border-primary/60 hover:shadow-md',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 shadow-md bg-primary/5'
                    : 'border-border bg-card'
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0 mt-0.5">{template.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground">{template.label}</h3>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-primary text-base font-bold"
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {template.description}
                    </p>

                    {/* Preview text snippet */}
                    {template.prefill.text && (
                      <p className="text-xs text-foreground/60 italic mt-1.5 truncate">
                        « {template.prefill.text} »
                      </p>
                    )}

                    {/* Choices count */}
                    {template.prefill.choices && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          {template.prefill.choices.length} choix
                          {template.prefill.choices[0]?.diceCheck && ' · Jet de dé'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <p>Aucun modèle disponible pour ce niveau.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center px-2 pt-1">
        {selectedId && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            type="button"
            onClick={handleUseTemplate}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-bold text-white',
              'bg-gradient-to-r from-primary to-pink-500',
              'hover:shadow-md hover:scale-105 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
          >
            Utiliser ce modèle →
          </motion.button>
        )}

        <button
          type="button"
          onClick={handleSkip}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            'border border-border bg-background',
            'hover:border-primary/50 hover:bg-primary/5 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'text-muted-foreground'
          )}
        >
          Commencer sans modèle
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-2">
        💡 Le modèle pré-remplie le texte et les choix — tu peux tout modifier ensuite.
      </p>
    </div>
  );
}

export default StepTemplate;
