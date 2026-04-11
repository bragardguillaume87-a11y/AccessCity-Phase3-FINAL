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

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Gamepad2 } from 'lucide-react';
import { useMapsStore } from '@/stores/mapsStore';
import { useUIStore } from '@/stores/uiStore';
import { useGameEngine } from './hooks/useGameEngine';
import type { TransitionType } from './DialogueBridge';
import SceneEffectCanvas from '@/components/ui/SceneEffectCanvas';

const CONTAINER_ID = 'excalibur-preview-container';

export default function GamePreview() {
  const maps = useMapsStore((s) => s.maps);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(maps[0]?.id ?? null);
  // Auto-démarre dès qu'une carte est disponible (pas d'écran "Lancer" intermédiaire)
  const [isRunning, setIsRunning] = useState(() => maps.length > 0);
  const [activeMapId, setActiveMapId] = useState<string | null>(() => maps[0]?.id ?? null);
  const [initialPlayerPos, setInitialPlayerPos] = useState<{ x: number; y: number } | undefined>(
    undefined
  );

  // Effet atmosphérique de la carte active (synchronisé avec SceneEffectCanvas du VN editor)
  const activeMapEffect = activeMapId
    ? maps.find((m) => m.id === activeMapId)?.sceneEffect
    : undefined;

  const setActiveModal = useUIStore((s) => s.setActiveModal);
  const setModalContext = useUIStore((s) => s.setModalContext);
  const activeModal = useUIStore((s) => s.activeModal);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  // Tracks whether the current dialogue modal was opened from a game trigger
  const dialoguePendingRef = useRef(false);
  // Stores the scene ID while the transition is in progress
  const pendingSceneRef = useRef<string | null>(null);
  // Current transition being played ('none' means open the modal instantly)
  const [activeTransition, setActiveTransition] = useState<TransitionType | null>(null);

  // Interact-mode trigger zone overlays
  const [showInteractPrompt, setShowInteractPrompt] = useState(false);
  const [signPopupText, setSignPopupText] = useState<string | null>(null);

  // Bridge callbacks
  const handleDialogueTrigger = useCallback(
    (sceneId: string, transitionType: TransitionType) => {
      dialoguePendingRef.current = true;
      pendingSceneRef.current = sceneId;
      if (transitionType === 'none') {
        // Instant cut — open the modal immediately
        setModalContext({ sceneId });
        setActiveModal('preview');
        pendingSceneRef.current = null;
      } else {
        setActiveTransition(transitionType);
      }
    },
    [setActiveModal, setModalContext]
  );

  const handleMapExit = useCallback((targetMapId: string, targetPos: { x: number; y: number }) => {
    setActiveMapId(null);
    setInitialPlayerPos(targetPos);
    setTimeout(() => setActiveMapId(targetMapId), 50);
  }, []);

  // Reset overlays when engine is stopped
  useEffect(() => {
    if (!isRunning) {
      setShowInteractPrompt(false);
      setSignPopupText(null);
    }
  }, [isRunning]);

  // Engine lifecycle — only starts when activeMapId is set
  const { bridgeRef } = useGameEngine({
    containerId: CONTAINER_ID,
    selectedMapId: activeMapId,
    onDialogueTrigger: handleDialogueTrigger,
    onMapExit: handleMapExit,
    initialPlayerPos,
    onShowInteractPrompt: useCallback(() => setShowInteractPrompt(true), []),
    onHideInteractPrompt: useCallback(() => setShowInteractPrompt(false), []),
    onShowSignPopup: useCallback((text: string) => setSignPopupText(text), []),
    onHideSignPopup: useCallback(() => setSignPopupText(null), []),
  });

  // Resume engine when dialogue modal is closed (fix: engine was stopped but never resumed)
  useEffect(() => {
    if (activeModal !== 'preview' && dialoguePendingRef.current) {
      dialoguePendingRef.current = false;
      bridgeRef.current?.resumeAfterDialogue();
    }
  }, [activeModal, bridgeRef]);

  // Called when the transition overlay finishes animating in → open the modal
  const handleTransitionComplete = useCallback(() => {
    if (!activeTransition) return;
    const sceneId = pendingSceneRef.current;
    if (sceneId) {
      setModalContext({ sceneId });
      setActiveModal('preview');
      pendingSceneRef.current = null;
    }
    setActiveTransition(null);
  }, [activeTransition, setActiveModal, setModalContext]);

  function handlePlay() {
    if (!selectedMapId) return;
    setActiveMapId(selectedMapId);
    setIsRunning(true);
  }

  function handleStop() {
    setActiveMapId(null);
    setIsRunning(false);
    setActiveModule('topdown');
  }

  // ── No maps available ─────────────────────────────────────────────────────

  if (maps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-background select-none">
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 22,
            background: 'rgba(249,115,22,0.12)',
            border: '2px solid rgba(249,115,22,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 40 }}>🎮</span>
        </div>
        <div style={{ textAlign: 'center', maxWidth: 300 }}>
          <h2
            className="text-base font-bold"
            style={{ color: 'var(--color-text-primary)', marginBottom: 8 }}
          >
            Aucune carte à jouer
          </h2>
          <p
            className="text-sm text-center"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}
          >
            Crée d'abord une carte dans le module{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>Carte 2D</strong>, puis reviens
            ici pour la jouer.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.25)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-warning)',
          }}
        >
          <span>↑</span> Clique sur l'onglet <strong>Carte 2D</strong>
        </div>
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
          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Carte :
          </label>
          <select
            value={selectedMapId ?? ''}
            onChange={(e) => {
              setSelectedMapId(e.target.value || null);
              handleStop();
            }}
            disabled={isRunning}
            className="text-xs px-2 py-1 rounded border border-border bg-transparent outline-none"
            style={{ color: 'var(--color-text-base)' }}
          >
            {maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
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
                background: selectedMapId ? 'var(--color-primary)' : 'var(--color-primary-30)',
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
          <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>
            WASD / ↑↓←→ · E = NPC · Entrée = zones interactives
          </span>
        )}
      </div>

      {/* Game canvas container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Excalibur mounts its canvas here.
            position absolute + inset 0 garantit le remplissage même dans un flex-item
            (height:100% ne se propage pas fiablement sur un enfant block d'un flex-item) */}
        <div
          id={CONTAINER_ID}
          style={{ position: 'absolute', inset: 0, display: isRunning ? 'block' : 'none' }}
        />

        {/* Atmospheric effect overlay — même renderer que le VN editor (SceneEffectCanvas) */}
        {isRunning && activeMapEffect && activeMapEffect.type !== 'none' && (
          <SceneEffectCanvas
            effect={activeMapEffect}
            style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}
          />
        )}

        {/* Transition overlay — style driven by transitionType from the trigger zone */}
        {activeTransition === 'fade-black' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.28, ease: 'easeIn' }}
            onAnimationComplete={handleTransitionComplete}
            style={{
              position: 'absolute',
              inset: 0,
              background: '#000',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          />
        )}
        {activeTransition === 'fade-white' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onAnimationComplete={handleTransitionComplete}
            style={{
              position: 'absolute',
              inset: 0,
              background: '#fff',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          />
        )}
        {activeTransition === 'iris' && (
          <motion.div
            initial={{ clipPath: 'circle(150% at 50% 50%)' }}
            animate={{ clipPath: 'circle(0% at 50% 50%)' }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.8, 1] }}
            onAnimationComplete={handleTransitionComplete}
            style={{
              position: 'absolute',
              inset: 0,
              background: '#000',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Interact prompt — bobbing "↵ Entrée" tooltip */}
        {isRunning && showInteractPrompt && (
          <motion.div
            key="interact-prompt"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.15 },
              y: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              position: 'absolute',
              bottom: 52,
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 10,
              background: 'rgba(10,8,24,0.82)',
              color: 'rgba(255,255,255,0.92)',
              padding: '5px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.04em',
              border: '1.5px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            ↵ Entrée
          </motion.div>
        )}

        {/* Sign popup — text panel shown on interact */}
        {isRunning && signPopupText !== null && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '0 24px 72px',
              pointerEvents: 'auto',
              zIndex: 15,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{
                background: 'rgba(13,10,28,0.96)',
                border: '2px solid rgba(139,92,246,0.55)',
                borderRadius: 12,
                padding: '18px 24px',
                maxWidth: 400,
                width: '100%',
                color: 'rgba(255,255,255,0.92)',
                fontSize: 14,
                lineHeight: 1.65,
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
              }}
            >
              <p style={{ margin: '0 0 14px' }}>{signPopupText}</p>
              <button
                onClick={() => {
                  setSignPopupText(null);
                  bridgeRef.current?.hideSignPopup();
                }}
                style={{
                  fontSize: 11,
                  padding: '4px 18px',
                  borderRadius: 6,
                  background: 'rgba(139,92,246,0.25)',
                  border: '1px solid rgba(139,92,246,0.5)',
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                }}
              >
                ↵ Fermer
              </button>
            </motion.div>
          </div>
        )}

        {/* Idle state when not running */}
        {!isRunning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 select-none">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--color-primary-15)',
                border: '2px solid var(--color-primary-30)',
              }}
            >
              <Play size={28} style={{ color: 'var(--color-primary)', marginLeft: 3 }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Appuyez sur <strong>Lancer</strong> pour jouer la carte
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
