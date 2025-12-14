/**
 * Text Snippets - Autocomplete suggestions for common phrases
 * Inspiré de Yarn Spinner et Inky autocomplete
 */

export const TEXT_SNIPPETS = {
  narrator: [
    {
      id: 'intro-location',
      trigger: 'intro',
      label: 'Introduction - Arrivée',
      text: 'Vous arrivez devant [lieu]. L\'endroit semble [adjectif].',
      category: 'Introduction'
    },
    {
      id: 'intro-character',
      trigger: 'perso',
      label: 'Introduction - Personnage',
      text: 'Vous rencontrez [nom], qui vous salue d\'un [geste].',
      category: 'Introduction'
    },
    {
      id: 'success-action',
      trigger: 'success',
      label: 'Succès',
      text: 'Votre action réussit ! [Décrivez la conséquence positive]',
      category: 'Résultat'
    },
    {
      id: 'failure-action',
      trigger: 'echec',
      label: 'Échec',
      text: 'Malheureusement, vous échouez. [Décrivez la conséquence négative]',
      category: 'Résultat'
    },
    {
      id: 'transition-time',
      trigger: 'temps',
      label: 'Transition - Temps',
      text: 'Quelques [minutes/heures/jours] plus tard...',
      category: 'Transition'
    },
    {
      id: 'transition-location',
      trigger: 'lieu',
      label: 'Transition - Lieu',
      text: 'Vous vous dirigez maintenant vers [nouveau lieu].',
      category: 'Transition'
    },
    {
      id: 'description-obstacle',
      trigger: 'obstacle',
      label: 'Description - Obstacle',
      text: 'Un obstacle se dresse devant vous : [décrivez l\'obstacle].',
      category: 'Description'
    },
    {
      id: 'ending-positive',
      trigger: 'fin+',
      label: 'Fin positive',
      text: 'Félicitations ! Vous avez accompli votre mission avec succès.',
      category: 'Fin'
    },
    {
      id: 'ending-negative',
      trigger: 'fin-',
      label: 'Fin négative',
      text: 'Votre aventure se termine ici. Vous n\'avez pas réussi à [objectif].',
      category: 'Fin'
    }
  ],

  choices: [
    {
      id: 'accept',
      trigger: 'accepter',
      label: 'Accepter',
      text: 'Accepter la proposition',
      category: 'Réponse'
    },
    {
      id: 'refuse',
      trigger: 'refuser',
      label: 'Refuser',
      text: 'Refuser poliment',
      category: 'Réponse'
    },
    {
      id: 'investigate',
      trigger: 'inspecter',
      label: 'Inspecter',
      text: 'Examiner de plus près',
      category: 'Action'
    },
    {
      id: 'talk',
      trigger: 'parler',
      label: 'Parler',
      text: 'Engager la conversation',
      category: 'Action'
    },
    {
      id: 'leave',
      trigger: 'partir',
      label: 'Partir',
      text: 'S\'en aller',
      category: 'Action'
    },
    {
      id: 'help',
      trigger: 'aide',
      label: 'Aider',
      text: 'Proposer votre aide',
      category: 'Action'
    },
    {
      id: 'wait',
      trigger: 'attendre',
      label: 'Attendre',
      text: 'Patienter et observer',
      category: 'Action'
    },
    {
      id: 'continue',
      trigger: 'continuer',
      label: 'Continuer',
      text: 'Poursuivre votre chemin',
      category: 'Action'
    }
  ],

  accessibility: [
    {
      id: 'greeting',
      trigger: 'bonjour',
      label: 'Salutation AccessCity',
      text: 'Bonjour ! Bienvenue à AccessCity. Comment puis-je vous aider aujourd\'hui ?',
      category: 'AccessCity'
    },
    {
      id: 'explain',
      trigger: 'expliquer',
      label: 'Explication AccessCity',
      text: 'Je peux vous expliquer comment naviguer dans la ville de manière accessible.',
      category: 'AccessCity'
    },
    {
      id: 'encourage',
      trigger: 'encourager',
      label: 'Encouragement AccessCity',
      text: 'Vous faites des progrès remarquables ! Continuez ainsi.',
      category: 'AccessCity'
    },
    {
      id: 'accessibility-info',
      trigger: 'acces',
      label: 'Info accessibilité',
      text: 'Cet endroit dispose de [rampe d\'accès/ascenseur/signalétique tactile].',
      category: 'AccessCity'
    },
    {
      id: 'difficulty',
      trigger: 'defi',
      label: 'Défi accessibilité',
      text: 'Vous rencontrez une difficulté : [obstacle d\'accessibilité]. Que souhaitez-vous faire ?',
      category: 'AccessCity'
    }
  ]
};

/**
 * Get all snippets for a given context
 * @param {string} context - 'narrator', 'choices', or 'accessibility'
 * @returns {Array} - Array of snippets
 */
export function getSnippetsForContext(context) {
  return TEXT_SNIPPETS[context] || [];
}

/**
 * Search snippets by trigger or label
 * @param {string} query - Search query
 * @param {string} context - Optional context filter
 * @returns {Array} - Matching snippets
 */
export function searchSnippets(query, context = null) {
  const allSnippets = context
    ? getSnippetsForContext(context)
    : [...TEXT_SNIPPETS.narrator, ...TEXT_SNIPPETS.choices, ...TEXT_SNIPPETS.accessibility];

  if (!query || query.trim() === '') {
    return allSnippets;
  }

  const lowerQuery = query.toLowerCase();

  return allSnippets.filter(snippet =>
    snippet.trigger.toLowerCase().includes(lowerQuery) ||
    snippet.label.toLowerCase().includes(lowerQuery) ||
    snippet.text.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get snippet categories
 * @returns {Array} - List of unique categories
 */
export function getSnippetCategories() {
  const allSnippets = [...TEXT_SNIPPETS.narrator, ...TEXT_SNIPPETS.choices, ...TEXT_SNIPPETS.accessibility];
  const categories = [...new Set(allSnippets.map(s => s.category))];
  return categories.sort();
}
