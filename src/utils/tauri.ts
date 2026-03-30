/**
 * utils/tauri.ts — Utilitaires de détection et d'intégration Tauri.
 *
 * Fournit :
 *  - isTauriEditor()          → true si on tourne dans l'éditeur desktop Tauri
 *  - convertFileSrcIfNeeded() → convertit un chemin absolu en URL asset://
 *
 * En mode web (non-Tauri), toutes les fonctions sont des no-ops sûres.
 */

import { convertFileSrc } from '@tauri-apps/api/core';

/**
 * Détecte si l'application tourne dans le contexte Tauri de l'éditeur.
 *
 * Conditions requises :
 *  1. VITE_TAURI_EDITOR='true' à la compilation (vite.config.editor-tauri.ts)
 *  2. window.__TAURI_INTERNALS__ présent à l'exécution (injection IPC Tauri)
 *
 * ⚠️ Ne jamais appeler pendant le rendu React — utiliser useMemo ou useRef.
 */
export function isTauriEditor(): boolean {
  return (
    import.meta.env.VITE_TAURI_EDITOR === 'true' &&
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window
  );
}

/**
 * Convertit un chemin de fichier absolu en URL servable dans le renderer Tauri.
 * Retourne le chemin inchangé si on n'est pas dans Tauri.
 *
 * @example
 * // Mode Tauri (Windows) :
 * convertFileSrcIfNeeded('C:\\Users\\foo\\AppData\\...\\img.png')
 * // → 'https://asset.localhost/C:/Users/foo/AppData/.../img.png'
 *
 * // Mode web :
 * convertFileSrcIfNeeded('/assets/backgrounds/img.png')
 * // → '/assets/backgrounds/img.png'
 */
export function convertFileSrcIfNeeded(path: string): string {
  if (!path) return path;
  // Ne convertir que les chemins absolus du système de fichiers (ex: C:\...).
  // Les chemins relatifs web (/assets/...) et les URLs sont déjà exploitables tels quels.
  const isAbsoluteFilesystemPath =
    /^[A-Za-z]:[/\\]/.test(path) || // Windows : C:\ ou C:/
    path.startsWith('/tmp/') ||       // Linux/macOS absolu
    path.startsWith('/home/');
  if (isTauriEditor() && isAbsoluteFilesystemPath) return convertFileSrc(path);
  return path;
}
