import { useEffect } from 'react';
import { useScenesStore } from '../stores/scenesStore.js';
import { useCharactersStore } from '../stores/charactersStore.js';
import { useSettingsStore } from '../stores/settingsStore.js';
import { useUIStore } from '../stores/uiStore.js';
import { logger } from '../utils/logger.js';

/**
 * useAutoSave
 * Hook qui ecoute les changements dans les stores et sauvegarde automatiquement
 * dans localStorage.
 *
 * Utilise subscribeWithSelector de Zustand pour ecouter les changements.
 */
export function useAutoSave() {
  const scenes = useScenesStore((state) => state.scenes);
  const characters = useCharactersStore((state) => state.characters);
  const variables = useSettingsStore((state) => state.variables);
  const projectData = useSettingsStore((state) => state.projectData);
  const projectSettings = useSettingsStore((state) => state.projectSettings);

  const setLastSaved = useUIStore((state) => state.setLastSaved);
  const setIsSaving = useUIStore((state) => state.setIsSaving);

  useEffect(() => {
    const autoSaveData = {
      scenes,
      characters,
      variables,
      projectData,
      projectSettings,
      timestamp: new Date().toISOString(),
    };

    setIsSaving(true);

    const saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(
          'accesscity-autosave',
          JSON.stringify(autoSaveData)
        );
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (error) {
        logger.error('[AutoSave] Failed to save:', error);
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [scenes, characters, variables, projectData, projectSettings, setLastSaved, setIsSaving]);
}
