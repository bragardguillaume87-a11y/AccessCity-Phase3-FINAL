/**
 * generateStandaloneZip.ts — Génère un ZIP jouable depuis un ExportData.
 *
 * Structure du ZIP :
 *   [titre-projet]/
 *   ├── index.html        ← player.js + player.css inlinés + game data injectée
 *   └── assets/
 *       ├── backgrounds/
 *       ├── characters/
 *       └── audio/
 *
 * L'index.html est auto-suffisant (pas de fetch réseau externe).
 * Il fonctionne sur n'importe quel serveur HTTP statique.
 *
 * Pré-requis : `npm run build:player` doit avoir été exécuté une fois pour
 * générer public/player.js et public/player.css.
 */

import { zipSync, strToU8 } from 'fflate';
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
 * Réécrit les URLs d'assets dans un ExportData :
 *   /assets/backgrounds/xxx.png → ./assets/backgrounds/xxx.png
 *
 * Nécessaire pour que les chemins fonctionnent depuis le dossier ZIP.
 */
function rewriteAssetUrls(data: ExportData): ExportData {
  const json = JSON.stringify(data).replace(/\/assets\//g, './assets/');
  return JSON.parse(json) as ExportData;
}

/**
 * Génère l'HTML final du player standalone.
 * Inline le JS et le CSS pour éviter toute dépendance réseau.
 */
function generatePlayerHtml(
  playerJs: string,
  playerCss: string,
  data: ExportData,
  title: string
): string {
  const escapedTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // JSON.stringify est XSS-safe ici (pas de parser HTML côté jeu)
  const gameDataScript = `window.__GAME_DATA__=${JSON.stringify(data)};`;

  return `<!DOCTYPE html>
<html lang="${data.metadata.language}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapedTitle}</title>
  <style>${playerCss}</style>
</head>
<body style="margin:0;padding:0;background:#0a0a14;">
  <div id="root" style="width:100%;height:100vh;overflow:hidden;"></div>
  <script>${gameDataScript}</script>
  <script type="module">${playerJs}</script>
</body>
</html>`;
}

/**
 * Génère un ZIP standalone jouable depuis un ExportData.
 *
 * @param data - Données exportées (depuis buildExportData)
 * @param projectTitle - Titre du projet (utilisé pour le nom du dossier ZIP)
 * @returns Blob ZIP téléchargeable
 * @throws Error si player.js est introuvable (npm run build:player requis)
 */
export async function generateStandaloneZip(
  data: ExportData,
  projectTitle: string
): Promise<Blob> {
  // ── 1. Fetch le bundle player pré-buildé ──────────────────────────────────
  const [playerJsRes, playerCssRes] = await Promise.all([
    fetch('/player.js'),
    fetch('/player.css').catch(() => null),
  ]);

  if (!playerJsRes.ok) {
    throw new Error(
      'Bundle player introuvable (/player.js). ' +
      'Lancez "npm run build:player" puis relancez le dev server.'
    );
  }

  const [playerJs, playerCss] = await Promise.all([
    playerJsRes.text(),
    playerCssRes?.ok ? playerCssRes.text() : Promise.resolve(''),
  ]);

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
  const rewrittenData = rewriteAssetUrls(data);

  // ── 4. Générer l'HTML final ───────────────────────────────────────────────
  const html = generatePlayerHtml(playerJs, playerCss, rewrittenData, projectTitle);

  // ── 5. Construire la structure du ZIP ─────────────────────────────────────
  const folder = sanitizeFilename(projectTitle);
  const files: Record<string, Uint8Array> = {
    [`${folder}/index.html`]: strToU8(html),
  };

  for (const [url, buffer] of assetEntries) {
    // /assets/backgrounds/xxx.png → {folder}/assets/backgrounds/xxx.png
    const relativePath = url.startsWith('/') ? url.slice(1) : url;
    files[`${folder}/${relativePath}`] = buffer;
  }

  // ── 6. Compresser et retourner ────────────────────────────────────────────
  const zipped = zipSync(files, { level: 6 });
  // Cast explicite ArrayBufferLike → ArrayBuffer pour satisfaire le type BlobPart
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}
