/**
 * main-player-tauri.tsx — Entry point du player Tauri (Windows exe).
 *
 * Différence avec main-player.tsx (ZIP HTML) :
 *  - window.__GAME_DATA__ n'est PAS disponible au démarrage
 *  - Les données viennent de invoke('read_game_data') → Rust lit game-data.json
 *  - Les URLs d'assets sont réécrites via convertFileSrc() pour le protocole asset://
 *  - Un état de chargement est affiché pendant la lecture disque
 *
 * PlayerApp est monté UNIQUEMENT après que window.__GAME_DATA__ est prêt.
 * PlayerApp lui-même reste non-modifié.
 */

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { PlayerApp } from './PlayerApp';
import type { ExportData } from '@/utils/exportProject';
import './index.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

function TauriPlayerRoot() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    Promise.all([
      invoke<string>('read_game_data'),
      invoke<string>('get_exe_dir'),
    ])
      .then(([jsonString, exeDir]) => {
        const data = JSON.parse(jsonString) as ExportData;
        // Injecter les données avec URLs réécrites AVANT de monter PlayerApp
        // (PlayerApp lit window.__GAME_DATA__ synchronement au render)
        window.__GAME_DATA__ = rewriteForTauri(data, exeDir);
        setLoadState({ status: 'ready' });
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message
          : typeof err === 'string' ? err
          : 'Erreur inconnue';
        setLoadState({ status: 'error', message });
      });
  }, []);

  if (loadState.status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a14',
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        gap: '12px',
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 20,
          height: 20,
          border: '2px solid rgba(255,255,255,0.15)',
          borderTop: '2px solid rgba(255,255,255,0.6)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        Chargement…
      </div>
    );
  }

  if (loadState.status === 'error') {
    return (
      <div style={{
        padding: '2rem',
        color: '#f87171',
        background: '#0a0a14',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <h1 style={{ color: 'white', marginBottom: '1rem' }}>
          Impossible de charger le jeu
        </h1>
        <p>{loadState.message}</p>
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
          Vérifiez que <strong style={{ color: 'rgba(255,255,255,0.6)' }}>game-data.json</strong>{' '}
          se trouve dans le même dossier que player.exe.
        </p>
      </div>
    );
  }

  // status === 'ready' — window.__GAME_DATA__ est garanti défini
  return <PlayerApp />;
}

/**
 * Réécrit les URLs d'assets dans ExportData pour les rendre accessibles
 * depuis le WebView2 via le protocole asset://.
 *
 * Avant : "assets/backgrounds/foo.png"
 * Après : "asset://localhost/C:/chemin/absolu/assets/backgrounds/foo.png"
 *
 * @param data    ExportData avec URLs relatives (format généré par generateStandaloneExe)
 * @param exeDir  Chemin absolu du répertoire contenant player.exe
 */
function rewriteForTauri(data: ExportData, exeDir: string): ExportData {
  const sep = exeDir.includes('\\') ? '\\' : '/';
  const json = JSON.stringify(data).replace(
    /"(assets\/[^"]+)"/g,
    (_match: string, relPath: string) => {
      const absPath = exeDir + sep + relPath.replace(/\//g, sep);
      return `"${convertFileSrc(absPath)}"`;
    }
  );
  return JSON.parse(json) as ExportData;
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <TauriPlayerRoot />
    </StrictMode>
  );
}
