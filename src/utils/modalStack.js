/**
 * Modal Stack Manager - Singleton pour gérer les modales imbriquées
 *
 * Permet de gérer correctement la touche Escape lorsque plusieurs modales
 * sont ouvertes simultanément (modales imbriquées).
 *
 * Principe : Seule la modale en haut de la stack (la plus récente) peut être fermée
 * avec la touche Escape, les autres modales en arrière-plan restent ouvertes.
 */

class ModalStack {
  constructor() {
    this.stack = [];
  }

  /**
   * Enregistre une modale dans la stack
   * @param {string} modalId - Identifiant unique de la modale
   */
  push(modalId) {
    if (!this.stack.includes(modalId)) {
      this.stack.push(modalId);
      console.log(`[ModalStack] Pushed: ${modalId}, stack:`, this.stack);
    }
  }

  /**
   * Retire une modale de la stack
   * @param {string} modalId - Identifiant unique de la modale
   */
  pop(modalId) {
    const index = this.stack.indexOf(modalId);
    if (index !== -1) {
      this.stack.splice(index, 1);
      console.log(`[ModalStack] Popped: ${modalId}, stack:`, this.stack);
    }
  }

  /**
   * Vérifie si une modale est en haut de la stack (la plus récente)
   * @param {string} modalId - Identifiant unique de la modale
   * @returns {boolean} true si la modale est en haut de la stack
   */
  isTop(modalId) {
    return this.stack.length > 0 && this.stack[this.stack.length - 1] === modalId;
  }

  /**
   * Retourne la modale en haut de la stack
   * @returns {string|null} L'ID de la modale en haut, ou null si stack vide
   */
  getTop() {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }

  /**
   * Réinitialise la stack (pour debugging ou cleanup global)
   */
  clear() {
    this.stack = [];
    console.log('[ModalStack] Cleared');
  }
}

// Singleton instance
const modalStack = new ModalStack();

export default modalStack;
