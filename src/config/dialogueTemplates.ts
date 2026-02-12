/**
 * Situation Templates for Dialogue Wizard
 *
 * Pre-filled dialogue situations to help users create dialogues quickly.
 * Shown as an optional step for 'dice' and 'expert' complexity levels.
 *
 * Each template pre-fills: speaker, text, choices/effects.
 * Users can skip and start from scratch at any time.
 */

import type { ComplexityLevel } from '@/components/dialogue-editor/DialogueWizard/hooks/useDialogueWizardState';
import type { Effect } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateChoice {
  text: string;
  effects: Effect[];
  diceCheck?: { stat: string; difficulty: number };
}

export interface SituationTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  complexity: ComplexityLevel;
  prefill: {
    speaker?: string;
    text?: string;
    choices?: TemplateChoice[];
  };
}

// ============================================================================
// DICE TEMPLATES (stat: physique | mentale)
// ============================================================================

const DICE_TEMPLATES: SituationTemplate[] = [
  {
    id: 'dice-mental',
    label: 'Test Mental',
    icon: '🧠',
    description: 'Le joueur doit tenir le coup face à une situation stressante.',
    complexity: 'dice',
    prefill: {
      speaker: 'Narrateur',
      text: "La situation est tendue. Le bruit, la foule, les obstacles… Peux-tu garder ton calme ?",
      choices: [
        {
          text: "Je respire profondément et j'avance.",
          effects: [],
          diceCheck: { stat: 'mentale', difficulty: 12 },
        },
      ],
    },
  },
  {
    id: 'dice-physique',
    label: 'Effort Physique',
    icon: '💪',
    description: "Une action demandant un effort physique important.",
    complexity: 'dice',
    prefill: {
      speaker: 'Narrateur',
      text: "Le chemin est accidenté. Il faut franchir cet obstacle pour continuer. Ton corps est-il prêt ?",
      choices: [
        {
          text: "Je prends mon élan et je tente le passage.",
          effects: [],
          diceCheck: { stat: 'physique', difficulty: 14 },
        },
      ],
    },
  },
];

// ============================================================================
// EXPERT TEMPLATES (multi-choix avec effets)
// ============================================================================

const EXPERT_TEMPLATES: SituationTemplate[] = [
  {
    id: 'expert-negociation',
    label: 'Négociation',
    icon: '🤝',
    description: "3 approches face à un refus : diplomatie, autorité, contournement.",
    complexity: 'expert',
    prefill: {
      speaker: "Agent d'accueil",
      text: "Je suis désolé, l'accès n'est pas possible sans rendez-vous. Les règles sont les règles.",
      choices: [
        {
          text: "Expliquer calmement ma situation et demander une exception.",
          effects: [{ variable: 'mentale', value: 5, operation: 'add' }],
        },
        {
          text: "Insister fermement en invoquant mes droits.",
          effects: [{ variable: 'physique', value: -5, operation: 'add' }],
        },
        {
          text: "Demander à parler au responsable.",
          effects: [],
        },
      ],
    },
  },
  {
    id: 'expert-confrontation',
    label: 'Confrontation',
    icon: '⚡',
    description: "4 réactions possibles face à un conflit ou une remarque blessante.",
    complexity: 'expert',
    prefill: {
      speaker: 'Inconnu',
      text: "Tu n'as vraiment pas ta place ici. Ce n'est pas fait pour des gens comme toi.",
      choices: [
        {
          text: "Rester calme et répondre avec assurance.",
          effects: [{ variable: 'mentale', value: 10, operation: 'add' }],
        },
        {
          text: "Ignorer la remarque et continuer son chemin.",
          effects: [{ variable: 'mentale', value: -5, operation: 'add' }],
        },
        {
          text: "Demander de l'aide à quelqu'un à proximité.",
          effects: [],
        },
        {
          text: "Répondre avec colère.",
          effects: [
            { variable: 'mentale', value: -10, operation: 'add' },
            { variable: 'physique', value: -5, operation: 'add' },
          ],
        },
      ],
    },
  },
  {
    id: 'expert-dilemme',
    label: 'Dilemme Moral',
    icon: '⚖️',
    description: "Un choix difficile sans bonne réponse évidente, qui engage le joueur.",
    complexity: 'expert',
    prefill: {
      speaker: 'Ami',
      text: "J'ai besoin de toi pour ce déplacement — mais je sais que c'est compliqué pour toi aussi en ce moment…",
      choices: [
        {
          text: "Accepter d'aider malgré mes propres difficultés.",
          effects: [{ variable: 'physique', value: -10, operation: 'add' }],
        },
        {
          text: "Expliquer honnêtement mes limites du moment.",
          effects: [{ variable: 'mentale', value: 5, operation: 'add' }],
        },
        {
          text: "Proposer une alternative adaptée à mes capacités.",
          effects: [],
        },
      ],
    },
  },
  {
    id: 'expert-exploration',
    label: 'Exploration',
    icon: '🗺️',
    description: "Choix de chemin ou d'itinéraire dans l'environnement urbain.",
    complexity: 'expert',
    prefill: {
      speaker: 'Narrateur',
      text: "Tu arrives à une intersection. Le chemin habituel est barré. Plusieurs alternatives s'offrent à toi.",
      choices: [
        {
          text: "Prendre le passage accessible signalé sur la gauche.",
          effects: [{ variable: 'physique', value: 5, operation: 'add' }],
        },
        {
          text: "Tenter le chemin principal malgré les obstacles.",
          effects: [{ variable: 'physique', value: -10, operation: 'add' }],
        },
        {
          text: "Demander son chemin à un passant.",
          effects: [{ variable: 'mentale', value: 3, operation: 'add' }],
        },
      ],
    },
  },
];

// ============================================================================
// EXPORT
// ============================================================================

export const SITUATION_TEMPLATES: SituationTemplate[] = [
  ...DICE_TEMPLATES,
  ...EXPERT_TEMPLATES,
];

/**
 * Get templates filtered by complexity level.
 * Returns only templates matching the given level.
 */
export function getTemplatesForLevel(level: ComplexityLevel): SituationTemplate[] {
  return SITUATION_TEMPLATES.filter(t => t.complexity === level);
}
