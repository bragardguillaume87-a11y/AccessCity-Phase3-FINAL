import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { toAbsoluteAssetPath } from '../utils/pathUtils';
import type { SceneMetadata } from '../types';
import { useDialoguesStore } from './dialoguesStore';
import { useSceneElementsStore } from './sceneElementsStore';

/**
 * Scenes Store
 *
 * **Pattern**: Repository Pattern - gère les scènes uniquement
 * **Séparation**: Refactorisé (Vague 9, Phase 3) - 758L → 250L
 *
 * Responsabilités:
 * - CRUD scènes (id, title, description, backgroundUrl, order)
 * - Cascade delete vers dialoguesStore et sceneElementsStore
 * - Sample data initialization
 *
 * Ce store NE gère PLUS:
 * ❌ Dialogues → voir dialoguesStore.ts
 * ❌ Characters/Props/TextBoxes → voir sceneElementsStore.ts
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * ScenesState — Store interne avec SceneMetadata uniquement
 *
 * ⚠️ INVARIANT POST-PHASE 3 :
 * - scenes[] ne contient QUE des métadonnées (id, title, description, backgroundUrl, audio)
 * - Les dialogues → dialoguesStore
 * - Les characters/textBoxes/props → sceneElementsStore
 * - Pour une scène complète → useSceneWithElements() ou useAllScenesWithElements()
 */
interface ScenesState {
  // State
  scenes: SceneMetadata[];

  // Queries
  getSceneById: (sceneId: string) => SceneMetadata | undefined;
  getAllScenes: () => SceneMetadata[];

  // Actions: CRUD
  addScene: () => string;
  updateScene: (sceneId: string, patch: Partial<SceneMetadata> | ((scene: SceneMetadata) => Partial<SceneMetadata>)) => void;
  deleteScene: (sceneId: string) => void;
  reorderScenes: (newScenesOrder: SceneMetadata[]) => void;
  setSceneBackground: (sceneId: string, backgroundUrl: string) => void;

  // Batch operations (performance)
  batchUpdateScenes: (updates: Array<{ sceneId: string; patch: Partial<SceneMetadata> }>) => void;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

/**
 * SAMPLE_SCENES - Data de démo (métadonnées uniquement)
 *
 * Post-Phase 3 : plus de dialogues/characters ici.
 * Les données des stores associés (dialoguesStore, sceneElementsStore)
 * sont initialisées séparément via leurs propres SAMPLE_DATA.
 */
const SAMPLE_SCENES: SceneMetadata[] = [
  {
    id: 'scenetest01',
    title: 'Rencontre Mairie',
    description: 'Première rencontre avec le conseiller municipal pour le projet AccessCity.',
    backgroundUrl: '',
  },
  {
    id: 'scenetest02',
    title: 'Présentation Projet',
    description: 'Présentation du projet AccessCity devant le conseil municipal.',
    backgroundUrl: '',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Génère un ID unique pour scène
 */
function generateSceneId(): string {
  return `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crée une scène vide avec defaults (métadonnées uniquement)
 *
 * Post-Phase 3 : pas de dialogues/characters ici.
 * Utiliser dialoguesStore.addDialogue() et sceneElementsStore.addCharacterToScene()
 * pour ajouter du contenu après création.
 */
function createEmptyScene(): SceneMetadata {
  return {
    id: generateSceneId(),
    title: 'Nouvelle Scène',
    description: '',
    backgroundUrl: '',
  };
}

// ============================================================================
// STORE
// ============================================================================

export const useScenesStore = create<ScenesState>()(
  temporal(
    persist(
      devtools(
        subscribeWithSelector((set, get) => ({
          // ============================================================
          // STATE INITIAL
          // ============================================================
          scenes: SAMPLE_SCENES,

          // ============================================================
          // QUERIES
          // ============================================================

          /**
           * Récupère une scène par ID
           */
          getSceneById: (sceneId) => {
            return get().scenes.find((s) => s.id === sceneId);
          },

          /**
           * Récupère toutes les scènes
           */
          getAllScenes: () => {
            return get().scenes;
          },

          // ============================================================
          // ACTIONS: CREATE
          // ============================================================

          /**
           * Ajoute une nouvelle scène vide
           *
           * @returns ID de la scène créée
           *
           * @example
           * const sceneId = addScene();
           * console.log(sceneId); // 'scene-abc123...'
           */
          addScene: () => {
            const newScene = createEmptyScene();

            set(
              (state) => ({
                scenes: [...state.scenes, newScene],
              }),
              false,
              'scenes/addScene'
            );

            return newScene.id;
          },

          // ============================================================
          // ACTIONS: UPDATE
          // ============================================================

          /**
           * Met à jour une scène
           *
           * Supporte patch objet ou fonction callback
           */
          updateScene: (sceneId, patch) => {
            set(
              (state) => {
                const scene = state.scenes.find((s) => s.id === sceneId);
                if (!scene) return state;

                const updates = typeof patch === 'function' ? patch(scene) : patch;
                const updatedScene = { ...scene, ...updates };

                // Normaliser backgroundUrl si présent
                if (updates.backgroundUrl) {
                  updatedScene.backgroundUrl = toAbsoluteAssetPath(updates.backgroundUrl);
                }

                return {
                  scenes: state.scenes.map((s) => (s.id === sceneId ? updatedScene : s)),
                };
              },
              false,
              'scenes/updateScene'
            );
          },

          /**
           * Met à jour le fond d'une scène
           *
           * Helper spécialisé avec normalisation de path
           */
          setSceneBackground: (sceneId, backgroundUrl) => {
            set(
              (state) => {
                const scene = state.scenes.find((s) => s.id === sceneId);
                if (!scene) return state;

                return {
                  scenes: state.scenes.map((s) =>
                    s.id === sceneId
                      ? { ...s, backgroundUrl: toAbsoluteAssetPath(backgroundUrl) }
                      : s
                  ),
                };
              },
              false,
              'scenes/setSceneBackground'
            );
          },

          /**
           * Batch update : met à jour plusieurs scènes en une seule opération
           *
           * Performance: Réduit les re-renders
           */
          batchUpdateScenes: (updates) => {
            set(
              (state) => {
                const updatedScenes = state.scenes.map((scene) => {
                  const update = updates.find((u) => u.sceneId === scene.id);
                  if (!update) return scene;

                  const updatedScene = { ...scene, ...update.patch };

                  // Normaliser backgroundUrl si présent
                  if (update.patch.backgroundUrl) {
                    updatedScene.backgroundUrl = toAbsoluteAssetPath(update.patch.backgroundUrl);
                  }

                  return updatedScene;
                });

                return { scenes: updatedScenes };
              },
              false,
              'scenes/batchUpdateScenes'
            );
          },

          // ============================================================
          // ACTIONS: DELETE
          // ============================================================

          /**
           * Supprime une scène
           *
           * ⚠️ CASCADE DELETE: Déclenche aussi la suppression dans:
           * - dialoguesStore.deleteAllDialoguesForScene(sceneId)
           * - sceneElementsStore.deleteAllElementsForScene(sceneId)
           */
          deleteScene: (sceneId) => {
            set(
              (state) => ({
                scenes: state.scenes.filter((s) => s.id !== sceneId),
              }),
              false,
              'scenes/deleteScene'
            );

            // CASCADE DELETE: Supprimer les données associées (synchrone)
            useDialoguesStore.getState().deleteAllDialoguesForScene(sceneId);
            useSceneElementsStore.getState().deleteAllElementsForScene(sceneId);
          },

          // ============================================================
          // ACTIONS: REORDER
          // ============================================================

          /**
           * Réordonne les scènes
           *
           * @param newScenesOrder - Nouvelle liste ordonnée des scènes
           */
          reorderScenes: (newScenesOrder) => {
            set(
              () => ({
                scenes: newScenesOrder,
              }),
              false,
              'scenes/reorderScenes'
            );
          },
        })),
        { name: 'ScenesStore' }
      ),
      {
        name: 'scenes-storage',
        storage: createJSONStorage(() => localStorage),
        version: 3, // Incrémenté pour nouvelle structure
        // Migration si besoin
        migrate: (persistedState: unknown, version: number) => {
          if (version < 3) {
            // Migration v2 → v3 : Extraire dialogues/characters/etc.
            // Les données seront dans les nouveaux stores
            type LegacyScene = { id: string; title: string; description?: string; backgroundUrl?: string };
            const state = persistedState as { scenes?: LegacyScene[] };
            return {
              ...state,
              scenes: state.scenes?.map((scene): SceneMetadata => ({
                id: scene.id,
                title: scene.title,
                description: scene.description || '',
                backgroundUrl: scene.backgroundUrl || '',
                // Post-Phase 3 : plus d'arrays vides dans le store
              })) || [],
            };
          }
          // v3 → v4 : Supprimer les arrays vestigiaux (dialogues[], characters[], etc.)
          // Les données JSON existantes ont ces champs mais ils sont ignorés à la lecture.
          return persistedState;
        },
      }
    ),
    {
      limit: 50,
      equality: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    }
  )
);

// ============================================================================
// EXPORTS
// ============================================================================

export type { ScenesState };
