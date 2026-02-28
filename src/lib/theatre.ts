/**
 * theatre.ts — Singleton Theatre.js project + utilitaires pour AccessCity.
 *
 * Architecture :
 *   - Un seul projet Theatre.js par session (singleton module-level)
 *   - Un Sheet par scène : "Scene__<sceneId>"
 *   - @theatre/studio chargé dynamiquement (dev only) via initTheatreStudio()
 *
 * Stockage de l'état :
 *   Theatre.js persiste son état dans localStorage ("Theatre_AccessCity")
 *   par défaut. En Phase 2, on pourra l'intégrer dans le projet JSON AccessCity.
 *
 * @see https://www.theatrejs.com/docs/latest/api/core
 */

import { getProject } from '@theatre/core';
import type { IProject, ISheet } from '@theatre/core';

// ── Singleton ──────────────────────────────────────────────────────────────────

/** Projet Theatre.js global (un seul par session AccessCity). */
let _project: IProject | null = null;

function getTheatreProject(): IProject {
  if (!_project) {
    _project = getProject('AccessCity');
  }
  return _project;
}

/**
 * Retourne le Sheet Theatre.js pour une scène donnée.
 * Chaque scène possède sa propre timeline indépendante.
 *
 * @param sceneId - ID de la scène AccessCity
 */
export function getSceneSheet(sceneId: string): ISheet {
  return getTheatreProject().sheet(`Scene__${sceneId}`);
}

// ── Studio (dev only) ──────────────────────────────────────────────────────────

/** Référence au module Studio — null si non initialisé ou build prod. */
let _studioModule: (typeof import('@theatre/studio'))['default'] | null = null;

/** Indique si Studio a déjà été initialisé. */
let _studioInitialized = false;

/**
 * Initialise Theatre Studio (dev only).
 * Idempotent — sans effet si déjà initialisé.
 * Studio démarre caché (ui.hide()) — utiliser toggleTheatreStudio() pour l'afficher.
 *
 * ⚠️ Ne jamais appeler en production — import('@theatre/studio') est tree-shaken
 *    par Rollup/Vite grâce au bloc `if (import.meta.env.DEV)`.
 */
export async function initTheatreStudio(): Promise<void> {
  if (!import.meta.env.DEV || _studioInitialized) return;

  const { default: studio } = await import('@theatre/studio');
  studio.initialize({ usePersistentStorage: true });
  studio.ui.hide(); // Caché par défaut, activé via bouton TopBar
  _studioModule = studio;
  _studioInitialized = true;
}

/**
 * Affiche ou masque le panel Theatre Studio.
 * Initialise Studio au premier appel (lazy init) — pas besoin d'appeler
 * initTheatreStudio() au préalable.
 * Sans effet en production.
 */
export async function toggleTheatreStudio(show: boolean): Promise<void> {
  if (!import.meta.env.DEV) return;
  // Lazy init : charge Studio la première fois que le bouton est cliqué
  if (!_studioInitialized) {
    await initTheatreStudio();
  }
  if (!_studioModule) return;
  if (show) {
    _studioModule.ui.restore();
  } else {
    _studioModule.ui.hide();
  }
}
