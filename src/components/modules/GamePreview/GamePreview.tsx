/**
 * GamePreview — Shell React du moteur de preview topdown
 *
 * Encapsule le moteur Excalibur dans un div container.
 * L'utilisateur choisit une carte parmi celles créées dans l'éditeur.
 *
 * Bridges :
 * - Dialogue trigger → ouvre PreviewModal VN (uiStore)
 * - Map exit → recharge la preview avec la nouvelle carte (local state)
 *
 * @module components/modules/GamePreview/GamePreview
 */

import { useState, useCallback } from 'react';
import { Play, Square, Map as MapIcon, Gamepad2 } from 'lucide-react';
import { useMapsStore } from '@/stores/mapsStore';
import { useUIStore } from '@/stores/uiStore';
import { useGameEngine } from './hooks/useGameEngine';

const CONTAINER_ID = 'excalibur-preview-container';

export default function GamePreview() {
  const maps = useMapsStore(s => s.maps);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(
    maps[0]?.id ?? null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);

  const setActiveModal = useUIStore(s => s.setActiveModal);
  const setModalContext = useUIStore(s => s.setModalContext);

  // Bridge callbacks
  const handleDialogueTrigger = useCallback((sceneId: string) => {
    setModalContext({ sceneId });
    setActiveModal('preview');
  }, [setActiveModal, setModalContext]);

  const handleMapExit = useCallback((targetMapId: string) => {
    // Restart the engine with the new map
    setActiveMapId(null);
    setTimeout(() => setActiveMapId(targetMapId), 50);
  }, []);

  // Engine lifecycle — only starts when activeMapId is set
  useGameEngine({
    containerId: CONTAINER_ID,
    selectedMapId: activeMapId,
    onDialogueTrigger: handleDialogueTrigger,
    onMapExit: handleMapExit,
  });

  function handlePlay() {
    if (!selectedMapId) return;
    setActiveMapId(selectedMapId);
    setIsRunning(true);
  }

  function handleStop() {
    setActiveMapId(null);
    setIsRunning(false);
  }

  // ── No maps available ─────────────────────────────────────────────────────

  if (maps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background select-none">
        <MapIcon size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-base)' }}>
          Aucune carte à prévisualiser
        </h2>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
          Créez d'abord une carte dans le module <strong>Carte 2D</strong>,
          puis revenez ici pour la jouer.
        </p>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0d0d1a' }}>

      {/* Controls bar */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-b border-border"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        <Gamepad2 size={16} style={{ color: 'var(--color-primary)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
          Prévisualisation
        </span>

        <div className="flex items-center gap-2 ml-2">
          <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Carte :</label>
          <select
            value={selectedMapId ?? ''}
            onChange={e => { setSelectedMapId(e.target.value || null); handleStop(); }}
            disabled={isRunning}
            className="text-xs px-2 py-1 rounded border border-border bg-transparent outline-none"
            style={{ color: 'var(--color-text-base)' }}
          >
            {maps.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {!isRunning ? (
            <button
              onClick={handlePlay}
              disabled={!selectedMapId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              style={{
                background: selectedMapId ? 'var(--color-primary)' : 'rgba(139,92,246,0.3)',
                color: 'white',
                cursor: selectedMapId ? 'pointer' : 'not-allowed',
              }}
            >
              <Play size={12} /> Lancer
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              style={{ background: 'rgba(239,68,68,0.8)', color: 'white' }}
            >
              <Square size={12} /> Arrêter
            </button>
          )}
        </div>

        {isRunning && (
          <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
            WASD ou ↑↓←→ pour déplacer le joueur
          </span>
        )}
      </div>

      {/* Game canvas container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Excalibur mounts its canvas here */}
        <div
          id={CONTAINER_ID}
          style={{ width: '100%', height: '100%', display: isRunning ? 'block' : 'none' }}
        />

        {/* Idle state when not running */}
        {!isRunning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 select-none">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.3)' }}
            >
              <Play size={28} style={{ color: 'var(--color-primary)', marginLeft: 3 }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Appuyez sur <strong>Lancer</strong> pour jouer la carte
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
