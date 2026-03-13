/**
 * loadDefaultProject — Chargement automatique du projet par défaut au premier lancement.
 *
 * Flux :
 *   1. Au premier lancement (STORAGE_KEYS.ONBOARDING_COMPLETED absent du localStorage),
 *      l'app fetche `/default-project.json` bundlé dans le build.
 *   2. Si le fichier est présent et valide (format v2), il est importé dans les 5 stores.
 *   3. La clé ONBOARDING_COMPLETED est posée → les relances suivantes skippent l'import.
 *
 * Le fichier `/public/default-project.json` est généré via Settings → Exporter dans l'éditeur.
 * Si absent (build sans projet par défaut), la fonction retourne silencieusement false.
 */

import { logger } from '@/utils/logger';
import { STORAGE_KEYS } from '@/config/storageKeys';
import { useScenesStore } from '@/stores/scenesStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { useCharactersStore } from '@/stores/charactersStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Retourne true si c'est le premier lancement (aucun projet déjà chargé par l'utilisateur).
 */
export function isFirstLaunch(): boolean {
  return !localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
}

/**
 * Fetche `/default-project.json`, valide le format v2, et charge les données dans les stores.
 *
 * @returns true si le chargement a réussi, false sinon (fichier absent, format invalide, erreur réseau).
 */
export async function loadDefaultProject(): Promise<boolean> {
  try {
    const res = await fetch('/default-project.json');

    // Pas de fichier par défaut dans ce build → skip silencieux
    if (!res.ok) {
      logger.debug('[DefaultProject] Aucun default-project.json trouvé — skip.');
      return false;
    }

    const parsed = await res.json();

    // Validation format v2
    if (parsed._accesscity_export_version !== '2.0')  return false;
    if (!Array.isArray(parsed.scenes))                return false;
    if (typeof parsed.dialoguesByScene !== 'object')  return false;
    if (typeof parsed.elementsByScene  !== 'object')  return false;
    if (!Array.isArray(parsed.characters))            return false;

    // Import dans les stores (getState() correct ici — appelé hors render)
    useScenesStore.getState().importScenes(parsed.scenes);
    useDialoguesStore.getState().importDialoguesByScene(parsed.dialoguesByScene);
    useSceneElementsStore.getState().importElementsByScene(parsed.elementsByScene);
    useCharactersStore.getState().importCharacters(parsed.characters);

    if (parsed.projectData)     useSettingsStore.getState().updateProjectData(parsed.projectData);
    if (parsed.projectSettings) useSettingsStore.getState().updateProjectSettings(parsed.projectSettings);

    // Marquer comme initialisé — évite le rechargement aux prochains lancements
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');

    logger.info(
      `[DefaultProject] Projet par défaut chargé — ` +
      `${parsed.scenes.length} scène(s), ${parsed.characters.length} personnage(s)`
    );
    return true;

  } catch (error) {
    logger.error('[DefaultProject] Échec du chargement :', error);
    return false;
  }
}
