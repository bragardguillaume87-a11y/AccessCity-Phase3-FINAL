import React from 'react';
import { toast } from 'sonner';
import { unzipSync } from 'fflate';
import { logger } from '@/utils/logger';
import { useScenesStore } from '@/stores/scenesStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { useCharactersStore } from '@/stores/charactersStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMapsStore } from '@/stores/mapsStore';
import { generateProjectBackupZip } from '@/utils/generateProjectBackupZip';
import { isTauriEditor, convertFileSrcIfNeeded } from '@/utils/tauri';
import { invoke } from '@tauri-apps/api/core';
import { API } from '@/config/constants';

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
 */
interface ProjectExport {
  _accesscity_export_version: '2.0';
  exportedAt: string;
  projectTitle: string;
  scenes: unknown[];
  dialoguesByScene: Record<string, unknown[]>;
  elementsByScene: Record<string, unknown>;
  characters: unknown[];
  projectData: unknown;
  projectSettings: unknown;
  maps?: unknown[];
  mapDataById?: Record<string, unknown>;
}

/**
 * Return type for useSettingsImportExport hook
 */
export interface UseSettingsImportExportReturn {
  handleExport: () => Promise<void>;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryFromPath(entryPath: string): string {
  const parts = entryPath.split('/');
  const assetsIdx = parts.lastIndexOf('assets');
  if (assetsIdx >= 0 && parts[assetsIdx + 1]) return parts[assetsIdx + 1];
  return 'misc';
}

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

/**
 * Extrait le préfixe de base des URLs d'assets Tauri depuis le JSON.
 * Ex: "https://asset.localhost/C:/Users/A/AppData/.../assets/" (tout jusqu'à /assets/)
 */
function extractOldAssetBase(json: string): string | null {
  const m = json.match(/"(https:\/\/asset\.localhost\/[^"]*?\/assets\/)/);
  if (m) return m[1];
  const m2 = json.match(/"(asset:\/\/localhost\/[^"]*?\/assets\/)/);
  if (m2) return m2[1];
  return null;
}

/**
 * Restaure les assets depuis les entrées du ZIP.
 * En mode Tauri : utilise restore_asset_exact (filename préservé) → URL Tauri.
 * En mode web : FormData POST → URL relative /assets/...
 *
 * Retourne : { count, newAssetBase } pour remapper les URLs dans le JSON.
 */
async function restoreAssetsFromZip(
  entries: Record<string, Uint8Array>
): Promise<{ count: number; newAssetBase: string | null }> {
  const assetEntries = Object.entries(entries).filter(
    ([path]) => path.includes('/assets/') && !path.endsWith('/')
  );

  if (assetEntries.length === 0) return { count: 0, newAssetBase: null };

  let restored = 0;
  let newAssetBase: string | null = null;

  if (isTauriEditor()) {
    for (const [entryPath, bytes] of assetEntries) {
      try {
        // Extraire le chemin relatif à partir de "/assets/" : "tilesets/foo-12345.png"
        const assetsIdx = entryPath.lastIndexOf('/assets/');
        const relativePath =
          assetsIdx >= 0
            ? entryPath.slice(assetsIdx + '/assets/'.length)
            : `misc/${basename(entryPath)}`;

        // restore_asset_exact préserve le filename (pas de double timestamp)
        const absolutePath = await invoke<string>('restore_asset_exact', {
          relativePath,
          data: Array.from(bytes),
        });

        // Construire le newAssetBase depuis le premier asset restauré
        if (!newAssetBase) {
          const tauriUrl = convertFileSrcIfNeeded(absolutePath);
          const assetsInUrl = tauriUrl.lastIndexOf('/assets/');
          if (assetsInUrl >= 0) {
            newAssetBase = tauriUrl.slice(0, assetsInUrl + '/assets/'.length);
          }
        }

        restored++;
      } catch {
        // Asset ignoré si restauration échoue
      }
    }
  } else {
    // Regrouper par catégorie
    const byCategory = new Map<string, Array<[string, Uint8Array]>>();
    for (const entry of assetEntries) {
      const cat = getCategoryFromPath(entry[0]);
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(entry);
    }

    for (const [category, catEntries] of byCategory) {
      try {
        const formData = new FormData();
        formData.append('category', category);
        for (const [entryPath, bytes] of catEntries) {
          const filename = basename(entryPath);
          const ext = filename.split('.').pop()?.toLowerCase() ?? '';
          const mimeType = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)
            ? `image/${ext === 'jpg' ? 'jpeg' : ext}`
            : ['mp3', 'wav', 'ogg'].includes(ext)
              ? `audio/${ext}`
              : 'application/octet-stream';
          formData.append(
            'files',
            new File([bytes.buffer as ArrayBuffer], filename, { type: mimeType })
          );
        }
        const response = await fetch(`${API.BASE_URL}/api/assets/upload`, {
          method: 'POST',
          body: formData,
        });
        if (response.ok) restored += catEntries.length;
      } catch {
        /* ignoré */
      }
    }
  }

  if (restored > 0) {
    window.dispatchEvent(new CustomEvent('asset-manifest-updated'));
  }

  return { count: restored, newAssetBase };
}

/**
 * Remplace l'ancienne base d'URLs Tauri par la nouvelle dans le JSON.
 * En mode web ou si pas de remapping nécessaire, retourne le JSON inchangé.
 */
function remapAssetUrls(json: string, oldBase: string | null, newBase: string | null): string {
  if (!oldBase || !newBase || oldBase === newBase) return json;
  // Remplacer toutes les occurrences de l'ancienne base par la nouvelle
  return json.split(oldBase).join(newBase);
}

// ── Import ZIP — logique centrale (partagée entre import manuel et autoload) ─

/**
 * Importe un projet depuis des bytes de ZIP.
 * Gère la restauration des assets + remapping des URLs Tauri.
 *
 * @param bytes      - Contenu brut du ZIP
 * @param setFormData - Optionnel : synchronise le formulaire Settings si ouvert
 */
export async function importProjectFromZipBytes(
  bytes: Uint8Array,
  setFormData?: React.Dispatch<React.SetStateAction<SettingsFormData>>
): Promise<{ scenes: number; characters: number; assets: number }> {
  const entries = unzipSync(bytes);

  // Trouver project-backup.json dans le ZIP
  const backupKey = Object.keys(entries).find((k) => k.endsWith('project-backup.json'));
  if (!backupKey) throw new Error('"project-backup.json" introuvable dans le ZIP.');

  const jsonStr = new TextDecoder().decode(entries[backupKey]);
  const parsed = JSON.parse(jsonStr);

  if (parsed._accesscity_export_version !== '2.0')
    throw new Error('Version de format non supportée.');
  if (!Array.isArray(parsed.scenes)) throw new Error('Champ "scenes" invalide');
  if (typeof parsed.dialoguesByScene !== 'object')
    throw new Error('Champ "dialoguesByScene" invalide');
  if (typeof parsed.elementsByScene !== 'object')
    throw new Error('Champ "elementsByScene" invalide');
  if (!Array.isArray(parsed.characters)) throw new Error('Champ "characters" invalide');

  // Extraire l'ancienne base d'assets (pour remapping Tauri)
  const oldAssetBase = extractOldAssetBase(jsonStr);

  // Restaurer les assets → obtenir la nouvelle base
  const { count: assetCount, newAssetBase } = await restoreAssetsFromZip(entries);

  // Remapper les URLs dans le JSON si nécessaire
  const remappedJson = remapAssetUrls(jsonStr, oldAssetBase, newAssetBase);
  const remapped = remappedJson !== jsonStr ? JSON.parse(remappedJson) : parsed;

  // Restaurer tous les stores
  useScenesStore.getState().importScenes(remapped.scenes);
  useDialoguesStore.getState().importDialoguesByScene(remapped.dialoguesByScene);
  useSceneElementsStore.getState().importElementsByScene(remapped.elementsByScene);
  useCharactersStore.getState().importCharacters(remapped.characters);
  if (remapped.projectData) useSettingsStore.getState().updateProjectData(remapped.projectData);
  if (remapped.projectSettings)
    useSettingsStore.getState().updateProjectSettings(remapped.projectSettings);
  if (remapped.maps && remapped.mapDataById)
    useMapsStore.getState().importMaps(remapped.maps, remapped.mapDataById);

  // Synchroniser le formulaire Settings si ouvert
  if (setFormData && remapped.projectSettings) {
    setFormData((prev) => ({ ...prev, ...remapped.projectSettings }));
  }

  return {
    scenes: remapped.scenes.length,
    characters: remapped.characters.length,
    assets: assetCount,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useSettingsImportExport — Export ZIP portable + import ZIP/JSON.
 *
 * Export : ZIP avec JSON + tous les assets (compatible Tauri et web).
 * Import : ZIP (avec restauration assets + remapping URLs) ou JSON v2/v1.
 */
export function useSettingsImportExport(
  formData: SettingsFormData,
  setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>
): UseSettingsImportExportReturn {
  // ── Export (ZIP portable) ─────────────────────────────────────────────────

  const handleExport = async (): Promise<void> => {
    const toastId = toast.loading('Export en cours…');
    try {
      const scenesState = useScenesStore.getState();
      const dialoguesState = useDialoguesStore.getState();
      const elementsState = useSceneElementsStore.getState();
      const charactersState = useCharactersStore.getState();
      const settingsState = useSettingsStore.getState();
      const mapsState = useMapsStore.getState();

      const title =
        formData.project?.title || settingsState.projectData?.title || 'Projet AccessCity';

      const exportData: ProjectExport = {
        _accesscity_export_version: '2.0',
        exportedAt: new Date().toISOString(),
        projectTitle: title,
        scenes: scenesState.scenes,
        dialoguesByScene: dialoguesState.dialoguesByScene,
        elementsByScene: elementsState.elementsByScene,
        characters: charactersState.characters,
        projectData: settingsState.projectData,
        projectSettings: settingsState.projectSettings,
        maps: mapsState.maps,
        mapDataById: mapsState.mapDataById,
      };

      const blob = await generateProjectBackupZip(exportData, title);

      const slug = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${slug}-backup.zip`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success('Projet exporté !', {
        id: toastId,
        description: `${scenesState.scenes.length} scène(s) · ${charactersState.characters.length} personnage(s) · assets inclus`,
      });
    } catch (error) {
      logger.error('[Settings] Export échoué :', error);
      toast.error("Échec de l'export", { id: toastId, description: String(error) });
    }
  };

  // ── Import (ZIP ou JSON) ──────────────────────────────────────────────────

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isZip = file.name.endsWith('.zip');
    const isJson = file.name.endsWith('.json');

    if (!isZip && !isJson) {
      toast.error('Fichier invalide', { description: 'Sélectionne un fichier .zip ou .json.' });
      return;
    }

    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>): void => {
      const raw = event.target?.result;
      if (!raw) return;

      // ── ZIP import ────────────────────────────────────────────────────────
      if (isZip) {
        (async () => {
          const toastId = toast.loading('Restauration en cours…');
          try {
            const bytes = new Uint8Array(raw as ArrayBuffer);
            const { scenes, characters, assets } = await importProjectFromZipBytes(
              bytes,
              setFormData
            );
            toast.success('Projet restauré !', {
              id: toastId,
              description: `${scenes} scène(s) · ${characters} personnage(s) · ${assets} asset(s). Rechargement recommandé.`,
              duration: 7000,
            });
            logger.info(
              `[Settings] Import ZIP OK — ${scenes} scènes, ${characters} personnages, ${assets} assets`
            );
          } catch (error) {
            logger.error('[Settings] Import ZIP échoué :', error);
            toast.error("Échec de l'import ZIP", {
              id: toastId,
              description: error instanceof Error ? error.message : 'Fichier ZIP invalide',
            });
          }
        })();
        return;
      }

      // ── JSON import ───────────────────────────────────────────────────────
      try {
        if (typeof raw !== 'string') throw new Error('Contenu illisible');
        const parsed = JSON.parse(raw);

        // v2 : export projet complet
        if (parsed._accesscity_export_version === '2.0') {
          if (!Array.isArray(parsed.scenes)) throw new Error('Champ "scenes" manquant');
          if (typeof parsed.dialoguesByScene !== 'object')
            throw new Error('Champ "dialoguesByScene" invalide');
          if (typeof parsed.elementsByScene !== 'object')
            throw new Error('Champ "elementsByScene" invalide');
          if (!Array.isArray(parsed.characters)) throw new Error('Champ "characters" invalide');

          useScenesStore.getState().importScenes(parsed.scenes);
          useDialoguesStore.getState().importDialoguesByScene(parsed.dialoguesByScene);
          useSceneElementsStore.getState().importElementsByScene(parsed.elementsByScene);
          useCharactersStore.getState().importCharacters(parsed.characters);
          if (parsed.projectData) useSettingsStore.getState().updateProjectData(parsed.projectData);
          if (parsed.projectSettings)
            useSettingsStore.getState().updateProjectSettings(parsed.projectSettings);
          if (parsed.maps && parsed.mapDataById)
            useMapsStore.getState().importMaps(parsed.maps, parsed.mapDataById);
          if (parsed.projectSettings)
            setFormData((prev) => ({ ...prev, ...parsed.projectSettings }));

          toast.success('Projet restauré !', {
            description: `${parsed.scenes.length} scène(s) · ${parsed.characters.length} personnage(s). Rechargement recommandé.`,
            duration: 6000,
          });
          return;
        }

        // v1 : ancien format paramètres seuls
        const imported = parsed as SettingsFormData;
        if (!imported.project || !imported.editor || !imported.game) {
          throw new Error('Format non reconnu.');
        }
        setFormData(imported);
        toast.success('Paramètres restaurés.', {
          description: 'Ancien format v1 — seuls les réglages ont été importés.',
        });
      } catch (error) {
        logger.error('[Settings] Import JSON échoué :', error);
        toast.error("Échec de l'import", {
          description: error instanceof Error ? error.message : 'Fichier JSON invalide',
        });
      }
    };

    reader.onerror = (): void => {
      toast.error('Erreur de lecture', { description: 'Impossible de lire le fichier.' });
    };

    if (isZip) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
    e.target.value = '';
  };

  return { handleExport, handleImport };
}
