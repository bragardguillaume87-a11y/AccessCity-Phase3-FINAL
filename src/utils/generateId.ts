/**
 * generateId — générateur d'identifiants uniques centralisé
 *
 * Utilise crypto.randomUUID() en priorité (Chrome 92+, Firefox 95+,
 * Safari 15.4+, Edge 92+, Tauri WebView2).
 * Repli sur timestamp + performance.now + Math.random pour les
 * environnements sans crypto.
 *
 * @param prefix - Préfixe sémantique (ex: 'scene', 'dialogue', 'choice')
 * @returns ID unique sous la forme `prefix-<uuid ou timestamp-random>`
 */
export function generateId(prefix = 'item'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  // Fallback pour environnements sans crypto.randomUUID
  const timestamp = Date.now();
  const perfNow = typeof performance !== 'undefined' ? performance.now() : 0;
  const random = Math.random().toString(36).substr(2, 12);

  return `${prefix}-${timestamp}-${perfNow.toFixed(0)}-${random}`;
}
