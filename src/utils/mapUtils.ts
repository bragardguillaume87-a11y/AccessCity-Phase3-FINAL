/**
 * Utilitaires de conversion coordonnées tuile ↔ pixels
 * pour les éditeurs de cartes (TriggerZonePanel, MapCanvas).
 */

/** Convertit des pixels en coordonnée de tuile (arrondie) */
export function pixelToTile(px: number, tileSize: number): number {
  return Math.round(px / tileSize);
}

/** Convertit une coordonnée de tuile en pixels */
export function tileToPixel(tile: number, tileSize: number): number {
  return tile * tileSize;
}
