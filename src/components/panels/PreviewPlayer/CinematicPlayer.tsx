/**
 * CinematicPlayer — Lecteur multi-pistes de séquences cinématiques.
 *
 * Architecture temps-réel :
 *  - Ticker 16 ms accumule `currentTimeMs`
 *  - `processedEventIds` (Set) — chaque événement est déclenché exactement une fois
 *  - Comportement "Restaurant" : ticker se fige sur dialogue en attente de clic,
 *    la BGM / ambiance (audio natif) continue naturellement
 *  - Backward-compat : accepte tracks (nouveau) ou events (ancien via migration)
 */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { DialogueBox } from '@/components/ui/DialogueBox';
import { useDialogueBoxConfig } from '@/hooks/useDialogueBoxConfig';
import { useSpeakerLayout } from '@/hooks/useSpeakerLayout';
import { buildFilterCSS } from '@/utils/backgroundFilter';
import { REFERENCE_CANVAS_WIDTH } from '@/config/canvas';
import { resolveCharacterSprite } from '@/utils/characterSprite';
import type { CinematicEvent, TintPreset } from '@/types';
import type { CinematicTracks } from '@/types/cinematic';
import type { Character } from '@/types/characters';
import {
  CINEMATIC_SPEED_MS,
  flattenTracks,
  getTotalDurationMs,
  migrateToCinematicTracks,
} from '@/types/cinematic';

// ── Types internes ────────────────────────────────────────────────────────────

interface ActiveCharacter {
  characterId: string;
  mood: string;
  side: 'left' | 'right' | 'top' | 'bottom';
  visible: boolean;
  shaking: boolean;
}

interface DialogueState {
  speaker: string;
  speakerMood?: string;
  text: string;
  autoAdvance: boolean;
}

// ── Constantes de rendu ───────────────────────────────────────────────────────

const TINT_FILTERS: Record<TintPreset, string> = {
  none: '',
  memory: 'sepia(0.7) brightness(0.9)',
  danger: 'saturate(1.5) hue-rotate(-20deg) brightness(0.85)',
  cold: 'saturate(0.6) hue-rotate(180deg) brightness(0.9)',
  warm: 'sepia(0.4) saturate(1.4) brightness(1.05)',
  dream: 'saturate(0.8) hue-rotate(260deg) brightness(0.9)',
};

const SIDE_POSITIONS: Record<string, React.CSSProperties> = {
  left: { left: '5%', bottom: '0' },
  right: { right: '5%', bottom: '0' },
  top: { left: '50%', bottom: '60%' },
  bottom: { left: '50%', bottom: '0' },
};

const getSideVariants = (side: string) => ({
  initial: {
    opacity: 0,
    x: side === 'left' ? -60 : side === 'right' ? 60 : 0,
    y: side === 'bottom' ? 60 : 0,
  },
  animate: { opacity: 1, x: 0, y: 0, transition: { duration: 0.4 } },
  exit: {
    opacity: 0,
    x: side === 'left' ? -60 : side === 'right' ? 60 : 0,
    transition: { duration: 0.3 },
  },
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Multi-track cinematic data (nouveau format). */
  tracks?: CinematicTracks;
  /** Backward-compat : tableau plat d'events (converti en tracks si tracks absent). */
  events?: CinematicEvent[];
  backgroundUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  characterLibrary: Character[];
  onSequenceEnd: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CinematicPlayer({
  tracks: tracksProp,
  events: eventsProp,
  backgroundUrl: initialBg,
  canvasWidth,
  canvasHeight,
  characterLibrary,
  onSequenceEnd,
}: Props) {
  // Résolution tracks (backward-compat)
  const tracks = useMemo(
    () => tracksProp ?? migrateToCinematicTracks(eventsProp ?? []),
    [tracksProp, eventsProp]
  );

  // ── Visual state ──────────────────────────────────────────────────────────
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const processedEventIds = useRef<Set<string>>(new Set());

  // Ref pour éviter la stale closure dans l'effet processeur d'événements
  // (deps: [currentTimeMs] uniquement → waitingForClick et onSequenceEnd seraient obsolètes sans ref)
  const waitingForClickRef = useRef(false);
  const onSequenceEndRef = useRef(onSequenceEnd);
  useEffect(() => {
    waitingForClickRef.current = waitingForClick;
  });
  useEffect(() => {
    onSequenceEndRef.current = onSequenceEnd;
  });

  const [bgUrl, setBgUrl] = useState(initialBg);
  const [activeChars, setActiveChars] = useState<ActiveCharacter[]>([]);
  const [fadeOverlay, setFadeOverlay] = useState<{
    visible: boolean;
    color: 'black' | 'white';
    opacity: number;
  }>({ visible: false, color: 'black', opacity: 0 });
  const [flashKey, setFlashKey] = useState(0);
  const [flashColor, setFlashColor] = useState<'black' | 'white'>('white');
  const [shakeKey, setShakeKey] = useState(0);
  const [vignette, setVignette] = useState<{
    visible: boolean;
    intensity: 'light' | 'medium' | 'strong';
  }>({ visible: false, intensity: 'medium' });
  const [tintPreset, setTintPreset] = useState<TintPreset>('none');
  const [zoom, setZoom] = useState(1);
  const [letterbox, setLetterbox] = useState(false);
  const [titleCard, setTitleCard] = useState<{ title: string; subtitle?: string } | null>(null);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);

  // Audio persistant — continue nativement pendant la pause Restaurant
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambianceAudioRef = useRef<HTMLAudioElement | null>(null);
  // Ref pour le setInterval du fade BGM — nettoyé au démontage
  const bgmFadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (bgmFadeIntervalRef.current) {
        clearInterval(bgmFadeIntervalRef.current);
        bgmFadeIntervalRef.current = null;
      }
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current.src = '';
        bgmAudioRef.current = null;
      }
      if (ambianceAudioRef.current) {
        ambianceAudioRef.current.pause();
        ambianceAudioRef.current.src = '';
        ambianceAudioRef.current = null;
      }
    };
  }, []);

  // ── Dialogue typewriter ───────────────────────────────────────────────────
  const dialogueBoxConfig = useDialogueBoxConfig(undefined);
  const {
    displayText,
    isComplete: typewriterDone,
    skip: skipTypewriter,
  } = useTypewriter(dialogue?.text ?? '', {
    speed: dialogueBoxConfig.typewriterSpeed,
    cursor: true,
    contextAware: true,
  });

  const { speakerDisplayName, speakerIsOnRight, speakerPortraitUrl, speakerColor } =
    useSpeakerLayout({
      speakerNameOrId: dialogue?.speaker,
      sceneCharacters: [],
      characterLibrary,
      config: dialogueBoxConfig,
      moodOverrides: dialogue?.speakerMood ? { [dialogue.speaker]: dialogue.speakerMood } : {},
    });

  // Auto-advance dialogue (autoAdvance=true) : 1.2s après fin typewriter
  useEffect(() => {
    if (!dialogue?.autoAdvance || !typewriterDone) return;
    const timer = setTimeout(() => setDialogue(null), 1200);
    return () => clearTimeout(timer);
  }, [typewriterDone, dialogue]);

  // ── Ticker 16 ms ─────────────────────────────────────────────────────────
  // Comportement Restaurant : se fige quand waitingForClick=true
  // BGM/ambiance : audio natif, continue indépendamment ✓
  useEffect(() => {
    if (waitingForClick) return;
    const totalMs = getTotalDurationMs(tracks);
    if (currentTimeMs >= totalMs) return;
    const timer = setTimeout(() => setCurrentTimeMs((t) => t + 16), 16);
    return () => clearTimeout(timer);
  }, [waitingForClick, currentTimeMs, tracks]);

  // ── Déclenchement des événements au bon moment ────────────────────────────
  useEffect(() => {
    const allTracked = flattenTracks(tracks);
    const toFire = allTracked.filter(
      (te) => !processedEventIds.current.has(te.id) && te.startTimeMs <= currentTimeMs
    );

    for (const te of toFire) {
      processedEventIds.current.add(te.id);
      const event = te.event;
      const durationMs =
        'speed' in event
          ? CINEMATIC_SPEED_MS[(event as { speed: keyof typeof CINEMATIC_SPEED_MS }).speed]
          : 0;

      switch (event.type) {
        case 'fade': {
          const start = event.direction === 'out' ? 0 : 1;
          const end = event.direction === 'out' ? 1 : 0;
          setFadeOverlay({ visible: true, color: event.color, opacity: start });
          setTimeout(() => setFadeOverlay({ visible: true, color: event.color, opacity: end }), 50);
          if (event.direction === 'in')
            setTimeout(
              () => setFadeOverlay({ visible: false, color: event.color, opacity: 0 }),
              durationMs + 100
            );
          break;
        }
        case 'flash':
          setFlashColor(event.color);
          setFlashKey((k) => k + 1);
          break;
        case 'screenShake':
          setShakeKey((k) => k + 1);
          break;
        case 'background':
          setBgUrl(event.url);
          break;
        case 'characterEnter':
          setActiveChars((prev) => [
            ...prev.filter((c) => c.characterId !== event.characterId),
            {
              characterId: event.characterId,
              mood: event.mood,
              side: event.side,
              visible: true,
              shaking: false,
            },
          ]);
          break;
        case 'characterExit':
          setActiveChars((prev) =>
            prev.map((c) => (c.characterId === event.characterId ? { ...c, visible: false } : c))
          );
          setTimeout(
            () => setActiveChars((prev) => prev.filter((c) => c.characterId !== event.characterId)),
            durationMs + 100
          );
          break;
        case 'dialogue':
          setDialogue({
            speaker: event.speaker,
            speakerMood: event.speakerMood,
            text: event.text,
            autoAdvance: event.autoAdvance,
          });
          if (!event.autoAdvance) setWaitingForClick(true); // Restaurant : gèle le ticker ✓
          break;
        case 'sfx':
          try {
            const a = new Audio(event.url);
            a.volume = event.volume ?? 0.7;
            a.play().catch(() => {});
          } catch {
            /* ignore */
          }
          break;
        case 'bgm':
          if (bgmAudioRef.current) {
            bgmAudioRef.current.pause();
            bgmAudioRef.current.src = '';
            bgmAudioRef.current = null;
          }
          try {
            const a = new Audio(event.url);
            a.volume = event.volume ?? 0.7;
            a.loop = true;
            a.play().catch(() => {});
            bgmAudioRef.current = a;
          } catch {
            /* ignore */
          }
          break;
        case 'bgmStop': {
          const audio = bgmAudioRef.current;
          if (audio) {
            if (event.fade) {
              const step = audio.volume / 10;
              let count = 0;
              if (bgmFadeIntervalRef.current) clearInterval(bgmFadeIntervalRef.current);
              bgmFadeIntervalRef.current = setInterval(() => {
                count++;
                if (!bgmAudioRef.current || count >= 10) {
                  clearInterval(bgmFadeIntervalRef.current!);
                  bgmFadeIntervalRef.current = null;
                  if (bgmAudioRef.current) {
                    bgmAudioRef.current.pause();
                    bgmAudioRef.current.src = '';
                    bgmAudioRef.current = null;
                  }
                } else {
                  audio.volume = Math.max(0, audio.volume - step);
                }
              }, 100);
            } else {
              audio.pause();
              audio.src = '';
              bgmAudioRef.current = null;
            }
          }
          break;
        }
        case 'ambiance':
          if (ambianceAudioRef.current) {
            ambianceAudioRef.current.pause();
            ambianceAudioRef.current.src = '';
            ambianceAudioRef.current = null;
          }
          if (event.url) {
            try {
              const a = new Audio(event.url);
              a.volume = event.volume ?? 0.5;
              a.loop = event.loop;
              a.play().catch(() => {});
              ambianceAudioRef.current = a;
            } catch {
              /* ignore */
            }
          }
          break;
        case 'characterExpression':
          setActiveChars((prev) =>
            prev.map((c) => (c.characterId === event.characterId ? { ...c, mood: event.mood } : c))
          );
          break;
        case 'characterMove':
          setActiveChars((prev) =>
            prev.map((c) => (c.characterId === event.characterId ? { ...c, side: event.side } : c))
          );
          break;
        case 'characterShake':
          setActiveChars((prev) =>
            prev.map((c) => (c.characterId === event.characterId ? { ...c, shaking: true } : c))
          );
          setTimeout(
            () =>
              setActiveChars((prev) =>
                prev.map((c) =>
                  c.characterId === event.characterId ? { ...c, shaking: false } : c
                )
              ),
            800
          );
          break;
        case 'vignette':
          setVignette({ visible: event.on, intensity: event.intensity });
          break;
        case 'tint':
          setTintPreset(event.preset);
          break;
        case 'zoom':
          setZoom(event.scale);
          break;
        case 'letterbox':
          setLetterbox(event.on);
          break;
        case 'titleCard':
          setTitleCard({ title: event.title, subtitle: event.subtitle });
          setTimeout(() => setTitleCard(null), Math.max(durationMs + 500, 2000));
          break;
        default:
          break;
      }
    }

    // Fin de séquence — utilise les refs pour éviter la stale closure
    const totalMs = getTotalDurationMs(tracks);
    if (currentTimeMs >= totalMs && !waitingForClickRef.current) onSequenceEndRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTotalDurationMs/tracks/onSequenceEndRef/waitingForClickRef sont stables (refs ou fonctions pures sur données immuables)
  }, [currentTimeMs]);

  // ── Vignette CSS ──────────────────────────────────────────────────────────
  const vignetteStyle = useMemo(() => {
    if (!vignette.visible) return {};
    const sizes = { light: '40%', medium: '60%', strong: '80%' };
    return { boxShadow: `inset 0 0 ${sizes[vignette.intensity]} rgba(0,0,0,0.7)` };
  }, [vignette]);

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (!typewriterDone && dialogue) {
      skipTypewriter();
      return;
    }
    if (waitingForClick) {
      setDialogue(null);
      setWaitingForClick(false); // ticker reprend ici ✓
    }
  }, [typewriterDone, dialogue, waitingForClick, skipTypewriter]);

  const shakeAnimation = shakeKey > 0 ? `cinematicShake${shakeKey} 0.5s ease-in-out` : 'none';

  return (
    <div
      className="relative overflow-hidden flex-shrink-0 cursor-pointer select-none"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px`, animation: shakeAnimation }}
      onClick={handleClick}
      role="presentation"
    >
      {/* Fond + filtre teinte */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#1a1a2e',
          filter:
            [buildFilterCSS(undefined), TINT_FILTERS[tintPreset]].filter(Boolean).join(' ') ||
            undefined,
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      />

      {/* Vignette */}
      {vignette.visible && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-500"
          style={vignetteStyle}
        />
      )}

      {/* Letterbox */}
      <AnimatePresence>
        {letterbox && (
          <>
            <motion.div
              key="lb-top"
              initial={{ height: 0 }}
              animate={{ height: '10%' }}
              exit={{ height: 0 }}
              className="absolute top-0 left-0 right-0 bg-black z-20"
            />
            <motion.div
              key="lb-bot"
              initial={{ height: 0 }}
              animate={{ height: '10%' }}
              exit={{ height: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-black z-20"
            />
          </>
        )}
      </AnimatePresence>

      {/* Personnages */}
      <AnimatePresence>
        {activeChars
          .filter((c) => c.visible)
          .map((ac) => {
            const char = characterLibrary.find((c) => c.id === ac.characterId);
            const spriteUrl = resolveCharacterSprite(char, ac.mood);
            return (
              <motion.div
                key={ac.characterId}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={getSideVariants(ac.side)}
                className={ac.shaking ? 'animate-bounce' : ''}
                style={{
                  position: 'absolute',
                  width: '25%',
                  height: '70%',
                  ...SIDE_POSITIONS[ac.side],
                }}
              >
                {spriteUrl && (
                  <img
                    src={spriteUrl}
                    alt={char?.name ?? ''}
                    className="w-full h-full object-contain object-bottom"
                  />
                )}
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* Carte titre */}
      <AnimatePresence>
        {titleCard && (
          <motion.div
            key="titlecard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30 text-center px-8"
          >
            <p className="text-white text-3xl font-bold drop-shadow-lg">{titleCard.title}</p>
            {titleCard.subtitle && (
              <p className="text-white/75 text-lg mt-3 drop-shadow-md">{titleCard.subtitle}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash */}
      <AnimatePresence>
        {flashKey > 0 && (
          <motion.div
            key={flashKey}
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none z-40"
            style={{ backgroundColor: flashColor === 'white' ? 'white' : 'black' }}
          />
        )}
      </AnimatePresence>

      {/* Fondu */}
      <div
        className="absolute inset-0 pointer-events-none z-40 transition-opacity duration-500"
        style={{
          backgroundColor: fadeOverlay.color === 'black' ? 'black' : 'white',
          opacity: fadeOverlay.visible ? fadeOverlay.opacity : 0,
        }}
      />

      {/* Shake keyframe */}
      {shakeKey > 0 && (
        <style>{`@keyframes cinematicShake${shakeKey} { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-8px,4px)} 40%{transform:translate(8px,-4px)} 60%{transform:translate(-6px,6px)} 80%{transform:translate(6px,-2px)} }`}</style>
      )}

      {/* Dialogue */}
      {dialogue && (
        <DialogueBox
          speaker={speakerDisplayName}
          displayText={displayText}
          hasChoices={false}
          isTypewriterDone={typewriterDone}
          isAtLastDialogue={false}
          speakerPortraitUrl={speakerPortraitUrl ?? undefined}
          speakerIsOnRight={speakerIsOnRight}
          speakerColor={speakerColor}
          config={dialogueBoxConfig}
          scaleFactor={canvasWidth / REFERENCE_CANVAS_WIDTH}
          onAdvance={handleClick}
        />
      )}

      {/* Indicateur "clic pour continuer" */}
      {waitingForClick && typewriterDone && (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute bottom-4 right-4 text-white/70 text-xs z-50 pointer-events-none"
        >
          ▼ Cliquer pour continuer
        </motion.div>
      )}
    </div>
  );
}
