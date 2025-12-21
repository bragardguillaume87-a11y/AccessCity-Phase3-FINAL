// src/utils/pathUtils.js
// Normalise un chemin d'asset pour garantir un chemin absolu et cross-platform
export function toAbsoluteAssetPath(path) {
  if (!path) return "";
  // Remplace les backslashes par des slashes, supprime les slashes initiaux
  let normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return "/" + normalized;
}
