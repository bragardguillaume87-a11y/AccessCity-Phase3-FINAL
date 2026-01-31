import React from 'react';

/**
 * Preset templates for quick binary choices
 */
export const CHOICE_TEMPLATES = [
  { a: 'Accepter', b: 'Refuser', emoji: '🤝' },
  { a: 'Aider', b: 'Ignorer', emoji: '💪' },
  { a: 'Aller à gauche', b: 'Aller à droite', emoji: '🧭' },
  { a: 'Continuer', b: 'Arrêter', emoji: '🚶' },
  { a: 'Oui', b: 'Non', emoji: '💬' },
];

export type ChoiceTemplate = typeof CHOICE_TEMPLATES[0];

interface TemplateSelectorProps {
  onApply: (template: ChoiceTemplate) => void;
}

/**
 * TemplateSelector - Preset template buttons for quick start
 */
export function TemplateSelector({ onApply }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground font-medium">
        Besoin d'inspiration ? Choisis un modèle :
      </p>
      <div className="flex flex-wrap gap-2">
        {CHOICE_TEMPLATES.map((template, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onApply(template)}
            className="px-3 py-2 rounded-xl bg-card border-2 border-border hover:border-primary/50
                       hover:bg-primary/5 transition-all text-sm font-medium flex items-center gap-1.5
                       focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                       min-h-[40px]"
          >
            <span>{template.emoji}</span>
            <span>{template.a} / {template.b}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
