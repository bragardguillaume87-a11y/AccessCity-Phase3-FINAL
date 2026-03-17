/**
 * generateProjectBackupZip.ts — Génère un ZIP de sauvegarde portable du projet complet.
 *
 * Structure du ZIP :
 *   {titre}-portable/
 *   ├── project-backup.json  ← snapshot de tous les stores (scènes, cartes, personnages…)
 *   ├── assets-manifest.json ← index des assets uploadés
 *   └── assets/              ← tous les fichiers référencés (tilesets, sprites, sons, images…)
 *
 * Détection d'URLs compatible web ET Tauri :
 *   - Mode web  : "/assets/tilesets/foo.png"
 *   - Mode Tauri (Windows) : "https://asset.localhost/C:/Users/.../assets/tilesets/foo.png"
 *   - Mode Tauri (Linux/macOS) : "asset://localhost/home/user/.../assets/tilesets/foo.png"
 *
 * @module utils/generateProjectBackupZip
 */

import { zipSync, strToU8 } from 'fflate';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssetEntry {
  /** URL à fetcher (fonctionne dans le contexte WebView courant) */
  fetchUrl: string;
  /** Chemin relatif dans le ZIP, ex: "assets/tilesets/foo.png" */
  zipPath: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrait toutes les URLs d'assets présentes dans la chaîne JSON.
 * Compatible mode web (/assets/...) et mode Tauri (https://asset.localhost/... ou asset://...).
 */
function extractAssetUrlsFromJson(json: string): AssetEntry[] {
  const seen = new Set<string>();
  const results: AssetEntry[] = [];

  const add = (fetchUrl: string, zipPath: string) => {
    if (!seen.has(fetchUrl)) {
      seen.add(fetchUrl);
      results.push({ fetchUrl, zipPath });
    }
  };

  // ── Mode web : "/assets/tilesets/foo.png" ─────────────────────────────────
  for (const m of json.matchAll(/"(\/assets\/[^"?#\s]+)"/g)) {
    add(m[1], m[1].slice(1)); // /assets/... → assets/...
  }

  // ── Mode Tauri Windows : "https://asset.localhost/C:/Users/.../assets/foo" ─
  for (const m of json.matchAll(/"(https:\/\/asset\.localhost\/[^"?#\s]+)"/g)) {
    const url = m[1];
    const assetsIdx = url.indexOf('/assets/');
    if (assetsIdx >= 0) {
      add(url, url.slice(assetsIdx + 1)); // → assets/...
    }
  }

  // ── Mode Tauri Linux/macOS : "asset://localhost/home/user/.../assets/foo" ──
  for (const m of json.matchAll(/"(asset:\/\/localhost\/[^"?#\s]+)"/g)) {
    const url = m[1];
    const assetsIdx = url.indexOf('/assets/');
    if (assetsIdx >= 0) {
      add(url, url.slice(assetsIdx + 1)); // → assets/...
    }
  }

  return results;
}

function sanitizeSlug(title: string): string {
  return (title || 'accesscity')
    .replace(/[^a-z0-9\-_ ]/gi, '-')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 48);
}

// ── Export principal ──────────────────────────────────────────────────────────

/**
 * Génère un ZIP de sauvegarde portable contenant le snapshot du projet
 * et tous les assets qu'il référence (mode web et Tauri).
 *
 * @param backupData   - Objet de sauvegarde complet (tous les stores fusionnés)
 * @param projectTitle - Titre du projet (utilisé pour le nom du dossier ZIP)
 * @returns Blob ZIP téléchargeable
 */
export async function generateProjectBackupZip(
  backupData: object,
  projectTitle: string
): Promise<Blob> {
  const json = JSON.stringify(backupData, null, 2);

  // ── 1. Détecter toutes les URLs d'assets référencées ──────────────────────
  const assetEntries = extractAssetUrlsFromJson(json);

  // ── 2. Fetcher les fichiers assets en parallèle ───────────────────────────
  const fetchedAssets: Array<[string, Uint8Array]> = [];
  await Promise.all(
    assetEntries.map(async ({ fetchUrl, zipPath }) => {
      try {
        const res = await fetch(fetchUrl);
        if (res.ok) {
          fetchedAssets.push([zipPath, new Uint8Array(await res.arrayBuffer())]);
        }
      } catch {
        // Asset inaccessible — ignoré silencieusement
      }
    })
  );

  // ── 3. Fetcher le manifeste assets ────────────────────────────────────────
  let manifestBytes: Uint8Array | null = null;
  try {
    const res = await fetch('/assets-manifest.json');
    if (res.ok) manifestBytes = new Uint8Array(await res.arrayBuffer());
  } catch {
    /* ignoré */
  }

  // ── 4. Construire la structure du ZIP ─────────────────────────────────────
  const folder = `${sanitizeSlug(projectTitle)}-portable`;

  const files: Record<string, Uint8Array> = {
    [`${folder}/project-backup.json`]: strToU8(json),
  };

  if (manifestBytes) {
    files[`${folder}/assets-manifest.json`] = manifestBytes;
  }

  for (const [zipPath, buffer] of fetchedAssets) {
    files[`${folder}/${zipPath}`] = buffer; // ex: {folder}/assets/tilesets/foo.png
  }

  // ── 5. Compresser et retourner ────────────────────────────────────────────
  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}
