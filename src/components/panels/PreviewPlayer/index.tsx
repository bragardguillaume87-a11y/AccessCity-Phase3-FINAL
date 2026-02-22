/**
 * PreviewPlayer — Lecteur de visual novel pur React/CSS
 *
 * Architecture :
 * - Fond + sprites : CSS natif (background-size:cover / object-fit:contain)
 * - Canvas : dimensions pixel explicites via useCanvasDimensions + algo "contain"
 * - Dialogue : DialogueBox (composant partagé avec l'éditeur) + useTypewriter
 * - Stats HUD : overlay absolu coin supérieur gauche
 *
 * La boîte de dialogue est rendue par <DialogueBox> — le même composant que
 * l'overlay inline de l'éditeur (DialoguePreviewOverlay). Tout changement de
 * style ne se fait qu'à un seul endroit.
 *
 * Personnalisation :
 * - Défauts globaux : settingsStore.projectSettings.game.dialogueBoxDefaults
 * - Override par dialogue : dialogue.boxStyle (mergé dans PreviewPlayer)
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { GameStats } from '@/types';
import { useSettingsStore, useCharactersStore } from '../../../stores/index';
import { useAllScenesWithElements } from '@/stores/selectors';
import { REFERENCE_CANVAS_WIDTH } from '@/config/canvas';
import { useGameState } from '../../../hooks/useGameState';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useDialogueBoxConfig } from '@/hooks/useDialogueBoxConfig';
import { useSpeakerLayout } from '@/hooks/useSpeakerLayout';
import { useCanvasDimensions } from '../MainCanvas/hooks/useCanvasDimensions';
import { Volume2, VolumeX, BarChart3 } from 'lucide-react';
import { audioManager } from '../../../utils/audioManager';
import { buildFilterCSS } from '@/utils/backgroundFilter';
import { logger } from '@/utils/logger';
import { GAME_STATS } from '@/i18n';
import { DialogueBox } from '@/components/ui/DialogueBox';
import { CompactStatHUD } from '@/components/ui/compact-stat-hud';

/** Aspect ratio 16:9 */
const ASPECT_RATIO = 16 / 9;

function computePlayerSize(containerW: number, containerH: number): { width: number; height: number } {
  if (containerW === 0 || containerH === 0) return { width: 0, height: 0 };
  const baseW = Math.min(containerW, containerH * ASPECT_RATIO);
  const finalW = Math.max(320, baseW);
  return { width: Math.round(finalW), height: Math.round(finalW / ASPECT_RATIO) };
}


export interface PreviewPlayerProps {
  initialSceneId?: string | null;
  onClose: () => void;
}

export default function PreviewPlayer({ initialSceneId, onClose }: PreviewPlayerProps) {
  // ── Stores ──────────────────────────────────────────────────────────────
  const scenes = useAllScenesWithElements();
  const variables = useSettingsStore(state => state.variables);
  const enableStatsHUD = useSettingsStore(state => state.enableStatsHUD);
  const setEnableStatsHUD = useSettingsStore(state => state.setEnableStatsHUD);
  const characterLibrary = useCharactersStore(state => state.characters);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [moodOverrides, setMoodOverrides] = useState<Record<string, string>>({});

  // ── Refs ──────────────────────────────────────────────────────────────────
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const previousSceneIdRef = useRef<string | null>(null);
  const prevSfxDialogueRef = useRef<string | null>(null);

  // ── Canvas sizing ─────────────────────────────────────────────────────────
  const [centerDivRef, centerSize] = useCanvasDimensions();
  const canvasSize = useMemo(
    () => computePlayerSize(centerSize.width, centerSize.height),
    [centerSize]
  );

  // Largeur boîte dialogue : 76% du canvas (standard VN 1080p = 60-80%)
  // max-w-2xl fixe (672px) = seulement 35% à 1920px → trop étroit
  const dialogueBoxMaxWidth = useMemo(
    () => canvasSize.width > 0 ? Math.max(320, Math.round(canvasSize.width * 0.76)) : 672,
    [canvasSize.width]
  );

  // Facteur d'échelle : la typographie de la boîte est authoriée à 960px (REFERENCE_CANVAS_WIDTH).
  // À 1920px canvas, le texte sera 2× plus grand qu'à 960px — proportionnel aux sprites.
  const dialogueScaleFactor = canvasSize.width > 0 ? canvasSize.width / REFERENCE_CANVAS_WIDTH : 1;

  // ── Logique de jeu ────────────────────────────────────────────────────────
  const {
    currentScene,
    currentDialogue,
    stats,
    isPaused: _isPaused,
    chooseOption,
    goToNextDialogue,
    goToScene,
    isAtLastDialogue,
    setIsPaused: _setIsPaused,
  } = useGameState({
    scenes,
    initialSceneId: initialSceneId || (scenes && scenes[0]?.id),
    initialStats: (variables as GameStats) || {},
  });

  // ── Config boîte de dialogue (hook partagé avec DialoguePreviewOverlay) ──
  const dialogueBoxConfig = useDialogueBoxConfig(currentDialogue?.boxStyle);

  // ── Typewriter ────────────────────────────────────────────────────────────
  const { displayText, isComplete: typewriterDone, skip: skipTypewriter } = useTypewriter(
    currentDialogue?.text ?? '',
    { speed: dialogueBoxConfig.typewriterSpeed, cursor: true, contextAware: true }
  );

  const handleAdvance = useCallback(() => {
    if (!typewriterDone) {
      skipTypewriter();
    } else if (!isAtLastDialogue) {
      goToNextDialogue();
    }
  }, [typewriterDone, skipTypewriter, goToNextDialogue, isAtLastDialogue]);

  // ── Speaker layout (hook partagé avec DialoguePreviewOverlay) ────────────
  const { speakerDisplayName, speakerIsOnRight, speakerPortraitUrl, speakerColor } = useSpeakerLayout({
    speakerNameOrId: currentDialogue?.speaker,
    sceneCharacters: currentScene?.characters ?? [],
    characterLibrary,
    config: dialogueBoxConfig,
    moodOverrides,
  });

  // ── Mood overrides ────────────────────────────────────────────────────────
  useEffect(() => { setMoodOverrides({}); }, [currentScene?.id]);
  useEffect(() => {
    if (!currentDialogue?.characterMoods) return;
    setMoodOverrides(prev => ({ ...prev, ...currentDialogue.characterMoods }));
  }, [currentDialogue]);

  // ── Audio ─────────────────────────────────────────────────────────────────
  const initializeAudio = useCallback(async () => {
    if (!audioInitialized) {
      try {
        await audioManager.initialize();
        setAudioInitialized(true);
      } catch (error) {
        logger.warn('[PreviewPlayer] Audio initialization failed:', error);
      }
    }
  }, [audioInitialized]);

  const toggleMute = useCallback(() => {
    const newMuted = audioManager.toggleMute();
    setIsMuted(newMuted);
  }, []);

  useEffect(() => {
    if (!audioInitialized || !currentScene) return;
    const previousSceneId = previousSceneIdRef.current;
    previousSceneIdRef.current = currentScene.id;
    if (previousSceneId && previousSceneId !== currentScene.id) {
      const previousScene = scenes.find(s => s.id === previousSceneId);
      if (previousScene?.audio?.continueToNextScene && currentScene.audio?.url === previousScene.audio.url) return;
      if (!previousScene?.audio?.continueToNextScene) audioManager.stopBGM(500);
    }
    if (currentScene.audio?.url) audioManager.playBGM(currentScene.audio);
  }, [audioInitialized, currentScene, scenes]);

  useEffect(() => {
    if (!audioInitialized || !currentDialogue) return;
    if (currentDialogue.id === prevSfxDialogueRef.current) return;
    prevSfxDialogueRef.current = currentDialogue.id;
    if (currentDialogue.sfx?.url) audioManager.playSFX(currentDialogue.sfx);
  }, [audioInitialized, currentDialogue]);

  useEffect(() => { return () => { audioManager.stopBGM(0); audioManager.stopAllAmbient(); }; }, []);

  // ── Pistes ambiantes — démarrent/s'arrêtent au changement de scène ─────────
  useEffect(() => {
    if (!audioInitialized || !currentScene) {
      audioManager.stopAllAmbient();
      return;
    }
    const tracks = currentScene.ambientTracks ?? [];
    ([0, 1] as const).forEach(slot => {
      const track = tracks[slot];
      if (track?.url) audioManager.playAmbient(track, slot);
      else            audioManager.stopAmbient(slot);
    });
    return () => { audioManager.stopAllAmbient(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioInitialized, currentScene?.id]);

  useEffect(() => {
    audioManager.initialize()
      .then(() => setAudioInitialized(true))
      .catch(() => { /* autoplay bloqué — fallback onClick */ });
  }, []);

  // ── Accessibilité ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentDialogue && liveRegionRef.current) {
      liveRegionRef.current.textContent = currentDialogue.text || '';
    }
  }, [currentDialogue]);

  // ── Garde ─────────────────────────────────────────────────────────────────
  if (!currentScene) {
    return (
      <div className="p-10 text-center text-white">
        Aucune scène jouable.{' '}
        <button onClick={onClose} className="underline">Fermer</button>
      </div>
    );
  }

  const hasChoices = !!(currentDialogue?.choices && currentDialogue.choices.length > 0);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col w-full h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'bg-background text-white'}`}
      onClick={initializeAudio}
    >
      <div ref={liveRegionRef} className="sr-only" aria-live="polite" />

      {/* ── Header ── */}
      <header className="flex justify-between items-center p-4 border-b border-border bg-card shrink-0">
        <h2 className="font-bold text-sm truncate max-w-[200px]">
          Preview: {currentScene.title}
        </h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={(e) => { e.stopPropagation(); initializeAudio(); toggleMute(); }}
            className={`px-3 py-1 rounded text-sm flex items-center gap-1.5 ${isMuted ? 'bg-red-600/20 text-red-400' : 'bg-muted'}`}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isMuted ? 'Son OFF' : 'Son ON'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEnableStatsHUD(!enableStatsHUD); }}
            className={`px-3 py-1 rounded text-sm flex items-center gap-1.5 ${enableStatsHUD ? 'bg-purple-600 text-white' : 'bg-muted'}`}
          >
            <BarChart3 className="h-4 w-4" />
            Stats
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(!isFullscreen); }}
            className="px-3 py-1 bg-muted rounded text-sm"
          >
            {isFullscreen ? 'Quitter Plein écran' : 'Plein écran'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="px-3 py-1 bg-red-600 rounded text-sm"
          >
            Fermer
          </button>
        </div>
      </header>

      {/* ── Zone de jeu ── */}
      <div
        ref={centerDivRef}
        className="flex-1 min-h-0 bg-black flex items-center justify-center relative overflow-hidden"
      >
        {canvasSize.width > 0 && (
          <div
            className="relative overflow-hidden flex-shrink-0"
            style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
          >
            {/* ── Fond ── */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: currentScene.backgroundUrl ? `url(${currentScene.backgroundUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#1a1a2e',
                filter: buildFilterCSS(currentScene.backgroundFilter),
              }}
            />

            {/* ── Sprites personnages ── */}
            {currentScene.characters.map(sc => {
              const char = characterLibrary.find(c => c.id === sc.characterId);
              const mood = moodOverrides[sc.id] ?? sc.mood ?? 'neutral';
              const spriteUrl = char?.sprites?.[mood]
                ?? char?.sprites?.['neutral']
                ?? (char?.sprites ? Object.values(char.sprites)[0] : undefined);
              if (!spriteUrl) return null;
              const widthPct  = (128 * (sc.scale ?? 1) / 960) * 100;
              const heightPct = (128 * (sc.scale ?? 1) / 540) * 100;
              return (
                <img
                  key={`${sc.id}-${mood}`}
                  src={spriteUrl}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: `${sc.position.x}%`,
                    top: `${sc.position.y}%`,
                    transform: `translate(-50%, -50%)${sc.flipped ? ' scaleX(-1)' : ''}`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    objectFit: 'contain',
                    zIndex: (sc.zIndex ?? 1) + 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />
              );
            })}

            {/* ── Dégradé adaptatif (selon position de la boîte) ── */}
            {dialogueBoxConfig.position !== 'center' && (
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  ...(dialogueBoxConfig.position === 'top'
                    ? { top: 0, height: '45%', background: 'linear-gradient(to bottom, rgba(3,7,18,0.96) 0%, rgba(3,7,18,0.72) 28%, rgba(3,7,18,0.22) 60%, transparent 100%)' }
                    : { bottom: 0, height: '55%', background: 'linear-gradient(to top, rgba(3,7,18,0.96) 0%, rgba(3,7,18,0.72) 28%, rgba(3,7,18,0.22) 60%, transparent 100%)' }
                  ),
                  zIndex: 9,
                }}
              />
            )}

            {/* ── Boîte de dialogue (composant partagé) ── */}
            <div
              className={`absolute inset-0 flex flex-col pointer-events-none ${
                dialogueBoxConfig.position === 'top'    ? 'justify-start' :
                dialogueBoxConfig.position === 'center' ? 'justify-center' :
                'justify-end'
              }`}
              style={{ zIndex: 10 }}
            >
              <div
                className={`pointer-events-auto px-4 mx-auto w-full ${
                  dialogueBoxConfig.position === 'top'    ? 'mt-4' :
                  dialogueBoxConfig.position === 'center' ? 'my-2' :
                  'mb-4'
                }`}
                style={{ maxWidth: `${dialogueBoxMaxWidth}px` }}
                onClick={handleAdvance}
                role="button"
                aria-label="Cliquez pour avancer le dialogue"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleAdvance(); }
                }}
              >
                <DialogueBox
                  speaker={speakerDisplayName || undefined}
                  displayText={displayText}
                  choices={currentDialogue?.choices}
                  isTypewriterDone={typewriterDone}
                  hasChoices={hasChoices}
                  isAtLastDialogue={isAtLastDialogue}
                  config={dialogueBoxConfig}
                  scaleFactor={dialogueScaleFactor}
                  speakerPortraitUrl={speakerPortraitUrl}
                  speakerIsOnRight={speakerIsOnRight}
                  speakerColor={speakerColor}
                  onChoose={chooseOption}
                  onRestart={() => goToScene(currentScene.id, null)}
                  onClose={onClose}
                />
              </div>
            </div>

            {/* ── Stats HUD ── */}
            {enableStatsHUD && (
              <div className="absolute top-3 left-3 z-20">
                <CompactStatHUD
                  physique={stats[GAME_STATS.PHYSIQUE] ?? 100}
                  mentale={stats[GAME_STATS.MENTALE] ?? 100}
                  scaleFactor={dialogueScaleFactor}
                />
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
