/**
 * Systeme de son simple pour AccessCity
 * Sans dependances externes
 */

let isMuted = false;

/**
 * Jouer un son
 * @param {string} soundPath - Chemin vers le fichier son (ex: '/sounds/click.mp3')
 * @param {number} volume - Volume de 0 a 1 (defaut: 0.5)
 */
export function playSound(soundPath, volume = 0.5) {
  if (isMuted) {
    console.log('[Sound] Muted, son ignore:', soundPath);
    return;
  }
  
  try {
    const audio = new Audio(soundPath);
    audio.volume = Math.max(0, Math.min(1, volume));
    
    audio.play().catch(error => {
      // Ignore les erreurs (fichier manquant, autoplay bloque, etc.)
      console.warn('[Sound] Impossible de jouer:', soundPath, error.message);
    });
    
    console.log('[Sound] Joue:', soundPath);
  } catch (error) {
    console.warn('[Sound] Erreur:', error.message);
  }
}

/**
 * Activer/desactiver le son global
 * @param {boolean} mute - true pour mute, false pour unmute
 */
export function setMute(mute) {
  isMuted = mute;
  console.log('[Sound] Mute:', isMuted);
}

/**
 * Obtenir l'etat du mute
 * @returns {boolean}
 */
export function isSoundMuted() {
  return isMuted;
}

/**
 * Toggle mute (alterner)
 * @returns {boolean} - Nouvel etat
 */
export function toggleMute() {
  isMuted = !isMuted;
  console.log('[Sound] Mute toggled:', isMuted);
  return isMuted;
}
