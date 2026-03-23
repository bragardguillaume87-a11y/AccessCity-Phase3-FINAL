/**
 * backgroundRemoval.ts — Suppression de fond d'image
 *
 * Deux modes :
 * 1. IA   : @imgly/background-removal (ISNet fp16 ~80 MB, ONNX Runtime WebGPU)
 *            → lazy-import : le module n'est chargé qu'au 1er appel
 *            → fonctionne sur tout type de fond (photos, illustrations complexes)
 * 2. Chroma-key : flood-fill canvas natif (baguette magique, clic + tolérance)
 *            → instantané, 0 dépendance supplémentaire
 *            → idéal pour fonds unis ou captures d'écran
 *
 * @module utils/backgroundRemoval
 */

// ── AI — lazy-import @imgly/background-removal ─────────────────────────────

/**
 * Supprime le fond d'une image via l'IA (ISNet fp16).
 *
 * @param imageUrl - URL ou dataURL de l'image source
 * @returns Blob PNG avec canal alpha
 * @throws Error si le modèle ne peut pas être chargé
 */
export async function removeBackgroundAI(imageUrl: string): Promise<Blob> {
  // Lazy-import : ne charge le bundle ONNX qu'au 1er appel
  const { removeBackground } = await import('@imgly/background-removal');

  // Convertir l'URL en Blob si nécessaire
  let inputBlob: Blob;
  if (imageUrl.startsWith('data:')) {
    inputBlob = dataURLtoBlob(imageUrl);
  } else {
    const resp = await fetch(imageUrl);
    if (!resp.ok) throw new Error(`Impossible de charger l'image : ${imageUrl}`);
    inputBlob = await resp.blob();
  }

  const resultBlob = await removeBackground(inputBlob, {
    model: 'isnet_fp16',
    output: { format: 'image/png' },
  });

  return resultBlob;
}

// ── Chroma-key — flood-fill canvas natif ───────────────────────────────────

/**
 * Supprime un fond de couleur uniforme par flood-fill (baguette magique).
 *
 * @param imageUrl  - URL ou dataURL de l'image source
 * @param clickX    - Coordonnée X du clic dans l'image affichée (pixels CSS)
 * @param clickY    - Coordonnée Y du clic dans l'image affichée (pixels CSS)
 * @param displayW  - Largeur d'affichage de l'image (pour normaliser les coordonnées)
 * @param displayH  - Hauteur d'affichage de l'image (pour normaliser les coordonnées)
 * @param tolerance - Tolérance de couleur (0–100, défaut 30)
 * @returns Blob PNG avec canal alpha (fond effacé)
 */
export async function removeBackgroundChromaKey(
  imageUrl: string,
  clickX: number,
  clickY: number,
  displayW: number,
  displayH: number,
  tolerance = 30
): Promise<Blob> {
  const img = await loadImage(imageUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponible');

  ctx.drawImage(img, 0, 0);

  // Normaliser les coordonnées de clic (CSS → pixels image réels)
  const scaleX = img.naturalWidth / displayW;
  const scaleY = img.naturalHeight / displayH;
  const seedX = Math.round(clickX * scaleX);
  const seedY = Math.round(clickY * scaleY);

  floodFillErase(ctx, img.naturalWidth, img.naturalHeight, seedX, seedY, tolerance);

  return await canvasToBlob(canvas, 'image/png');
}

// ── Helpers internes ───────────────────────────────────────────────────────

/** Charge une Image à partir d'une URL (cross-origin supporté via CORS). */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossible de charger l'image : ${src}`));
    img.src = src;
  });
}

/** Converts a canvas to a Blob (image/png). */
function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Erreur lors de la conversion du canvas en Blob'));
    }, type);
  });
}

/** Converts a data URL to a Blob. */
function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Flood-fill BFS qui efface les pixels proches de la couleur du pixel seed.
 * Modifie l'ImageData du canvas en place.
 */
function floodFillErase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seedX: number,
  seedY: number,
  tolerance: number
): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const seedIdx = (seedY * w + seedX) * 4;
  const seedR = data[seedIdx];
  const seedG = data[seedIdx + 1];
  const seedB = data[seedIdx + 2];

  // Seuil : tolérance 0–100 → distance couleur 0–441 (max distance RGB)
  const threshold = (tolerance / 100) * 441;

  const visited = new Uint8Array(w * h);
  const queue: number[] = [];
  queue.push(seedY * w + seedX);
  visited[seedY * w + seedX] = 1;

  while (queue.length > 0) {
    const pos = queue.shift()!;
    const x = pos % w;
    const y = Math.floor(pos / w);
    const idx = pos * 4;

    // Calculer la distance couleur (Euclidienne RGB)
    const dr = data[idx] - seedR;
    const dg = data[idx + 1] - seedG;
    const db = data[idx + 2] - seedB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (dist > threshold) continue;

    // Effacer le pixel (alpha = 0)
    data[idx + 3] = 0;

    // Ajouter les voisins (4-connexité)
    const neighbors = [
      x > 0 ? pos - 1 : -1,
      x < w - 1 ? pos + 1 : -1,
      y > 0 ? pos - w : -1,
      y < h - 1 ? pos + w : -1,
    ];
    for (const n of neighbors) {
      if (n >= 0 && !visited[n]) {
        visited[n] = 1;
        queue.push(n);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convertit un Blob en dataURL (pour prévisualisation immédiate).
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Lecture Blob échouée'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Convertit un Blob traité en File réutilisable pour l'upload.
 * Le nom de fichier est adapté : extension → .png (toujours transparent).
 */
export function blobToFile(blob: Blob, originalFilename: string): File {
  const baseName = originalFilename.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.png`, { type: 'image/png' });
}
