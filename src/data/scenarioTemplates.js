/**
 * Scenario Templates - Structures pré-configurées pour accélérer la création
 * Inspiré de StoryFlow Editor (53 node types) et Articy Draft MDK
 */

export const SCENARIO_TEMPLATES = [
  {
    id: 'simple-choice',
    name: 'Choix simple A/B',
    description: 'Un dialogue avec 2 choix basiques sans conditions',
    icon: '🔀',
    category: 'Basic',
    tags: ['dialogue', 'choix', 'simple'],
    structure: {
      dialogues: [
        {
          speaker: 'narrator',
          text: '[Décrivez la situation et présentez les deux options au joueur]',
          choices: [
            {
              text: 'Option A - [Décrivez l\'action positive/courageuse]',
              nextScene: '',
              diceCheck: null
            },
            {
              text: 'Option B - [Décrivez l\'action prudente/alternative]',
              nextScene: '',
              diceCheck: null
            }
          ]
        }
      ]
    }
  },
  {
    id: 'skill-check',
    name: 'Test de compétence',
    description: 'Choix avec lancer de dés (difficulté 12) et deux issues possibles',
    icon: '🎲',
    category: 'Gameplay',
    tags: ['dés', 'compétence', 'test'],
    structure: {
      dialogues: [
        {
          speaker: 'narrator',
          text: '[Décrivez le défi qui nécessite une action risquée]',
          choices: [
            {
              text: 'Tenter l\'action (Test de compétence)',
              nextScene: '',
              diceCheck: {
                enabled: true,
                stat: 'Physique',
                difficulty: 12,
                onSuccess: {
                  narratorText: '[Décrivez le succès héroïque du joueur]',
                  nextScene: '',
                  variableChanges: {
                    Mentale: 10
                  }
                },
                onFailure: {
                  narratorText: '[Décrivez l\'échec et ses conséquences]',
                  nextScene: '',
                  variableChanges: {
                    Physique: -10
                  }
                }
              }
            },
            {
              text: 'Éviter le risque',
              nextScene: '',
              diceCheck: null
            }
          ]
        }
      ]
    }
  },
  {
    id: 'npc-conversation',
    name: 'Conversation PNJ',
    description: 'Séquence de 3 dialogues avec un personnage non-joueur',
    icon: '💬',
    category: 'Narrative',
    tags: ['dialogue', 'pnj', 'conversation'],
    structure: {
      dialogues: [
        {
          speaker: '[ID_PERSONNAGE]',
          text: '[Salutation du PNJ - Bonjour, comment puis-je vous aider ?]',
          choices: [
            {
              text: 'Continuer la conversation',
              nextScene: '',
              diceCheck: null
            }
          ]
        },
        {
          speaker: '[ID_PERSONNAGE]',
          text: '[Réponse du PNJ avec informations utiles ou questions]',
          choices: [
            {
              text: 'Poser une question',
              nextScene: '',
              diceCheck: null
            },
            {
              text: 'Remercier et partir',
              nextScene: '',
              diceCheck: null
            }
          ]
        },
        {
          speaker: '[ID_PERSONNAGE]',
          text: '[Conclusion du PNJ - Au revoir et bonne continuation !]',
          choices: [
            {
              text: 'Partir',
              nextScene: '',
              diceCheck: null
            }
          ]
        }
      ]
    }
  },
  {
    id: 'moral-choice',
    name: 'Dilemme moral',
    description: 'Choix difficile avec impacts variables opposés',
    icon: '⚖️',
    category: 'Narrative',
    tags: ['dilemme', 'choix', 'conséquences'],
    structure: {
      dialogues: [
        {
          speaker: 'narrator',
          text: '[Présentez un dilemme moral complexe : aider quelqu\'un vs priorité personnelle]',
          choices: [
            {
              text: 'Agir avec compassion (+ Mentale, - Physique)',
              nextScene: '',
              diceCheck: {
                enabled: false,
                onSuccess: {
                  variableChanges: {
                    Mentale: 15,
                    Physique: -5
                  }
                }
              }
            },
            {
              text: 'Prioriser sa mission (+ Physique, - Mentale)',
              nextScene: '',
              diceCheck: {
                enabled: false,
                onSuccess: {
                  variableChanges: {
                    Physique: 15,
                    Mentale: -5
                  }
                }
              }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'scene-transition',
    name: 'Transition de scène',
    description: 'Narrateur seul avec choix de continuation ou fin',
    icon: '➡️',
    category: 'Basic',
    tags: ['transition', 'narrateur', 'navigation'],
    structure: {
      dialogues: [
        {
          speaker: 'narrator',
          text: '[Décrivez le changement de lieu, de temps, ou résumez ce qui s\'est passé]',
          choices: [
            {
              text: 'Continuer l\'aventure',
              nextScene: '',
              diceCheck: null
            },
            {
              text: 'Terminer l\'histoire ici',
              nextScene: 'END',
              diceCheck: null
            }
          ]
        }
      ]
    }
  }
];

/**
 * Catégories de templates pour l'UI
 */
export const TEMPLATE_CATEGORIES = [
  { id: 'Basic', label: 'Basique', icon: '📋' },
  { id: 'Gameplay', label: 'Gameplay', icon: '🎮' },
  { id: 'Narrative', label: 'Narratif', icon: '📖' }
];

/**
 * Fonction utilitaire pour appliquer un template à une scène existante
 * @param {Object} template - Le template sélectionné
 * @param {Object} scene - La scène cible
 * @returns {Object} - La scène avec les dialogues du template ajoutés
 */
export function applyTemplateToScene(template, scene) {
  const newDialogues = template.structure.dialogues.map(dialogue => ({
    ...dialogue,
    // Générer un ID unique pour chaque dialogue
    id: `dialogue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }));

  return {
    ...scene,
    dialogues: [...(scene.dialogues || []), ...newDialogues]
  };
}

/**
 * Fonction pour créer une nouvelle scène depuis un template
 * @param {Object} template - Le template sélectionné
 * @param {string} sceneId - ID unique de la nouvelle scène
 * @returns {Object} - Une nouvelle scène complète
 */
export function createSceneFromTemplate(template, sceneId) {
  return {
    id: sceneId,
    title: `Nouvelle scène (${template.name})`,
    description: template.description,
    background: '',
    dialogues: template.structure.dialogues.map(dialogue => ({
      ...dialogue,
      id: `dialogue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))
  };
}
