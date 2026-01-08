/**
 * Normalise un chemin d'asset pour garantir un chemin absolu et cross-platform
 * @param path - Chemin relatif ou absolu de l'asset
 * @returns Chemin normalisé avec slash initial
 */
export function toAbsoluteAssetPath(path: string | null | undefined): string {
  if (!path) return "";
  // Remplace les backslashes par des slashes, supprime les slashes initiaux
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return "/" + normalized;
}
