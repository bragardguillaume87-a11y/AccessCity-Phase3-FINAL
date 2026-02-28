/**
 * CinematicPlayer — Lecteur de séquences cinématiques
 *
 * Joue les CinematicEvent[] d'une scène en auto-play séquentiel.
 * Utilise Framer Motion pour les effets visuels (fade, flash, zoom, tint…).
 * Logique : state machine par index — chaque event traité via useEffect.
 */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { DialogueBox } from '@/components/ui/DialogueBox';
import { useDialogueBoxConfig } from '@/hooks/useDialogueBoxConfig';
import { useSpeakerLayout } from '@/hooks/useSpeakerLayout';
import { buildFilterCSS } from '@/utils/backgroundFilter';
import type { CinematicEvent, TintPreset } from '@/types';
import type { Character } from '@/types/characters';
import { CINEMATIC_SPEED_MS } from '@/types/cinematic';

// ── Types internes ────────────────────────────────────────────────────────────

interface ActiveCharacter {
  characterId: string;
  mood: string;
  side: 'left' | 'right' | 'top' | 'bottom';
  visible: boolean;
  shaking: boolean;
}

// CSS filters by tint preset
const TINT_FILTERS: Record<TintPreset, string> = {
  none:   '',
  memory: 'sepia(0.7) brightness(0.9)',
  danger: 'saturate(1.5) hue-rotate(-20deg) brightness(0.85)',
  cold:   'saturate(0.6) hue-rotate(180deg) brightness(0.9)',
  warm:   'sepia(0.4) saturate(1.4) brightness(1.05)',
  dream:  'saturate(0.8) hue-rotate(260deg) brightness(0.9)',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  events: CinematicEvent[];
  backgroundUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  characterLibrary: Character[];
  /** Callback quand tous les events sont joués (pour passer à la scène suivante) */
  onSequenceEnd: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CinematicPlayer({ events, backgroundUrl: initialBg, canvasWidth, canvasHeight, characterLibrary, onSequenceEnd }: Props) {
  // ── Visual state ──────────────────────────────────────────────────────────
  const [eventIndex, setEventIndex] = useState(0);
  const [bgUrl, setBgUrl] = useState(initialBg);
  const [activeChars, setActiveChars] = useState<ActiveCharacter[]>([]);
  const [fadeOverlay, setFadeOverlay] = useState<{ visible: boolean; color: 'black' | 'white'; opacity: number }>({ visible: false, color: 'black', opacity: 0 });
  const [flashKey, setFlashKey] = useState(0);
  const [flashColor, setFlashColor] = useState<'black' | 'white'>('white');
  const [shakeKey, setShakeKey] = useState(0);
  const [vignette, setVignette] = useState<{ visible: boolean; intensity: 'light' | 'medium' | 'strong' }>({ visible: false, intensity: 'medium' });
  const [tintPreset, setTintPreset] = useState<TintPreset>('none');
  const [zoom, setZoom] = useState(1);
  const [letterbox, setLetterbox] = useState(false);
  const [titleCard, setTitleCard] = useState<{ title: string; subtitle?: string } | null>(null);
  const [dialogue, setDialogue] = useState<{ speaker: string; speakerMood?: string; text: string; autoAdvance: boolean } | null>(null);
  const [waitingForClick, setWaitingForClick] = useState(false);

  const advanceRef = useRef<() => void>(() => {});

  const advance = useCallback(() => {
    setEventIndex(i => i + 1);
    setDialogue(null);
    setWaitingForClick(false);
    setTitleCard(null);
  }, []);

  advanceRef.current = advance;

  // ── Dialogue typewriter ───────────────────────────────────────────────────
  const dialogueBoxConfig = useDialogueBoxConfig(undefined);
  const { displayText, isComplete: typewriterDone, skip: skipTypewriter } = useTypewriter(
    dialogue?.text ?? '',
    { speed: dialogueBoxConfig.typewriterSpeed, cursor: true, contextAware: true }
  );

  const { speakerDisplayName, speakerIsOnRight, speakerPortraitUrl, speakerColor } = useSpeakerLayout({
    speakerNameOrId: dialogue?.speaker,
    sceneCharacters: [],
    characterLibrary,
    config: dialogueBoxConfig,
    moodOverrides: dialogue?.speakerMood ? { [dialogue.speaker]: dialogue.speakerMood } : {},
  });

  // Auto-advance dialogue when typewriter is done (autoAdvance mode)
  useEffect(() => {
    if (!dialogue || !typewriterDone || waitingForClick) return;
    const timer = setTimeout(() => { advanceRef.current(); }, 1200);
    return () => clearTimeout(timer);
  }, [typewriterDone, dialogue, waitingForClick]);

  // ── Event processor ───────────────────────────────────────────────────────
  useEffect(() => {
    if (eventIndex >= events.length) {
      onSequenceEnd();
      return;
    }

    const event = events[eventIndex];
    const durationMs = 'speed' in event ? CINEMATIC_SPEED_MS[event.speed] : 0;

    const immediateAdvance = () => { advanceRef.current(); };
    const timedAdvance = (ms: number) => {
      const t = setTimeout(() => advanceRef.current(), Math.max(ms, 50));
      return () => clearTimeout(t);
    };

    switch (event.type) {
      case 'fade': {
        const targetOpacity = event.direction === 'out' ? 1 : 0;
        const startOpacity  = event.direction === 'out' ? 0 : 1;
        setFadeOverlay({ visible: true, color: event.color, opacity: startOpacity });
        const t1 = setTimeout(() => setFadeOverlay({ visible: true, color: event.color, opacity: targetOpacity }), 50);
        const t2 = setTimeout(() => {
          if (event.direction === 'in') setFadeOverlay({ visible: false, color: event.color, opacity: 0 });
          advanceRef.current();
        }, durationMs + 100);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
      case 'flash': {
        setFlashColor(event.color);
        setFlashKey(k => k + 1);
        return timedAdvance(durationMs + 150);
      }
      case 'screenShake': {
        setShakeKey(k => k + 1);
        return timedAdvance(durationMs + 300);
      }
      case 'background': {
        setBgUrl(event.url);
        return timedAdvance(200);
      }
      case 'characterEnter': {
        setActiveChars(prev => {
          const filtered = prev.filter(c => c.characterId !== event.characterId);
          return [...filtered, { characterId: event.characterId, mood: event.mood, side: event.side, visible: true, shaking: false }];
        });
        return timedAdvance(durationMs + 100);
      }
      case 'characterExit': {
        setActiveChars(prev => prev.map(c => c.characterId === event.characterId ? { ...c, visible: false } : c));
        const t = setTimeout(() => {
          setActiveChars(prev => prev.filter(c => c.characterId !== event.characterId));
          advanceRef.current();
        }, durationMs + 100);
        return () => clearTimeout(t);
      }
      case 'dialogue': {
        setDialogue({ speaker: event.speaker, speakerMood: event.speakerMood, text: event.text, autoAdvance: event.autoAdvance });
        if (!event.autoAdvance) { setWaitingForClick(true); }
        return undefined; // advance is triggered by click or typewriter completion
      }
      case 'wait': {
        return timedAdvance(Math.max(durationMs, 100));
      }
      case 'sfx': {
        try { const a = new Audio(event.url); a.volume = event.volume ?? 0.7; a.play().catch(() => {}); } catch { /* ignore */ }
        immediateAdvance();
        return;
      }
      case 'bgm': {
        // Simple bgm playback (audioManager would be better but adds coupling)
        try { const a = new Audio(event.url); a.volume = event.volume ?? 0.7; a.loop = true; a.play().catch(() => {}); } catch { /* ignore */ }
        return timedAdvance(100);
      }
      case 'vignette': {
        setVignette({ visible: event.on, intensity: event.intensity });
        return timedAdvance(durationMs + 100);
      }
      case 'tint': {
        setTintPreset(event.preset);
        return timedAdvance(durationMs + 100);
      }
      case 'zoom': {
        setZoom(event.scale);
        return timedAdvance(durationMs + 200);
      }
      case 'letterbox': {
        setLetterbox(event.on);
        return timedAdvance(durationMs + 100);
      }
      case 'titleCard': {
        setTitleCard({ title: event.title, subtitle: event.subtitle });
        return timedAdvance(Math.max(durationMs + 500, 2000));
      }
      case 'characterShake': {
        setActiveChars(prev => prev.map(c => c.characterId === event.characterId ? { ...c, shaking: true } : c));
        const t = setTimeout(() => {
          setActiveChars(prev => prev.map(c => c.characterId === event.characterId ? { ...c, shaking: false } : c));
          advanceRef.current();
        }, 800);
        return () => clearTimeout(t);
      }
      default:
        immediateAdvance();
        return undefined;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIndex]);

  // ── Vignette intensity CSS ────────────────────────────────────────────────
  const vignetteStyle = useMemo(() => {
    if (!vignette.visible) return {};
    const sizes = { light: '40%', medium: '60%', strong: '80%' };
    return { boxShadow: `inset 0 0 ${sizes[vignette.intensity]} rgba(0,0,0,0.7)` };
  }, [vignette]);

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (!typewriterDone && dialogue) { skipTypewriter(); return; }
    if (waitingForClick) { advance(); return; }
  }, [typewriterDone, dialogue, waitingForClick, skipTypewriter, advance]);

  // ── Character sprite position ─────────────────────────────────────────────
  const getSidePosition = (side: string): { left?: string; right?: string; bottom: string } => {
    switch (side) {
      case 'left':   return { left: '5%', bottom: '0' };
      case 'right':  return { right: '5%', bottom: '0' };
      case 'top':    return { left: '50%', bottom: '60%' };
      default:       return { left: '50%', bottom: '0' };
    }
  };

  const getSideVariants = (side: string) => ({
    initial: { opacity: 0, x: side === 'left' ? -60 : side === 'right' ? 60 : 0, y: side === 'bottom' ? 60 : 0 },
    animate: { opacity: 1, x: 0, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: side === 'left' ? -60 : side === 'right' ? 60 : 0, transition: { duration: 0.3 } },
  });

  return (
    <div
      className="relative overflow-hidden flex-shrink-0 cursor-pointer select-none"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
      onClick={handleClick}
      role="presentation"
    >
      {/* Background with tint filter */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#1a1a2e',
          filter: [buildFilterCSS(undefined), TINT_FILTERS[tintPreset]].filter(Boolean).join(' ') || undefined,
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      />

      {/* Vignette overlay */}
      {vignette.visible && (
        <div className="absolute inset-0 pointer-events-none transition-all duration-500" style={vignetteStyle} />
      )}

      {/* Letterbox — top/bottom bars */}
      <AnimatePresence>
        {letterbox && (<>
          <motion.div key="lb-top" initial={{ height: 0 }} animate={{ height: '10%' }} exit={{ height: 0 }}
            className="absolute top-0 left-0 right-0 bg-black z-20" />
          <motion.div key="lb-bot" initial={{ height: 0 }} animate={{ height: '10%' }} exit={{ height: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-black z-20" />
        </>)}
      </AnimatePresence>

      {/* Characters */}
      <AnimatePresence>
        {activeChars.filter(c => c.visible).map(ac => {
          const char = characterLibrary.find(c => c.id === ac.characterId);
          const spriteUrl = char?.sprites?.[ac.mood] ?? char?.sprites?.['neutral'] ?? (char?.sprites ? Object.values(char.sprites)[0] : undefined);
          const pos = getSidePosition(ac.side);
          const variants = getSideVariants(ac.side);

          return (
            <motion.div
              key={ac.characterId}
              initial="initial" animate="animate" exit="exit"
              variants={variants}
              className={ac.shaking ? 'animate-bounce' : ''}
              style={{ position: 'absolute', width: '25%', height: '70%', ...pos }}
            >
              {spriteUrl && (
                <img src={spriteUrl} alt={char?.name ?? ''} className="w-full h-full object-contain object-bottom" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Title card overlay */}
      <AnimatePresence>
        {titleCard && (
          <motion.div
            key="titlecard"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30 text-center px-8"
          >
            <p className="text-white text-3xl font-bold drop-shadow-lg">{titleCard.title}</p>
            {titleCard.subtitle && (
              <p className="text-white/75 text-lg mt-3 drop-shadow-md">{titleCard.subtitle}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash overlay */}
      <AnimatePresence>
        {flashKey > 0 && (
          <motion.div
            key={flashKey}
            initial={{ opacity: 0.9 }} animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none z-40"
            style={{ backgroundColor: flashColor === 'white' ? 'white' : 'black' }}
          />
        )}
      </AnimatePresence>

      {/* Fade overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-40 transition-opacity duration-500"
        style={{
          backgroundColor: fadeOverlay.color === 'black' ? 'black' : 'white',
          opacity: fadeOverlay.visible ? fadeOverlay.opacity : 0,
        }}
      />

      {/* Screen shake — triggered by key change */}
      <style>{shakeKey > 0 ? `@keyframes cinematicShake { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-8px,4px)} 40%{transform:translate(8px,-4px)} 60%{transform:translate(-6px,6px)} 80%{transform:translate(6px,-2px)} }` : ''}</style>

      {/* Dialogue box */}
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
          scaleFactor={canvasWidth / 960}
          onAdvance={handleClick}
        />
      )}

      {/* "Clic pour continuer" indicator */}
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
