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
 *
 * Debug overlay : bouton [D] en bas à gauche ou Ctrl+Shift+D
 *   → affiche exeDir, URLs réécrites, test fetch pour diagnostiquer les assets.
 */

import { StrictMode, useEffect, useState, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { PlayerApp } from './PlayerApp';
import type { ExportData } from '@/utils/exportProject';
import './index.css';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type LoadState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

interface DebugInfo {
  exeDir: string;
  sampleUrls: string[];
}

interface FetchResult {
  url: string;
  status: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Composant principal
// ──────────────────────────────────────────────────────────────────────────────

function TauriPlayerRoot() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [fetchResults, setFetchResults] = useState<FetchResult[]>([]);
  const debugInfoRef = useRef<DebugInfo | null>(null);

  // Raccourci Ctrl+Shift+D
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    Promise.all([
      invoke<string>('read_game_data'),
      invoke<string>('get_exe_dir'),
    ])
      .then(([jsonString, exeDir]) => {
        const data = JSON.parse(jsonString) as ExportData;
        const rewritten = rewriteForTauri(data, exeDir);

        // Injecter les données AVANT de monter PlayerApp
        // (PlayerApp lit window.__GAME_DATA__ synchronement au render)
        window.__GAME_DATA__ = rewritten;

        // Stocker infos debug
        const info: DebugInfo = {
          exeDir,
          sampleUrls: extractSampleUrls(rewritten, 5),
        };
        debugInfoRef.current = info;
        setDebugInfo(info);
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

  const handleTestFetch = useCallback(async () => {
    const info = debugInfoRef.current;
    if (!info || info.sampleUrls.length === 0) return;
    const results: FetchResult[] = [];
    for (const url of info.sampleUrls.slice(0, 3)) {
      try {
        const res = await fetch(url);
        results.push({ url, status: `${res.status} ${res.ok ? 'OK' : 'ERR'}` });
      } catch (e) {
        results.push({ url, status: `ERREUR: ${e instanceof Error ? e.message : String(e)}` });
      }
    }
    setFetchResults(results);
  }, []);

  const handleCopyAll = useCallback(() => {
    const info = debugInfoRef.current;
    if (!info) return;
    const payload = JSON.stringify({ ...info, fetchResults }, null, 2);
    navigator.clipboard.writeText(payload).catch(() => undefined);
  }, [fetchResults]);

  // ── État : chargement ────────────────────────────────────────────────────

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

  // ── État : erreur ────────────────────────────────────────────────────────

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

  // ── État : ready ─────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <PlayerApp />

      {/* Bouton debug discret */}
      <button
        onClick={() => setDebugOpen(prev => !prev)}
        title="Debug overlay (Ctrl+Shift+D)"
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          width: '22px',
          height: '22px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '4px',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '10px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
        }}
      >
        D
      </button>

      {/* Panneau debug */}
      {debugOpen && debugInfo && (
        <DebugPanel
          info={debugInfo}
          fetchResults={fetchResults}
          onTestFetch={handleTestFetch}
          onCopyAll={handleCopyAll}
          onClose={() => setDebugOpen(false)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Panneau debug
// ──────────────────────────────────────────────────────────────────────────────

interface DebugPanelProps {
  info: DebugInfo;
  fetchResults: FetchResult[];
  onTestFetch: () => void;
  onCopyAll: () => void;
  onClose: () => void;
}

function DebugPanel({ info, fetchResults, onTestFetch, onCopyAll, onClose }: DebugPanelProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '40px',
      left: '8px',
      width: '430px',
      maxHeight: '78vh',
      overflowY: 'auto',
      background: '#0d0d1a',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '8px',
      padding: '14px',
      fontFamily: 'monospace',
      fontSize: '11px',
      color: 'rgba(255,255,255,0.75)',
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: '12px' }}>
          DEBUG — AccessCity Player
        </span>
        <button onClick={onClose} style={btnStyle}>✕</button>
      </div>

      {/* exeDir */}
      <DebugSection label="Répertoire exe (exeDir)">
        <div style={valueStyle}>{info.exeDir || '(vide — invoke a échoué ?)'}</div>
      </DebugSection>

      {/* Sample URLs */}
      <DebugSection label={`URLs assets après réécriture (${info.sampleUrls.length} exemples)`}>
        {info.sampleUrls.length === 0 ? (
          <div style={{ ...valueStyle, color: '#f87171' }}>
            Aucun asset trouvé dans game-data.json
          </div>
        ) : (
          <div style={valueStyle}>
            {info.sampleUrls.map((url, i) => (
              <div key={i} style={{
                marginBottom: '3px',
                color: url.startsWith('asset://') ? '#86efac' : '#fbbf24',
              }}>
                {url}
              </div>
            ))}
          </div>
        )}
      </DebugSection>

      {/* Test fetch */}
      <DebugSection label="Test fetch (3 premiers assets)">
        <button style={{ ...btnStyle, marginBottom: '6px' }} onClick={onTestFetch}>
          Lancer le test
        </button>
        {fetchResults.length > 0 && (
          <div style={valueStyle}>
            {fetchResults.map((r, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                <span style={{ color: r.status.startsWith('2') ? '#86efac' : '#f87171' }}>
                  [{r.status}]
                </span>
                {' '}
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {r.url.length > 60 ? '…' + r.url.slice(-55) : r.url}
                </span>
              </div>
            ))}
          </div>
        )}
      </DebugSection>

      {/* Aide lecture */}
      <DebugSection label="Lecture des résultats">
        <div style={{ ...valueStyle, color: 'rgba(255,255,255,0.4)', lineHeight: '1.65' }}>
          <span style={{ color: '#86efac' }}>Vert</span> = asset:// → protocole OK{'\n'}
          <span style={{ color: '#fbbf24' }}>Jaune</span> = URL non réécrite → bug rewriteForTauri{'\n'}
          fetch ERREUR = scope $APPDIR ou permission manquante
        </div>
      </DebugSection>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
        <button style={btnStyle} onClick={onCopyAll}>
          Copier tout (JSON)
        </button>
      </div>

      <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>
        Ctrl+Shift+D pour fermer
      </div>
    </div>
  );
}

function DebugSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        color: 'rgba(255,255,255,0.35)',
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        fontSize: '10px',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '4px',
  color: 'rgba(255,255,255,0.65)',
  padding: '3px 10px',
  cursor: 'pointer',
  fontSize: '11px',
  fontFamily: 'monospace',
};

const valueStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '4px',
  padding: '6px 8px',
  wordBreak: 'break-all',
  lineHeight: '1.5',
  whiteSpace: 'pre-wrap',
};

// ──────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ──────────────────────────────────────────────────────────────────────────────

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

/**
 * Extrait un échantillon d'URLs d'assets depuis un ExportData réécrit,
 * pour affichage dans le debug overlay.
 */
function extractSampleUrls(data: ExportData, limit: number): string[] {
  const json = JSON.stringify(data);
  const matches = json.match(/"((?:asset:\/\/|assets\/)[^"]+)"/g) ?? [];
  const urls = matches
    .map(m => m.replace(/^"|"$/g, ''))
    .filter((v, i, arr) => arr.indexOf(v) === i); // dédupliquer
  return urls.slice(0, limit);
}

// ──────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ──────────────────────────────────────────────────────────────────────────────

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <TauriPlayerRoot />
    </StrictMode>
  );
}
