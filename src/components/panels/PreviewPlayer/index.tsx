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
import SceneEffectCanvas from '@/components/ui/SceneEffectCanvas';
import type { CharacterHitbox } from '@/components/ui/SceneEffectCanvas';
import { EFFECT_CSS_FILTERS } from '@/config/sceneEffects';
import { CinematicPlayer } from './CinematicPlayer';
import { logger } from '@/utils/logger';
import { GAME_STATS } from '@/i18n';
import { DialogueBox } from '@/components/ui/DialogueBox';
import { CompactStatHUD } from '@/components/ui/compact-stat-hud';
import { DiceOverlay } from './DiceOverlay';
import { MinigameOverlay } from './MinigameOverlay';
import { VisualFilterLayer } from '@/components/ui/VisualFilterLayer';
import { DialogueBoxPositioned } from '@/components/ui/DialogueBoxPositioned';
import { resolveCharacterSprite } from '@/utils/characterSprite';

/** Aspect ratio 16:9 */
const ASPECT_RATIO = 16 / 9;

function computePlayerSize(
  containerW: number,
  containerH: number
): { width: number; height: number } {
  if (containerW === 0 || containerH === 0) return { width: 0, height: 0 };
  const baseW = Math.min(containerW, containerH * ASPECT_RATIO);
  const finalW = Math.max(320, baseW);
  return { width: Math.round(finalW), height: Math.round(finalW / ASPECT_RATIO) };
}

export interface PreviewPlayerProps {
  initialSceneId?: string | null;
  /** ID du dialogue de départ.
   *  null ou absent → premier dialogue de la scène (comportement par défaut). */
  initialDialogueId?: string | null;
  onClose: () => void;
  /** Standalone mode — si fourni, bypasse les stores Zustand (lecture depuis ExportData). */
  standaloneScenes?: Scene[];
  standaloneCharacters?: Character[];
  /** Valeurs initiales des variables de jeu (issues des defs ExportData.settings.variables). */
  standaloneInitialVariables?: GameStats;
}

export default function PreviewPlayer({
  initialSceneId,
  initialDialogueId,
  onClose,
  standaloneScenes,
  standaloneCharacters,
  standaloneInitialVariables,
}: PreviewPlayerProps) {
  // ── Stores (bypassed in standalone mode si les props correspondantes sont fournies) ──
  const storeScenes = useAllScenesWithElements();
  const scenes = standaloneScenes ?? storeScenes;
  const variables = useSettingsStore((state) => state.variables);
  const enableStatsHUD = useSettingsStore((state) => state.enableStatsHUD);
  const setEnableStatsHUD = useSettingsStore((state) => state.setEnableStatsHUD);
  const characterFx = useSettingsStore((state) => state.characterFx);
  const uiSoundsVolume = useSettingsStore((state) => state.uiSoundsVolume);
  const uiSoundStyle = useSettingsStore((state) => state.uiSoundStyle);
  const uiSoundsTickInterval = useSettingsStore((state) => state.uiSoundsTickInterval);
  const storeCharacterLibrary = useCharactersStore((state) => state.characters);
  const characterLibrary: Character[] = standaloneCharacters ?? storeCharacterLibrary;

  // Protagoniste → stats initiales (fallback sur variables globales si non trouvé).
  // useMemo évite de re-traverser la liste à chaque render ; se met à jour uniquement
  // si la bibliothèque de personnages ou le override standalone changent.
  const protagonistStats = useMemo<GameStats | null>(() => {
    if (standaloneInitialVariables) return null; // standalone override prend la priorité
    const protagonist = storeCharacterLibrary.find((c) => c.isProtagonist);
    if (!protagonist?.initialStats) return null;
    const { physique, mentale } = protagonist.initialStats;
    return {
      [GAME_STATS.PHYSIQUE]: physique ?? 100,
      [GAME_STATS.MENTALE]: mentale ?? 100,
    };
  }, [storeCharacterLibrary, standaloneInitialVariables]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const playerRootRef = useRef<HTMLDivElement>(null);
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

  // Facteur d'échelle : la typographie de la boîte est authoriée à 960px (REFERENCE_CANVAS_WIDTH).
  // À 1920px canvas, le texte sera 2× plus grand qu'à 960px — proportionnel aux sprites.
  const dialogueScaleFactor = canvasSize.width > 0 ? canvasSize.width / REFERENCE_CANVAS_WIDTH : 1;

  // ── Logique de jeu ────────────────────────────────────────────────────────
  const {
    currentScene,
    currentDialogue,
    visibleChoices,
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
    minigameState,
    triggerMinigame,
    quitMinigame,
    pendingScreenEffect,
    clearScreenEffect,
  } = useGameState({
    scenes,
    initialSceneId: initialSceneId || (scenes && scenes[0]?.id),
    initialDialogueId: initialDialogueId ?? null,
    // Priorité : standalone > protagoniste > variables globales > vide
    initialStats: standaloneInitialVariables ?? protagonistStats ?? (variables as GameStats) ?? {},
  });

  // ── Scène suivante — undefined sur la dernière scène (bouton masqué) ────────
  const nextScene = useMemo(() => {
    if (!currentScene || !scenes) return undefined;
    const idx = scenes.findIndex((s) => s.id === currentScene.id);
    return idx >= 0 && idx < scenes.length - 1 ? scenes[idx + 1] : undefined;
  }, [scenes, currentScene]);

  const handleNextScene = useCallback(() => {
    if (nextScene) goToScene(nextScene.id, null);
  }, [nextScene, goToScene]);

  // ── Hitboxes personnages — bounding boxes en pixels canvas pour la pluie ──
  // Même formule que le positionnement CSS des sprites (960×540 référence).
  const characterHitboxes = useMemo<CharacterHitbox[]>(() => {
    if (!currentScene || canvasSize.width === 0) return [];
    const REF_W = 960;
    const REF_H = 540;
    return currentScene.characters.map((sc) => {
      const wPct = ((128 * (sc.scale ?? 1)) / REF_W) * 100;
      const hPct = ((128 * (sc.scale ?? 1)) / REF_H) * 100;
      return {
        x: ((sc.position.x - wPct / 2) / 100) * canvasSize.width,
        y: ((sc.position.y - hPct / 2) / 100) * canvasSize.height,
        w: (wPct / 100) * canvasSize.width,
        h: (hPct / 100) * canvasSize.height,
      };
    });
  }, [currentScene, canvasSize]);

  // ── Config boîte de dialogue (hook partagé avec DialoguePreviewOverlay) ──
  const dialogueBoxConfig = useDialogueBoxConfig(currentDialogue?.boxStyle);

  // ── Speaker layout (hook partagé avec DialoguePreviewOverlay) ────────────
  const { speakerDisplayName, speakerIsOnRight, speakerPortraitUrl, speakerColor, isNarrator } =
    useSpeakerLayout({
      speakerNameOrId: currentDialogue?.speaker,
      sceneCharacters: currentScene?.characters ?? [],
      characterLibrary,
      config: dialogueBoxConfig,
      moodOverrides,
    });

  // ── Typewriter ────────────────────────────────────────────────────────────
  const {
    displayText,
    isComplete: typewriterDone,
    skip: skipTypewriter,
  } = useTypewriter(currentDialogue?.text ?? '', {
    speed: dialogueBoxConfig.typewriterSpeed,
    cursor: true,
    contextAware: true,
    // onTick via ref interne → pas de redémarrage de l'animation sur re-render
    // Narrateur : style 'doux' fixe (indépendant du style global du projet)
    onTick: useCallback(
      (char: string) => {
        if (isNarrator) {
          uiSounds.tickAs(char, 'doux');
        } else {
          uiSounds.tick(char);
        }
      },
      [isNarrator]
    ),
  });

  const effectiveTypewriterDone = typewriterDone;

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
  const handleChoose = useCallback(
    (choice: DialogueChoice) => {
      uiSounds.choiceSelect();
      chooseOption(choice);
    },
    [chooseOption]
  );

  // ── Position boîte de dialogue ─────────────────────────────────────────────
  const dlgPosition = dialogueBoxConfig.position;

  // ── Mood overrides ────────────────────────────────────────────────────────
  useEffect(() => {
    setMoodOverrides({});
  }, [currentScene?.id]);
  useEffect(() => {
    if (!currentDialogue?.characterMoods) return;
    setMoodOverrides((prev) => ({ ...prev, ...currentDialogue.characterMoods }));
  }, [currentDialogue]);

  // ── Screen shake ─────────────────────────────────────────────────────────
  const [shakeKey, setShakeKey] = useState(0);
  const [shakeParams, setShakeParams] = useState({ intensity: 5, duration: 400 });
  // ── Color filter ─────────────────────────────────────────────────────────
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  const CSS_COLOR_BLIND_FILTERS: Record<string, string | null> = {
    deuteranopia: 'saturate(0.4) hue-rotate(30deg)',
    protanopia: 'saturate(0.3) hue-rotate(15deg)',
    tritanopia: 'saturate(0.6) hue-rotate(180deg)',
    none: null,
  };

  useEffect(() => {
    if (!pendingScreenEffect) return;
    if (pendingScreenEffect.operation === 'screenShake') {
      setShakeKey((k) => k + 1);
      setShakeParams({
        intensity: pendingScreenEffect.intensity,
        duration: pendingScreenEffect.duration,
      });
    } else if (pendingScreenEffect.operation === 'colorFilter') {
      setColorFilter(CSS_COLOR_BLIND_FILTERS[pendingScreenEffect.filterType] ?? null);
    }
    clearScreenEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- CSS_COLOR_BLIND_FILTERS est une constante inline
  }, [pendingScreenEffect, clearScreenEffect]);

  // ── Sauvegarde persistante du dernier résultat de dé (avant que confirmDiceNavigation le réinitialise) ──
  const lastDiceRollRef = useRef<number | null>(null);
  useEffect(() => {
    if (diceState.lastRoll !== null) lastDiceRollRef.current = diceState.lastRoll;
  }, [diceState.lastRoll]);

  // ── Démarrage mini-jeu automatique sur les dialogues minigame ────────────
  useEffect(() => {
    if (currentDialogue?.minigame) {
      const cfg = currentDialogue.minigame;
      // Injecter le résultat du dé si le mode Braille l'utilise
      const enriched =
        cfg.type === 'braille' && cfg.brailleUseDice && lastDiceRollRef.current !== null
          ? { ...cfg, brailleDiceResult: lastDiceRollRef.current }
          : cfg;
      triggerMinigame(enriched);
    }
  }, [currentDialogue?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- triggerMinigame stable (useCallback)

  // ── Personnage qui parle (pour l'animation isSpeaking) ──────────────────
  const speakingSceneCharId = useMemo<string | null>(() => {
    if (!currentDialogue?.speaker) return null;
    const sc = (currentScene?.characters ?? []).find(
      (c) =>
        c.characterId === currentDialogue.speaker ||
        characterLibrary.find((ch) => ch.id === c.characterId)?.name === currentDialogue.speaker
    );
    return sc?.id ?? null;
  }, [currentDialogue, currentScene?.characters, characterLibrary]);

  // ── hasChoices (useMemo avant la garde — utilisé dans les useEffects UI sounds) ──
  // Utilise visibleChoices (filtré par conditions) — si tous masqués, le joueur peut avancer normalement.
  const hasChoices = useMemo(() => visibleChoices.length > 0, [visibleChoices]);

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
      const previousScene = scenes.find((s) => s.id === previousSceneId);
      if (
        previousScene?.audio?.continueToNextScene &&
        currentScene.audio?.url === previousScene.audio.url
      )
        return;
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

  useEffect(() => {
    return () => {
      audioManager.stopBGM(0);
      audioManager.stopAllAmbient();
    };
  }, []);

  // ── Pistes ambiantes — démarrent/s'arrêtent au changement de scène ou de pistes ──
  // Les deux slots sont traités séparément pour éviter d'arrêter slot-0 quand slot-1 change.
  // Deps incluent les URLs des 2 slots pour détecter les changements de pistes sans
  // changer d'ID de scène (ex: édition des pistes ambiantes en live).
  const ambientSlot0Url = currentScene?.ambientTracks?.[0]?.url ?? '';
  const ambientSlot1Url = currentScene?.ambientTracks?.[1]?.url ?? '';
  useEffect(() => {
    if (!audioInitialized || !currentScene) {
      audioManager.stopAllAmbient();
      return;
    }
    const tracks = currentScene.ambientTracks ?? [];
    ([0, 1] as const).forEach((slot) => {
      const track = tracks[slot];
      if (track?.url) audioManager.playAmbient(track, slot);
      else audioManager.stopAmbient(slot);
    });
    return () => {
      audioManager.stopAllAmbient();
    };
  }, [audioInitialized, currentScene?.id, ambientSlot0Url, ambientSlot1Url]); // eslint-disable-line react-hooks/exhaustive-deps -- audioManager.* sont des méthodes de module stables, non réactives

  useEffect(() => {
    audioManager
      .initialize()
      .then(() => setAudioInitialized(true))
      .catch(() => {
        /* autoplay bloqué — fallback onClick */
      });
  }, []);

  // ── Plein écran natif (Fullscreen API) ───────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await playerRootRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // ── Accessibilité ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentDialogue && liveRegionRef.current) {
      liveRegionRef.current.textContent = currentDialogue.text || '';
    }
  }, [currentDialogue]);

  // ── UI Sounds — synchronisation volume, mute, style & rythme ─────────────
  useEffect(() => {
    uiSounds.setVolume(uiSoundsVolume);
  }, [uiSoundsVolume]);
  useEffect(() => {
    uiSounds.setMuted(isMuted);
  }, [isMuted]);
  useEffect(() => {
    uiSounds.setTickStyle(uiSoundStyle as import('@/utils/uiSounds').TickStyle);
  }, [uiSoundStyle]);
  useEffect(() => {
    uiSounds.setTickInterval(uiSoundsTickInterval);
  }, [uiSoundsTickInterval]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- effet de montage unique : setup du cleanup audio ; audioInitialized n'est pas un trigger voulu ici
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uiSounds est un import module-level stable ; audioInitialized géré par early return guard
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
        <button onClick={onClose} className="underline">
          Fermer
        </button>
      </div>
    );
  }

  // hasChoices est défini plus haut en useMemo (avant la garde)

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div
      ref={playerRootRef}
      className="flex flex-col w-full h-full bg-background text-white"
      onClick={initializeAudio}
    >
      <div ref={liveRegionRef} className="sr-only" aria-live="polite" />

      {/* ── Header ── */}
      <header className="flex justify-between items-center p-4 border-b border-border bg-card shrink-0">
        <h2 className="font-bold text-sm truncate max-w-[200px]">Preview: {currentScene.title}</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              initializeAudio();
              toggleMute();
            }}
            className={`px-3 py-1 rounded text-sm flex items-center gap-1.5 ${isMuted ? 'bg-red-600/20 text-red-400' : 'bg-muted'}`}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isMuted ? 'Son OFF' : 'Son ON'}
          </button>
          {/* Stats HUD — accessible dans tous les modes (Pro + Élève).
              Les créateurs peuvent tester les stats même en prévisualisation mode élève.
              Masqué par défaut (enableStatsHUD = false). */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEnableStatsHUD(!enableStatsHUD);
            }}
            className={`px-3 py-1 rounded text-sm flex items-center gap-1.5 ${enableStatsHUD ? 'bg-purple-600 text-white' : 'bg-muted'}`}
          >
            <BarChart3 className="h-4 w-4" />
            Stats
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="px-3 py-1 bg-muted rounded text-sm"
          >
            {isFullscreen ? 'Quitter Plein écran' : 'Plein écran'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
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
        {canvasSize.width > 0 && currentScene.sceneType === 'cinematic' && (
          <CinematicPlayer
            tracks={currentScene.cinematicTracks}
            events={currentScene.cinematicEvents}
            backgroundUrl={currentScene.backgroundUrl}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            characterLibrary={characterLibrary}
            onSequenceEnd={goToNextDialogue}
          />
        )}
        {canvasSize.width > 0 && currentScene.sceneType !== 'cinematic' && (
          <VisualFilterLayer
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              flexShrink: 0,
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                width: '100%',
                height: '100%',
                filter: colorFilter ?? undefined,
                animation:
                  shakeKey > 0
                    ? `shakePlayer${shakeKey} ${shakeParams.duration}ms ease-in-out`
                    : undefined,
              }}
            >
              {/* ── Screen shake keyframe (injecté dynamiquement) ── */}
              {shakeKey > 0 && (
                <style>{`@keyframes shakePlayer${shakeKey}{0%,100%{transform:translate(0)}25%{transform:translate(-${shakeParams.intensity <= 3 ? 4 : shakeParams.intensity <= 7 ? 8 : 14}px,${shakeParams.intensity <= 3 ? 2 : shakeParams.intensity <= 7 ? 4 : 7}px)}75%{transform:translate(${shakeParams.intensity <= 3 ? 4 : shakeParams.intensity <= 7 ? 8 : 14}px,-${shakeParams.intensity <= 3 ? 2 : shakeParams.intensity <= 7 ? 4 : 7}px)}}`}</style>
              )}
              {/* ── Fond ── */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: currentScene.backgroundUrl
                    ? `url(${currentScene.backgroundUrl})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#1a1a2e',
                  filter:
                    [
                      buildFilterCSS(currentScene.backgroundFilter),
                      currentScene.sceneEffect?.type &&
                      currentScene.sceneEffect.type !== 'none' &&
                      currentScene.sceneEffect.cssFilter
                        ? EFFECT_CSS_FILTERS[currentScene.sceneEffect.type]
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined,
                }}
              />

              {/* ── Sprites personnages ── */}
              {/* AnimatePresence : nécessaire pour jouer les animations de sortie (exit variants) */}
              <AnimatePresence>
                {currentScene.characters.map((sc) => {
                  const char = characterLibrary.find((c) => c.id === sc.characterId);
                  const mood = moodOverrides[sc.id] ?? sc.mood ?? 'neutral';
                  const spriteUrl = resolveCharacterSprite(char, mood);
                  const widthPct = ((128 * (sc.scale ?? 1)) / 960) * 100;
                  const heightPct = ((128 * (sc.scale ?? 1)) / 540) * 100;

                  // Lecture de l'animation d'entrée définie sur le personnage de la scène
                  const entranceKey = (sc.entranceAnimation ||
                    'none') as CharacterAnimationVariantName;
                  const animVariant = (CHARACTER_ANIMATION_VARIANTS[entranceKey] ??
                    CHARACTER_ANIMATION_VARIANTS.none) as unknown as Variants;

                  // ⚠️ Framer Motion écrase style.transform quand il applique ses variants (x, y, opacity).
                  // On ne peut PAS utiliser transform:'translate(-50%,-50%)' pour le centrage — il serait perdu.
                  // Solution : pré-calculer left/top au coin supérieur-gauche (centre - demi-taille).
                  const leftPct = sc.position.x - widthPct / 2;
                  const topPct = sc.position.y - heightPct / 2;

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

              {/* ── Effet atmosphérique (au-dessus des sprites, sous le dégradé UI) ── */}
              <SceneEffectCanvas
                effect={currentScene.sceneEffect}
                characterHitboxes={characterHitboxes}
              />

              {/* ── Overlay narrateur — assombrissement 45% (style Octopath Traveler) ── */}
              <AnimatePresence>
                {isNarrator && (
                  <motion.div
                    key="narrator-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 8,
                      background: 'rgba(0, 0, 0, 0.45)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </AnimatePresence>

              {/* ── Vignette appel téléphonique ── */}
              {currentDialogue?.dialogueSubtype === 'phonecall' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 8,
                    background:
                      'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.78) 100%)',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* ── Boîte de dialogue — position + gradient via composant partagé ── */}
              <DialogueBoxPositioned
                position={dlgPosition}
                positionX={dialogueBoxConfig.positionX}
                positionY={dialogueBoxConfig.positionY}
                boxWidth={dialogueBoxConfig.boxWidth}
                zIndex={10}
                outerClassName="pointer-events-none"
              >
                {/* AnimatePresence : keyed sur currentDialogue.id → rejoue enter/exit à chaque dialogue */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentDialogue?.id ?? 'no-dialogue'}
                    className="pointer-events-auto"
                    {...(dialogueBoxConfig.dialogueTransition === 'fondu'
                      ? {
                          initial: { opacity: 0 },
                          animate: { opacity: 1 },
                          exit: { opacity: 0 },
                          transition: { duration: 0.12, ease: 'easeOut' },
                        }
                      : dialogueBoxConfig.dialogueTransition === 'glisse'
                        ? {
                            initial: { opacity: 0, y: 7 },
                            animate: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: -5 },
                            transition: { duration: 0.16, ease: 'easeOut' },
                          }
                        : {
                            // 'aucune' — pas d'animation, AnimatePresence gère juste le remontage
                            initial: false,
                            animate: {},
                            exit: {},
                            transition: { duration: 0 },
                          })}
                    onClick={handleAdvance}
                    role="button"
                    aria-label="Cliquez pour avancer le dialogue"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleAdvance();
                      }
                    }}
                  >
                    <DialogueBox
                      speaker={isNarrator ? undefined : speakerDisplayName || undefined}
                      isNarrator={isNarrator}
                      displayText={displayText}
                      richText={isNarrator ? undefined : currentDialogue?.richText}
                      choices={visibleChoices.length > 0 ? visibleChoices : undefined}
                      isTypewriterDone={effectiveTypewriterDone}
                      hasChoices={hasChoices}
                      isAtLastDialogue={isAtLastDialogue}
                      config={dialogueBoxConfig}
                      scaleFactor={dialogueScaleFactor}
                      speakerPortraitUrl={isNarrator ? null : speakerPortraitUrl}
                      speakerIsOnRight={speakerIsOnRight}
                      speakerColor={speakerColor}
                      isRolling={diceState.lastRoll !== null}
                      dialogueKey={currentDialogue?.id}
                      onChoose={handleChoose}
                      onRestart={() => goToScene(currentScene.id, null)}
                      onNextScene={nextScene ? handleNextScene : undefined}
                      onClose={onClose}
                    />
                  </motion.div>
                </AnimatePresence>
              </DialogueBoxPositioned>

              {/* ── Stats HUD — tous modes (Pro + Élève) ── */}
              {/* z-[60] > DiceOverlay (z-50) → HUD visible même pendant le lancer de dé */}
              {enableStatsHUD && (
                <div className="absolute top-3 left-3 z-[60]">
                  <CompactStatHUD
                    physique={stats[GAME_STATS.PHYSIQUE] ?? 100}
                    mentale={stats[GAME_STATS.MENTALE] ?? 100}
                    scaleFactor={dialogueScaleFactor}
                  />
                </div>
              )}

              {/* ── Overlay spectaculaire lancer de dé ──
                 Le résultat (roll/success/difficulty) est connu SYNCHRONEMENT avant l'ouverture.
                 L'animation DiceOverlay fournit elle-même la suspense visuelle (1750ms). */}
              <DiceOverlay
                isOpen={diceState.lastRoll !== null}
                roll={diceState.lastRoll ?? 0}
                difficulty={pendingDiceDifficulty ?? 0}
                success={diceState.lastResult === 'success'}
                onClose={confirmDiceNavigation}
              />

              {/* ── Overlay mini-jeu ── */}
              <MinigameOverlay
                isOpen={minigameState.isOpen}
                config={minigameState.config}
                onResult={minigameState.onResult}
                onQuit={quitMinigame}
              />
            </div>
          </VisualFilterLayer>
        )}
      </div>
    </div>
  );
}
