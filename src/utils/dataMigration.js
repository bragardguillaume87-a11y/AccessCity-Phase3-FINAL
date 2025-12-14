/**
 * Data Migration Utilities
 * Gère la migration des anciennes versions du format de données
 */

/**
 * Migre le champ 'background' vers 'backgroundUrl' pour les scènes
 * @param {Object} editorState - État complet de l'éditeur
 * @returns {Object} - État migré
 */
export function migrateBackgroundField(editorState) {
  if (!editorState || !editorState.scenes) {
    return editorState;
  }

  let migrationCount = 0;

  const migratedScenes = editorState.scenes.map(scene => {
    // Si le champ 'background' existe mais pas 'backgroundUrl'
    if (scene.background && !scene.backgroundUrl) {
      migrationCount++;
      console.log(`[Migration] Scene "${scene.title}" : background → backgroundUrl`);

      // Créer une nouvelle scène avec backgroundUrl et sans background
      const { background, ...sceneWithoutBackground } = scene;
      return {
        ...sceneWithoutBackground,
        backgroundUrl: background
      };
    }

    // Si les deux existent, privilégier backgroundUrl et supprimer background
    if (scene.background && scene.backgroundUrl) {
      migrationCount++;
      console.log(`[Migration] Scene "${scene.title}" : suppression du champ 'background' redondant`);

      const { background, ...sceneWithoutBackground } = scene;
      return sceneWithoutBackground;
    }

    return scene;
  });

  if (migrationCount > 0) {
    console.log(`[Migration] ✅ ${migrationCount} scène(s) migrée(s) avec succès`);
  }

  return {
    ...editorState,
    scenes: migratedScenes
  };
}

/**
 * Applique toutes les migrations nécessaires
 * @param {Object} editorState - État de l'éditeur
 * @returns {Object} - État après migrations
 */
export function applyAllMigrations(editorState) {
  console.log('[Migration] Début des migrations...');

  let migratedState = editorState;

  // Migration 1: background → backgroundUrl
  migratedState = migrateBackgroundField(migratedState);

  // Futures migrations peuvent être ajoutées ici
  // migratedState = migrateFutureFeature(migratedState);

  console.log('[Migration] Migrations terminées');
  return migratedState;
}
