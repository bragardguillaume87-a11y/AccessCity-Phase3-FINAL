/**
 * tileCollisionScan — Détection auto-collision par analyse des pixels alpha.
 *
 * Scanne les pixels d'une tuile (ou d'une cellule dans un sheet) et détermine
 * si la cellule est "solide" (suffisamment opaque) pour mériter une collision.
 *
 * Résultats mis en cache module-level pour éviter de rescanner lors des
 * paints successifs (drag de pinceau).
 *
 * @module utils/tileCollisionScan
 */

// ── Cache module-level ─────────────────────────────────────────────────────
// key → true = solide, false = transparent
const cellCache = new Map<string, boolean>();

function makeCacheKey(
  src: string,
  tileX: number,
  tileY: number,
  tileW: number,
  tileH: number,
  threshold: number
): string {
  return `${src}|${tileX},${tileY},${tileW},${tileH}|${threshold}`;
}

// ── Image loader avec cache ────────────────────────────────────────────────
const imgCache = new Map<string, HTMLImageElement>();

function loadImageCached(url: string): Promise<HTMLImageElement> {
  const cached = imgCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imgCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`tileCollisionScan: failed to load ${url}`));
    img.src = url;
  });
}

// ── API publique ───────────────────────────────────────────────────────────

/**
 * Retourne le résultat de cache (synchrone).
 * null = pas encore scanné (scan en cours ou pas encore lancé).
 */
export function getCachedCellCollision(
  src: string,
  tileX: number,
  tileY: number,
  tileW: number,
  tileH: number,
  threshold = 0.25
): boolean | null {
  const key = makeCacheKey(src, tileX, tileY, tileW, tileH, threshold);
  const val = cellCache.get(key);
  return val !== undefined ? val : null;
}

/**
 * Scanne une cellule individuellement (async).
 * Résultat en cache pour les prochains accès.
 *
 * @param src      - URL display-ready de l'image source
 * @param tileX    - Offset X dans le sheet (0 si image entière)
 * @param tileY    - Offset Y dans le sheet
 * @param tileW    - Largeur de la tuile en px (0 = image entière)
 * @param tileH    - Hauteur de la tuile en px (0 = image entière)
 * @param threshold - % min de pixels opaques pour considérer la cellule solide (défaut 0.25)
 * @returns true si la cellule est solide
 */
export async function scanCellCollisionAsync(
  src: string,
  tileX: number,
  tileY: number,
  tileW: number,
  tileH: number,
  threshold = 0.25
): Promise<boolean> {
  const key = makeCacheKey(src, tileX, tileY, tileW, tileH, threshold);
  const cached = cellCache.get(key);
  if (cached !== undefined) return cached;

  try {
    const img = await loadImageCached(src);

    const srcX = tileW > 0 ? tileX : 0;
    const srcY = tileH > 0 ? tileY : 0;
    const srcW = tileW > 0 ? tileW : img.naturalWidth;
    const srcH = tileH > 0 ? tileH : img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      cellCache.set(key, true); // fallback: considérer solide
      return true;
    }

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
    const imageData = ctx.getImageData(0, 0, srcW, srcH);
    const data = imageData.data;

    let opaqueCount = 0;
    const total = srcW * srcH;
    // Canal alpha = data[i * 4 + 3]
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 10) opaqueCount++;
    }

    const isSolid = total > 0 && opaqueCount / total >= threshold;
    cellCache.set(key, isSolid);
    return isSolid;
  } catch {
    // Erreur de chargement (ex: CORS) → fallback solide pour ne pas rater de collision
    cellCache.set(key, true);
    return true;
  }
}

/**
 * Pré-chauffe le cache pour une région entière (rCols × rRows cellules).
 * À appeler dès la sélection d'une tuile dans la palette pour que
 * le premier paint soit synchrone.
 */
export function prewarmRegionCache(
  src: string,
  tileX: number,
  tileY: number,
  tileW: number,
  tileH: number,
  stepX: number,
  stepY: number,
  rCols: number,
  rRows: number,
  threshold = 0.25
): void {
  for (let dr = 0; dr < rRows; dr++) {
    for (let dc = 0; dc < rCols; dc++) {
      const cellTileX = tileW > 0 ? tileX + dc * stepX : 0;
      const cellTileY = tileH > 0 ? tileY + dr * stepY : 0;
      const key = makeCacheKey(src, cellTileX, cellTileY, tileW, tileH, threshold);
      if (!cellCache.has(key)) {
        // Fire and forget — résultat disponible dans le cache en ~50ms
        scanCellCollisionAsync(src, cellTileX, cellTileY, tileW, tileH, threshold).catch(
          () => undefined
        );
      }
    }
  }
}
