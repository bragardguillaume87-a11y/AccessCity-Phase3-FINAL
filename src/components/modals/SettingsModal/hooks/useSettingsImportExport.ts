import React from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useScenesStore } from '@/stores/scenesStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { useCharactersStore } from '@/stores/charactersStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Settings form data structure (affiché dans le formulaire Settings)
 */
export interface SettingsFormData {
  project: {
    title: string;
    author: string;
    description: string;
    version: string;
  };
  editor: {
    theme: string;
    autosave: boolean;
    autosaveInterval: number;
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
  };
  game: {
    variables: {
      [key: string]: {
        initial: number;
        min: number;
        max: number;
      };
    };
    enableStatsHUD?: boolean;
  };
}

/**
 * Format d'export complet du projet (v2).
 * Contient les données de tous les stores persistés.
 */
interface ProjectExport {
  /** Indicateur de version du format — v2 = export projet complet */
  _accesscity_export_version: '2.0';
  exportedAt: string;
  projectTitle: string;
  scenes: unknown[];
  dialoguesByScene: Record<string, unknown[]>;
  elementsByScene: Record<string, unknown>;
  characters: unknown[];
  projectData: unknown;
  projectSettings: unknown;
}

/**
 * Return type for useSettingsImportExport hook
 */
export interface UseSettingsImportExportReturn {
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * useSettingsImportExport — Sauvegarde et restauration complète du projet.
 *
 * Export (v2) : récupère les données des 5 stores Zustand et produit un JSON
 * contenant scènes, dialogues, éléments de scène, personnages et paramètres.
 *
 * Import : accepte les exports v2 (projet complet) et les anciens exports v1
 * (paramètres uniquement). En v2 : restaure tous les stores. En v1 : met à
 * jour uniquement le formulaire Settings (rétrocompat).
 */
export function useSettingsImportExport(
  formData: SettingsFormData,
  setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>
): UseSettingsImportExportReturn {

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = (): void => {
    try {
      // Lecture ponctuelle des stores (handler, pas render → getState() correct)
      const scenesState     = useScenesStore.getState();
      const dialoguesState  = useDialoguesStore.getState();
      const elementsState   = useSceneElementsStore.getState();
      const charactersState = useCharactersStore.getState();
      const settingsState   = useSettingsStore.getState();

      const exportData: ProjectExport = {
        _accesscity_export_version: '2.0',
        exportedAt: new Date().toISOString(),
        projectTitle: formData.project?.title || settingsState.projectData?.title || 'Projet AccessCity',
        scenes:           scenesState.scenes,
        dialoguesByScene: dialoguesState.dialoguesByScene,
        elementsByScene:  elementsState.elementsByScene,
        characters:       charactersState.characters,
        projectData:      settingsState.projectData,
        projectSettings:  settingsState.projectSettings,
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `accesscity-${exportData.projectTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-backup.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Projet exporté !', {
        description: `${scenesState.scenes.length} scène(s) · ${charactersState.characters.length} personnage(s)`,
      });
    } catch (error) {
      logger.error('[Settings] Export échoué :', error);
      toast.error("Échec de l'export", { description: String(error) });
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Fichier invalide', { description: 'Sélectionne un fichier .json exporté depuis AccessCity.' });
      return;
    }

    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>): void => {
      try {
        const raw = event.target?.result;
        if (typeof raw !== 'string') throw new Error('Contenu illisible');

        const parsed = JSON.parse(raw);

        // ── v2 : export projet complet ────────────────────────────────────
        if (parsed._accesscity_export_version === '2.0') {
          if (!Array.isArray(parsed.scenes))               throw new Error('Champ "scenes" manquant ou invalide');
          if (typeof parsed.dialoguesByScene !== 'object') throw new Error('Champ "dialoguesByScene" invalide');
          if (typeof parsed.elementsByScene  !== 'object') throw new Error('Champ "elementsByScene" invalide');
          if (!Array.isArray(parsed.characters))           throw new Error('Champ "characters" invalide');

          // Restaurer tous les stores via les actions import*
          useScenesStore.getState().importScenes(parsed.scenes);
          useDialoguesStore.getState().importDialoguesByScene(parsed.dialoguesByScene);
          useSceneElementsStore.getState().importElementsByScene(parsed.elementsByScene);
          useCharactersStore.getState().importCharacters(parsed.characters);

          if (parsed.projectData)     useSettingsStore.getState().updateProjectData(parsed.projectData);
          if (parsed.projectSettings) useSettingsStore.getState().updateProjectSettings(parsed.projectSettings);

          // Synchroniser le formulaire Settings
          if (parsed.projectSettings) {
            setFormData(prev => ({ ...prev, ...parsed.projectSettings }));
          }

          toast.success('Projet restauré !', {
            description: `${parsed.scenes.length} scène(s) · ${parsed.characters.length} personnage(s). Rechargement recommandé.`,
            duration: 6000,
          });
          logger.info(`[Settings] Import v2 OK — ${parsed.scenes.length} scènes, ${parsed.characters.length} personnages`);
          return;
        }

        // ── v1 : ancien format paramètres seuls (rétrocompatibilité) ─────
        const imported = parsed as SettingsFormData;
        if (!imported.project || !imported.editor || !imported.game) {
          throw new Error('Format non reconnu. Exporte depuis Settings → Exporter pour obtenir un fichier compatible.');
        }

        setFormData(imported);
        toast.success('Paramètres restaurés.', {
          description: 'Ancien format v1 — seuls les réglages ont été importés (scènes et dialogues inchangés).',
        });

      } catch (error) {
        logger.error('[Settings] Import échoué :', error);
        toast.error("Échec de l'import", {
          description: error instanceof Error ? error.message : 'Fichier JSON invalide',
        });
      }
    };

    reader.onerror = (): void => {
      toast.error('Erreur de lecture', { description: 'Impossible de lire le fichier.' });
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  return { handleExport, handleImport };
}
