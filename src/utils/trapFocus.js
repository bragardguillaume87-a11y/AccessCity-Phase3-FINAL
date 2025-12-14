/**
 * Piège le focus dans un élément (utile pour les modales et dialogues)
 * @param {HTMLElement} element - L'élément dans lequel piéger le focus
 * @returns {function} Fonction de nettoyage pour retirer les listeners
 */
export function trapFocus(element) {
  if (!element) return () => {};

  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusableElements = element.querySelectorAll(focusableSelector);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);

  // Mettre le focus sur le premier élément focusable
  firstFocusable?.focus();

  // Retourner la fonction de nettoyage
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

export default trapFocus;
