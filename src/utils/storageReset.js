/**
 * Storage Reset Utility
 * Nettoie le localStorage et réinitialise aux valeurs par défaut
 * Utile pour tester les nouvelles fonctionnalités avec des données propres
 */

export function resetLocalStorage() {
  try {
    // Liste des clés utilisées par AccessCity
    const keys = [
      'accesscity-editor-state',
      'accesscity-recent-backgrounds',
      'accesscity-onboarding-completed'
    ];

    // Supprimer toutes les clés
    keys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('[Storage Reset] ✅ LocalStorage nettoyé avec succès');
    return true;
  } catch (error) {
    console.error('[Storage Reset] ❌ Erreur lors du nettoyage:', error);
    return false;
  }
}

/**
 * Affiche un bouton de reset dans la console pour debug
 */
export function initDevTools() {
  if (import.meta.env.DEV) {
    window.resetStorage = resetLocalStorage;
    console.log('[Dev Tools] 🔧 Tapez resetStorage() dans la console pour réinitialiser');
  }
}

/**
 * Crée des données de test propres
 */
export function createSampleData() {
  return {
    scenes: [
      {
        id: 'scene-1',
        title: 'Scene de test',
        description: 'Scene simple pour tester',
        backgroundUrl: '',
        dialogues: []
      }
    ],
    characters: [
      {
        id: 'narrator',
        name: 'Narrateur',
        sprites: {}
      },
      {
        id: 'player',
        name: 'Joueur',
        sprites: {}
      }
    ],
    variables: {
      Physique: 100,
      Mentale: 100
    },
    projectData: {
      projectName: 'Nouveau Projet',
      description: 'Description du projet',
      author: '',
      version: '1.0.0'
    }
  };
}
