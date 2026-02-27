/**
 * generateStandaloneExe.ts — Génère un dossier portable Windows depuis un ExportData.
 *
 * Structure du ZIP produit :
 *   [titre-projet]/
 *   ├── player.exe        ← binaire Tauri pré-buildé (fetché depuis /player-win.exe)
 *   ├── game-data.json    ← ExportData sérialisé (minifié)
 *   └── assets/
 *       ├── backgrounds/
 *       ├── characters/
 *       └── audio/
 *
 * Pré-requis : `npm run build:player-exe` doit avoir été exécuté une fois pour
 * générer src-tauri/target/release/accesscity-player.exe, puis copié dans public/player-win.exe.
 *
 * Double-clic sur player.exe → scénario jouable (Win 10/11, WebView2 natif).
 */

import { zipSync, strToU8 } from 'fflate';
import type { ZipOptions } from 'fflate';
import type { ExportData } from './exportProject';
import { collectAssetUrls } from './exportProject';

/** Nettoie un nom de fichier/dossier pour le système de fichiers. */
function sanitizeFilename(name: string): string {
  return (name || 'accesscity-game')
    .replace(/[^a-z0-9\-_ ]/gi, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 64);
}

/**
 * Réécrit les URLs d'assets dans un ExportData pour le mode exe :
 *   /assets/backgrounds/xxx.png → assets/backgrounds/xxx.png
 *
 * La réécriture finale (assets/ → asset://localhost/chemin/absolu) est faite
 * au runtime dans main-player-tauri.tsx via convertFileSrc().
 */
function rewriteAssetUrlsForExe(data: ExportData): ExportData {
  const json = JSON.stringify(data).replace(/\/assets\//g, 'assets/');
  return JSON.parse(json) as ExportData;
}

/**
 * Génère un ZIP contenant un dossier portable Windows.
 *
 * @param data         - Données exportées (depuis buildExportData)
 * @param projectTitle - Titre du projet (utilisé pour le nom du dossier ZIP)
 * @returns Blob ZIP téléchargeable
 * @throws Error si player-win.exe est introuvable (npm run build:player-exe requis)
 */
export async function generateStandaloneExe(
  data: ExportData,
  projectTitle: string
): Promise<Blob> {
  // ── 1. Fetch le binaire player pré-buildé ─────────────────────────────────
  const exeRes = await fetch('/player-win.exe');

  if (!exeRes.ok) {
    throw new Error(
      'Binaire player introuvable (/player-win.exe). ' +
      'Lancez "npm run build:player-exe" puis copiez ' +
      'src-tauri/target/release/accesscity-player.exe → public/player-win.exe'
    );
  }

  const exeBuffer = await exeRes.arrayBuffer();

  // ── 2. Collecter et fetcher les assets référencés ─────────────────────────
  const assetUrls = collectAssetUrls(data);
  const assetEntries: Array<[string, Uint8Array]> = [];

  await Promise.all(
    assetUrls.map(async (url) => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          assetEntries.push([url, new Uint8Array(buffer)]);
        }
      } catch {
        // Asset inaccessible — ignoré (le jeu fonctionnera sans)
      }
    })
  );

  // ── 3. Réécrire les URLs dans les données ─────────────────────────────────
  const rewrittenData = rewriteAssetUrlsForExe(data);

  // ── 4. Sérialiser game-data.json (minifié) ────────────────────────────────
  const gameDataJson = JSON.stringify(rewrittenData);

  // ── 5. Construire la structure du ZIP avec compression par type ───────────
  //       player.exe est déjà un PE compressé → level:0 (gain nul, coût élevé)
  //       JSON et assets → level:6 (gain significatif)
  const folder = sanitizeFilename(projectTitle);

  type ZipEntry = [Uint8Array, ZipOptions];
  const files: Record<string, ZipEntry> = {
    [`${folder}/player.exe`]:     [new Uint8Array(exeBuffer), { level: 0 }],
    [`${folder}/game-data.json`]: [strToU8(gameDataJson),     { level: 6 }],
  };

  for (const [url, buffer] of assetEntries) {
    // /assets/backgrounds/xxx.png → {folder}/assets/backgrounds/xxx.png
    const relativePath = url.startsWith('/') ? url.slice(1) : url;
    files[`${folder}/${relativePath}`] = [buffer, { level: 6 }];
  }

  // ── 6. Compresser et retourner ────────────────────────────────────────────
  const zipped = zipSync(files);
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}
