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
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { AnimatedCharacterSprite } from '@/components/ui/AnimatedCharacterSprite';
import { CHARACTER_ANIMATION_VARIANTS } from '@/constants/animations';
import type { CharacterAnimationVariantName } from '@/constants/animations';
import type { GameStats, DialogueChoice, Scene } from '@/types';
import type { Character } from '@/types/characters';
import { useSettingsStore, useCharactersStore } from '../../../stores/index';
import { useIsKidMode } from '@/hooks/useIsKidMode';
import { uiSounds } from '@/utils/uiSounds';
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
import { CinematicPlayer } from './CinematicPlayer';
import { logger } from '@/utils/logger';
import { GAME_STATS } from '@/i18n';
import { DialogueBox } from '@/components/ui/DialogueBox';
import { CompactStatHUD } from '@/components/ui/compact-stat-hud';
import DiceResultModal from '@/components/DiceResultModal';

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
  /** Standalone mode — si fourni, bypasse les stores Zustand (lecture depuis ExportData). */
  standaloneScenes?: Scene[];
  standaloneCharacters?: Character[];
  /** Valeurs initiales des variables de jeu (issues des defs ExportData.settings.variables). */
  standaloneInitialVariables?: GameStats;
}

export default function PreviewPlayer({
  initialSceneId,
  onClose,
  standaloneScenes,
  standaloneCharacters,
  standaloneInitialVariables,
}: PreviewPlayerProps) {
  // ── Stores (bypassed in standalone mode si les props correspondantes sont fournies) ──
  const storeScenes = useAllScenesWithElements();
  const scenes = standaloneScenes ?? storeScenes;
  const variables = useSettingsStore(state => state.variables);
  const enableStatsHUD = useSettingsStore(state => state.enableStatsHUD);
  const setEnableStatsHUD = useSettingsStore(state => state.setEnableStatsHUD);
  const characterFx             = useSettingsStore(state => state.characterFx);
  const uiSoundsVolume          = useSettingsStore(state => state.uiSoundsVolume);
  const uiSoundStyle            = useSettingsStore(state => state.uiSoundStyle);
  const uiSoundsTickInterval    = useSettingsStore(state => state.uiSoundsTickInterval);
  const storeCharacterLibrary = useCharactersStore(state => state.characters);
  const characterLibrary: Character[] = standaloneCharacters ?? storeCharacterLibrary;

  const isKid = useIsKidMode();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [moodOverrides, setMoodOverrides] = useState<Record<string, string>>({});

  // ── Refs ──────────────────────────────────────────────────────────────────
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const previousSceneIdRef = useRef<string | null>(null);
  const prevSfxDialogueRef = useRef<string | null>(null);
  /** Détection de la transition false→true de typewriterDone pour les sons de fin. */
  const prevTypewriterDoneRef = useRef(false);

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
    diceState,
    pendingDiceDifficulty,
    confirmDiceNavigation,
  } = useGameState({
    scenes,
    initialSceneId: initialSceneId || (scenes && scenes[0]?.id),
    initialStats: standaloneInitialVariables ?? (variables as GameStats) ?? {},
  });

  // ── Config boîte de dialogue (hook partagé avec DialoguePreviewOverlay) ──
  const dialogueBoxConfig = useDialogueBoxConfig(currentDialogue?.boxStyle);

  // ── Typewriter ────────────────────────────────────────────────────────────
  const { displayText, isComplete: typewriterDone, skip: skipTypewriter } = useTypewriter(
    currentDialogue?.text ?? '',
    {
      speed: dialogueBoxConfig.typewriterSpeed,
      cursor: true,
      contextAware: true,
      // onTick via ref interne → pas de redémarrage de l'animation sur re-render
      onTick: useCallback((char: string) => { uiSounds.tick(char); }, []),
    }
  );

  const handleAdvance = useCallback(() => {
    if (!typewriterDone) {
      // Son distinct "skip" — différent d'advance() pour que le joueur sente la distinction
      uiSounds.skipTypewriter();
      skipTypewriter();
    } else if (!isAtLastDialogue) {
      uiSounds.advance();
      goToNextDialogue();
    }
  }, [typewriterDone, skipTypewriter, goToNextDialogue, isAtLastDialogue]);

  /** Wrapper chooseOption avec son de sélection. */
  const handleChoose = useCallback((choice: DialogueChoice) => {
    uiSounds.choiceSelect();
    chooseOption(choice);
  }, [chooseOption]);

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

  // ── Personnage qui parle (pour l'animation isSpeaking) ──────────────────
  const speakingSceneCharId = useMemo<string | null>(() => {
    if (!currentDialogue?.speaker) return null;
    const sc = (currentScene?.characters ?? []).find(c =>
      c.characterId === currentDialogue.speaker ||
      characterLibrary.find(ch => ch.id === c.characterId)?.name === currentDialogue.speaker
    );
    return sc?.id ?? null;
  }, [currentDialogue, currentScene?.characters, characterLibrary]);

  // ── hasChoices (useMemo avant la garde — utilisé dans les useEffects UI sounds) ──
  const hasChoices = useMemo(
    () => !!(currentDialogue?.choices && currentDialogue.choices.length > 0),
    [currentDialogue?.choices, currentDialogue]
  );

  // ── Audio ─────────────────────────────────────────────────────────────────
  const initializeAudio = useCallback(async () => {
    if (!audioInitialized) {
      try {
        await audioManager.initialize();
        uiSounds.initialize(); // initialise l'AudioContext uiSounds après le geste utilisateur
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

  // ── UI Sounds — synchronisation volume, mute, style & rythme ─────────────
  useEffect(() => { uiSounds.setVolume(uiSoundsVolume); }, [uiSoundsVolume]);
  useEffect(() => { uiSounds.setMuted(isMuted); }, [isMuted]);
  useEffect(() => { uiSounds.setTickStyle(uiSoundStyle as import('@/utils/uiSounds').TickStyle); }, [uiSoundStyle]);
  useEffect(() => { uiSounds.setTickInterval(uiSoundsTickInterval); }, [uiSoundsTickInterval]);

  // ── UI Sounds — démarrage du jeu ──────────────────────────────────────────
  // Arpège C5-E5-G5 joué 300ms après l'initialisation audio (AudioContext stable).
  // ⭐ Son inattendu : signal d'ouverture de scène, style Ace Attorney.
  useEffect(() => {
    if (!audioInitialized) return;
    const timer = setTimeout(() => uiSounds.gameStart(), 300);
    return () => clearTimeout(timer);
  }, [audioInitialized]);

  // ── UI Sounds — transition de scène ──────────────────────────────────────
  // Swoosh grave lors du changement de scène (branché sur le même trigger que le BGM).
  // ⭐ Son inattendu : repère spatial/temporel sous-conscient.
  useEffect(() => {
    if (!audioInitialized || !currentScene) return;
    // previousSceneIdRef.current est mis à jour dans l'effet BGM — on lit sa valeur courante
    // sans interférer avec lui. On détecte le changement via currentScene.id directement.
    return () => {
      // Nettoyage : rien à faire ici, la transition est déclenchée au changement
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transition de scène : déclenchée quand currentScene.id change (hors mount initial)
  const sceneTransitionInitRef = useRef(false);
  useEffect(() => {
    if (!audioInitialized) return;
    if (!sceneTransitionInitRef.current) {
      sceneTransitionInitRef.current = true;
      return; // ignorer le mount initial
    }
    uiSounds.sceneTransition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene?.id]);

  // ── UI Sounds — typewriter terminé ───────────────────────────────────────
  // Détecte la transition false→true de typewriterDone.
  // - Avec choix  → whoosh "choiceAppear" ⭐ (attention sans agression)
  // - Sans choix  → ping doux "typewriterComplete" ⭐ (signal subliminal "tu peux cliquer")
  useEffect(() => {
    if (!audioInitialized) {
      prevTypewriterDoneRef.current = typewriterDone;
      return;
    }
    if (typewriterDone && !prevTypewriterDoneRef.current) {
      if (hasChoices) {
        uiSounds.choiceAppear();
      } else {
        uiSounds.typewriterComplete();
      }
    }
    prevTypewriterDoneRef.current = typewriterDone;
  }, [typewriterDone, hasChoices, audioInitialized]);

  // ── Garde ─────────────────────────────────────────────────────────────────
  if (!currentScene) {
    return (
      <div className="p-10 text-center text-white">
        Aucune scène jouable.{' '}
        <button onClick={onClose} className="underline">Fermer</button>
      </div>
    );
  }

  // hasChoices est défini plus haut en useMemo (avant la garde)

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
          {/* Stats HUD — Pro mode only (trop complexe pour élèves) */}
          {!isKid && (
            <button
              onClick={(e) => { e.stopPropagation(); setEnableStatsHUD(!enableStatsHUD); }}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1.5 ${enableStatsHUD ? 'bg-purple-600 text-white' : 'bg-muted'}`}
            >
              <BarChart3 className="h-4 w-4" />
              Stats
            </button>
          )}
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

      {/* ── Modale résultat dé — bloquante, s'ouvre après le lancer ── */}
      <DiceResultModal
        isOpen={diceState.lastRoll !== null}
        roll={diceState.lastRoll ?? 0}
        difficulty={pendingDiceDifficulty ?? 0}
        success={diceState.lastResult === 'success'}
        onClose={confirmDiceNavigation}
      />

      {/* ── Zone de jeu ── */}
      <div
        ref={centerDivRef}
        className="flex-1 min-h-0 bg-black flex items-center justify-center relative overflow-hidden"
      >
        {canvasSize.width > 0 && currentScene.sceneType === 'cinematic' && (
          <CinematicPlayer
            events={currentScene.cinematicEvents ?? []}
            backgroundUrl={currentScene.backgroundUrl}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            characterLibrary={characterLibrary}
            onSequenceEnd={goToNextDialogue}
          />
        )}
        {canvasSize.width > 0 && currentScene.sceneType !== 'cinematic' && (
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
            {/* AnimatePresence : nécessaire pour jouer les animations de sortie (exit variants) */}
            <AnimatePresence>
              {currentScene.characters.map(sc => {
                const char = characterLibrary.find(c => c.id === sc.characterId);
                const mood = moodOverrides[sc.id] ?? sc.mood ?? 'neutral';
                const spriteUrl = char?.sprites?.[mood]
                  ?? char?.sprites?.['neutral']
                  ?? (char?.sprites ? Object.values(char.sprites)[0] : undefined);
                const widthPct  = (128 * (sc.scale ?? 1) / 960) * 100;
                const heightPct = (128 * (sc.scale ?? 1) / 540) * 100;

                // Lecture de l'animation d'entrée définie sur le personnage de la scène
                const entranceKey = (sc.entranceAnimation || 'none') as CharacterAnimationVariantName;
                const animVariant = (CHARACTER_ANIMATION_VARIANTS[entranceKey]
                  ?? CHARACTER_ANIMATION_VARIANTS.none) as unknown as Variants;

                // ⚠️ Framer Motion écrase style.transform quand il applique ses variants (x, y, opacity).
                // On ne peut PAS utiliser transform:'translate(-50%,-50%)' pour le centrage — il serait perdu.
                // Solution : pré-calculer left/top au coin supérieur-gauche (centre - demi-taille).
                const leftPct = sc.position.x - widthPct  / 2;
                const topPct  = sc.position.y - heightPct / 2;

                return (
                  // key inclut currentScene.id → remontage sur changement de scène
                  // → animation d'entrée rejouée à chaque transition de scène
                  // AnimatedCharacterSprite reçoit un nouveau montage → crossfade reset (correct)
                  <motion.div
                    key={`${currentScene.id}-${sc.id}`}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={animVariant}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                      zIndex: (sc.zIndex ?? 1) + 1,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    <AnimatedCharacterSprite
                      spriteUrl={spriteUrl}
                      alt={char?.name ?? ''}
                      isSpeaking={speakingSceneCharId === sc.id}
                      flipped={sc.flipped}
                      fxConfig={characterFx}
                      className="drop-shadow-lg"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

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
                  isRolling={diceState.rolling}
                  onChoose={handleChoose}
                  onRestart={() => goToScene(currentScene.id, null)}
                  onClose={onClose}
                />
              </div>
            </div>

            {/* ── Stats HUD — Pro mode only ── */}
            {!isKid && enableStatsHUD && (
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
