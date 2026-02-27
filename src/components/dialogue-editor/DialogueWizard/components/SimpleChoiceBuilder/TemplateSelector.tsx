

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
    <div className="flex flex-wrap gap-1.5">
      {CHOICE_TEMPLATES.map((template, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onApply(template)}
          className="px-2.5 py-1.5 rounded-lg bg-card border border-border hover:border-primary/50
                     hover:bg-primary/5 transition-all text-xs font-medium flex items-center gap-1
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        >
          <span>{template.emoji}</span>
          <span className="text-muted-foreground">{template.a} / {template.b}</span>
        </button>
      ))}
    </div>
  );
}
