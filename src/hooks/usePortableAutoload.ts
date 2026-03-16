/**
 * usePortableAutoload — Auto-import du projet au premier lancement en mode portable.
 *
 * Au premier démarrage du build portable (fr.accesscity.studio.portable),
 * ce hook vérifie si un fichier `data/autoload.zip` existe à côté de l'exe.
 * Si oui, il importe automatiquement le projet (stores + assets) et marque
 * le lancement comme "déjà chargé" dans localStorage.
 *
 * Flux complet :
 *   1. npm run build:portable → accesscity-player.exe + data/autoload.zip
 *   2. Premier lancement → ce hook importe le ZIP silencieusement
 *   3. Lancements suivants → localStorage `ac_portable_autoloaded` présent → skip
 */

import { useEffect } from 'react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '@/utils/logger';
import { isTauriEditor } from '@/utils/tauri';
import { importProjectFromZipBytes } from '@/components/modals/SettingsModal/hooks/useSettingsImportExport';

const AUTOLOAD_KEY = 'ac_portable_autoloaded';

export function usePortableAutoload(): void {
  useEffect(() => {
    // Uniquement en mode Tauri portable, et uniquement au premier lancement
    if (!isTauriEditor()) return;
    if (localStorage.getItem(AUTOLOAD_KEY)) return;

    (async () => {
      try {
        const zipBytes = await invoke<number[] | null>('read_autoload_zip');
        if (!zipBytes || zipBytes.length === 0) {
          // Pas d'autoload.zip → marquer quand même pour ne pas re-tester
          localStorage.setItem(AUTOLOAD_KEY, '1');
          return;
        }

        const toastId = toast.loading('Chargement du projet portable…');

        const bytes = new Uint8Array(zipBytes);
        const { scenes, characters, assets } = await importProjectFromZipBytes(bytes);

        localStorage.setItem(AUTOLOAD_KEY, '1');

        toast.success('Projet chargé !', {
          id: toastId,
          description: `${scenes} scène(s) · ${characters} personnage(s) · ${assets} asset(s)`,
          duration: 5000,
        });

        logger.info(
          `[Portable] Autoload OK — ${scenes} scènes, ${characters} personnages, ${assets} assets`
        );

        // Recharger le manifest des assets pour les afficher dans la bibliothèque
        window.dispatchEvent(new CustomEvent('asset-manifest-updated'));
      } catch (error) {
        // Erreur silencieuse — ne pas bloquer l'utilisateur
        logger.warn('[Portable] Autoload échoué (non bloquant) :', error);
        // Marquer quand même pour ne pas re-tenter en boucle
        localStorage.setItem(AUTOLOAD_KEY, '1');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);
}
