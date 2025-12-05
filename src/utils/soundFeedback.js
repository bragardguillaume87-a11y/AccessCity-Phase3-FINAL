// utils/soundFeedback.js
// Système de feedback sonore pour AccessCity

// État global du son
let globalMuted = false;
let globalVolume = 0.7; // Volume par défaut à 70%

/**
 * Active ou désactive le son globalement
 * @param {boolean} muted - true pour couper le son, false pour l'activer
 */
export function setGlobalMute(muted) {
  globalMuted = muted;
  console.log(`[Sound] Mute: ${muted}`);
}

/**
 * Obtenir l'état actuel du mute
 * @returns {boolean}
 */
export function isGlobalMuted() {
  return globalMuted;
}

/**
 * Définir le volume global (0.0 à 1.0)
 * @param {number} volume - Volume entre 0 et 1
 */
export function setGlobalVolume(volume) {
  globalVolume = Math.max(0, Math.min(1, volume));
  console.log(`[Sound] Volume: ${(globalVolume * 100).toFixed(0)}%`);
}

/**
 * Obtenir le volume actuel
 * @returns {number}
 */
export function getGlobalVolume() {
  return globalVolume;
}

/**
 * Fonction interne pour jouer un son
 * @param {string} path - Chemin vers le fichier audio
 * @param {number} volumeMultiplier - Multiplicateur de volume (optionnel)
 */
function playAudio(path, volumeMultiplier = 1.0) {
  if (globalMuted) {
    console.log(`[Sound] Skipped (muted): ${path}`);
    return;
  }
  
  try {
    const audio = new Audio(path);
    audio.volume = globalVolume * volumeMultiplier;
    
    audio.play().catch(err => {
      console.warn(`[Sound] Failed to play ${path}:`, err.message);
    });
    
    console.log(`[Sound] Playing: ${path} (volume: ${(audio.volume * 100).toFixed(0)}%)`);
  } catch (error) {
    console.error(`[Sound] Error creating audio for ${path}:`, error);
  }
}

// ========== Sons de dialogue ==========

/**
 * Son joué quand un dialogue apparaît
 */
export function playDialogue() {
  playAudio('/sounds/dialogue.mp3', 0.8);
}

/**
 * Son joué quand le joueur fait un choix
 */
export function playChoice() {
  playAudio('/sounds/choice.mp3', 0.9);
}

// ========== Sons de scène ==========

/**
 * Son joué lors d'un changement de scène
 */
export function playSceneChange() {
  playAudio('/sounds/scene-change.mp3', 0.7);
}

// ========== Sons de statistiques ==========

/**
 * Son joué quand une variable augmente
 */
export function playStatIncrease() {
  playAudio('/sounds/stat-up.mp3', 0.8);
}

/**
 * Son joué quand une variable diminue
 */
export function playStatDecrease() {
  playAudio('/sounds/stat-down.mp3', 0.8);
}

// ========== Sons de fin de jeu ==========

/**
 * Son joué en cas de game over
 */
export function playGameOver() {
  playAudio('/sounds/game-over.mp3', 1.0);
}

/**
 * Son joué en cas de victoire
 */
export function playVictory() {
  playAudio('/sounds/victory.mp3', 1.0);
}

// ========== Sons UI ==========

/**
 * Son de clic générique
 */
export function playClick() {
  playAudio('/sounds/click.mp3', 0.5);
}

/**
 * Son de hover sur bouton
 */
export function playHover() {
  playAudio('/sounds/hover.mp3', 0.3);
}

/**
 * Son d'erreur
 */
export function playError() {
  playAudio('/sounds/error.mp3', 0.8);
}

/**
 * Son de succès
 */
export function playSuccess() {
  playAudio('/sounds/success.mp3', 0.8);
}

// ========== Utilitaires de test ==========

/**
 * Teste tous les sons disponibles
 */
export function testAllSounds() {
  const sounds = [
    'dialogue', 'choice', 'scene-change',
    'stat-up', 'stat-down',
    'game-over', 'victory',
    'click', 'hover', 'error', 'success'
  ];
  
  console.log('[Sound] Testing all sounds...');
  
  sounds.forEach((sound, index) => {
    setTimeout(() => {
      playAudio(`/sounds/${sound}.mp3`);
    }, index * 500);
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
  testAllSounds
};