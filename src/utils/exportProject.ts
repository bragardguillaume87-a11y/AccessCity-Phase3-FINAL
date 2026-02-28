/**
 * exportProject.ts — Agrège les données des stores en un ExportData exportable.
 *
 * ExportData est le format self-contained pour l'export standalone :
 *   { metadata, settings, characters, scenes[] (hydratées) }
 *
 * Ce fichier est un utilitaire PUR (zéro dépendance React/Zustand).
 * Il reçoit les données déjà extraites des stores par les composants appelants.
 */

import type { Scene, DialogueBoxStyle } from '@/types/scenes';
import type { Character } from '@/types/characters';
import type { GameStats } from '@/types/game';

// ── Types exportés ────────────────────────────────────────────────────────────

export interface ExportVariableDef {
  initial: number;
  min: number;
  max: number;
}

export interface ExportMetadata {
  title: string;
  author: string;
  description: string;
  version: string;
  language: 'fr' | 'en';
}

export interface ExportSettings {
  variables: Record<string, ExportVariableDef>;
  dialogueBoxDefaults?: DialogueBoxStyle;
  enableStatsHUD: boolean;
}

/**
 * Format d'export standalone — contient tout le nécessaire pour jouer sans l'éditeur.
 */
export interface ExportData {
  version: '1.0';
  exportedAt: string;
  metadata: ExportMetadata;
  settings: ExportSettings;
  /** Bibliothèque de personnages utilisée par les scènes exportées. */
  characters: Character[];
  /**
   * Scènes complètes (dialogues + characters merged depuis les 3 stores).
   * ⚠️ Utiliser useAllScenesWithElements() / useSceneWithElements() pour les obtenir.
   */
  scenes: Scene[];
}

// ── Fonctions utilitaires ─────────────────────────────────────────────────────

/**
 * Construit un ExportData depuis les données extraites des stores.
 * Appelé par ExportModal qui fournit les données React.
 */
export function buildExportData(
  scenes: Scene[],
  characters: Character[],
  projectSettings: {
    project: { title: string; author: string; description: string; version: string };
    game: {
      variables: Record<string, ExportVariableDef>;
      dialogueBoxDefaults?: DialogueBoxStyle;
    };
  },
  meta: { language: 'fr' | 'en'; enableStatsHUD: boolean }
): ExportData {
  // Filtrer les personnages réellement utilisés dans ces scènes
  const usedCharacterIds = new Set<string>();
  scenes.forEach(scene => {
    scene.characters?.forEach(sc => usedCharacterIds.add(sc.characterId));
    scene.dialogues?.forEach(d => { if (d.speaker) usedCharacterIds.add(d.speaker); });
  });
  const exportedCharacters = characters.filter(c => usedCharacterIds.has(c.id));

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    metadata: {
      title: projectSettings.project.title || 'AccessCity Game',
      author: projectSettings.project.author || '',
      description: projectSettings.project.description || '',
      version: projectSettings.project.version || '1.0',
      language: meta.language,
    },
    settings: {
      variables: projectSettings.game.variables ?? {},
      dialogueBoxDefaults: projectSettings.game.dialogueBoxDefaults,
      enableStatsHUD: meta.enableStatsHUD,
    },
    characters: exportedCharacters,
    scenes,
  };
}

/**
 * Collecte tous les URLs d'assets uniques référencés dans un ExportData.
 * Retourne uniquement les URLs commençant par / (assets locaux).
 */
export function collectAssetUrls(data: ExportData): string[] {
  const urls = new Set<string>();

  const add = (url: string | undefined) => {
    if (url && url.startsWith('/')) urls.add(url);
  };

  data.scenes.forEach(scene => {
    add(scene.backgroundUrl);
    add(scene.audio?.url);
    scene.ambientTracks?.forEach(t => add(t?.url));
    scene.dialogues?.forEach(d => {
      add(d.sfx?.url);
    });
  });

  data.characters.forEach(c => {
    Object.values(c.sprites ?? {}).forEach(url => add(url));
  });

  return Array.from(urls);
}

/**
 * Convertit les définitions de variables (initial/min/max) en valeurs initiales.
 * Utilisé par PlayerApp pour initialiser les stats du moteur de jeu.
 */
export function buildInitialVariables(
  vars: Record<string, ExportVariableDef>
): GameStats {
  const result: GameStats = {};
  Object.entries(vars).forEach(([key, def]: [string, ExportVariableDef]) => {
    result[key] = def.initial ?? 0;
  });
  return result;
}
