// utils/soundFeedback.ts
// Système de feedback sonore pour AccessCity

import { TIMING } from '@/config/timing';
import { logger } from './logger';

// État global du son
let globalMuted: boolean = false;
let globalVolume: number = 0.7; // Volume par défaut à 70%

/**
 * Active ou désactive le son globalement
 * @param muted - true pour couper le son, false pour l'activer
 */
export function setGlobalMute(muted: boolean): void {
  globalMuted = muted;
  logger.debug(`[Sound] Mute: ${muted}`);
}

/**
 * Obtenir l'état actuel du mute
 * @returns État mute actuel
 */
export function isGlobalMuted(): boolean {
  return globalMuted;
}

/**
 * Définir le volume global (0.0 à 1.0)
 * @param volume - Volume entre 0 et 1
 */
export function setGlobalVolume(volume: number): void {
  globalVolume = Math.max(0, Math.min(1, volume));
  logger.debug(`[Sound] Volume: ${(globalVolume * 100).toFixed(0)}%`);
}

/**
 * Obtenir le volume actuel
 * @returns Volume actuel
 */
export function getGlobalVolume(): number {
  return globalVolume;
}

/**
 * Fonction interne pour jouer un son
 * @param path - Chemin vers le fichier audio
 * @param volumeMultiplier - Multiplicateur de volume (optionnel)
 */
function playAudio(path: string, volumeMultiplier: number = 1.0): void {
  if (globalMuted) {
    logger.debug(`[Sound] Skipped (muted): ${path}`);
    return;
  }

  try {
    const audio = new Audio(path);
    audio.volume = globalVolume * volumeMultiplier;

    audio.play().catch((err: Error) => {
      logger.warn(`[Sound] Failed to play ${path}:`, err.message);
    });

    logger.debug(`[Sound] Playing: ${path} (volume: ${(audio.volume * 100).toFixed(0)}%)`);
  } catch (error) {
    logger.error(`[Sound] Error creating audio for ${path}:`, error);
  }
}

// ========== Sons de dialogue ==========

/**
 * Son joué quand un dialogue apparaît
 */
export function playDialogue(): void {
  playAudio('/sounds/dialogue.mp3', 0.8);
}

/**
 * Son joué quand le joueur fait un choix
 */
export function playChoice(): void {
  playAudio('/sounds/choice.mp3', 0.9);
}

// ========== Sons de scène ==========

/**
 * Son joué lors d'un changement de scène
 */
export function playSceneChange(): void {
  playAudio('/sounds/scene-change.mp3', 0.7);
}

// ========== Sons de statistiques ==========

/**
 * Son joué quand une variable augmente
 */
export function playStatIncrease(): void {
  playAudio('/sounds/stat-up.mp3', 0.8);
}

/**
 * Son joué quand une variable diminue
 */
export function playStatDecrease(): void {
  playAudio('/sounds/stat-down.mp3', 0.8);
}

// ========== Sons de fin de jeu ==========

/**
 * Son joué en cas de game over
 */
export function playGameOver(): void {
  playAudio('/sounds/game-over.mp3', 1.0);
}

/**
 * Son joué en cas de victoire
 */
export function playVictory(): void {
  playAudio('/sounds/victory.mp3', 1.0);
}

// ========== Sons UI ==========

/**
 * Son de clic générique
 */
export function playClick(): void {
  playAudio('/sounds/click.mp3', 0.5);
}

/**
 * Son de hover sur bouton
 */
export function playHover(): void {
  playAudio('/sounds/hover.mp3', 0.3);
}

/**
 * Son d'erreur
 */
export function playError(): void {
  playAudio('/sounds/error.mp3', 0.8);
}

/**
 * Son de succès
 */
export function playSuccess(): void {
  playAudio('/sounds/success.mp3', 0.8);
}

// ========== Utilitaires de test ==========

/**
 * Teste tous les sons disponibles
 */
export function testAllSounds(): void {
  const sounds = [
    'dialogue',
    'choice',
    'scene-change',
    'stat-up',
    'stat-down',
    'game-over',
    'victory',
    'click',
    'hover',
    'error',
    'success',
  ];

  logger.debug('[Sound] Testing all sounds...');

  sounds.forEach((sound, index) => {
    setTimeout(() => {
      playAudio(`/sounds/${sound}.mp3`);
    }, index * TIMING.SOUND_TEST_INTERVAL);
  });
}

// Export d'un objet pour usage alternatif
export const SoundManager = {
  setMute: setGlobalMute,
  isMuted: isGlobalMuted,
  setVolume: setGlobalVolume,
  getVolume: getGlobalVolume,
  playDialogue,
  playChoice,
  playSceneChange,
  playStatIncrease,
  playStatDecrease,
  playGameOver,
  playVictory,
  playClick,
  playHover,
  playError,
  playSuccess,
  testAllSounds,
};
