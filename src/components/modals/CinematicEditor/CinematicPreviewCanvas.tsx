/**
 * CinematicPreviewCanvas — Aperçu statique de la séquence cinématique
 *
 * Calcule l'état visuel accumulé jusqu'à `playheadIndex` (0-based) et
 * rend un snapshot statique (pas d'animation, pas de typewriter).
 *
 * Logique : même rendu que CinematicPlayer mais sans Framer Motion.
 * - fond + personnages + effets CSS + dialogue simplifié
 */
import { useMemo } from 'react';
import type { CinematicEvent, TintPreset } from '@/types';
import type { Character } from '@/types/characters';
import { resolveCharacterSprite } from '@/utils/characterSprite';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActiveChar {
  characterId: string;
  mood: string;
  side: string;
}

interface PreviewState {
  bgUrl: string;
  characters: ActiveChar[];
  tint: TintPreset;
  zoom: number;
  letterbox: boolean;
  vignette: { visible: boolean; intensity: 'light' | 'medium' | 'strong' };
  dialogue: { speaker: string; speakerMood?: string; text: string } | null;
  titleCard: { title: string; subtitle?: string } | null;
  /** Fondu vers le noir/blanc (quand l'event courant est un fade) */
  fadeOpaque: boolean;
  fadeColor: 'black' | 'white';
}

// ── Constantes ────────────────────────────────────────────────────────────────

const TINT_FILTERS: Record<TintPreset, string> = {
  none: '',
  memory: 'sepia(0.7) brightness(0.9)',
  danger: 'saturate(1.5) hue-rotate(-20deg) brightness(0.85)',
  cold: 'saturate(0.6) hue-rotate(180deg) brightness(0.9)',
  warm: 'sepia(0.4) saturate(1.4) brightness(1.05)',
  dream: 'saturate(0.8) hue-rotate(260deg) brightness(0.9)',
};

const VIGNETTE_SIZES = { light: '40%', medium: '60%', strong: '80%' } as const;

// ── Accumulateur d'état ───────────────────────────────────────────────────────

function accumulateState(
  events: CinematicEvent[],
  upToIndex: number,
  initialBg: string
): PreviewState {
  const state: PreviewState = {
    bgUrl: initialBg,
    characters: [],
    tint: 'none',
    zoom: 1,
    letterbox: false,
    vignette: { visible: false, intensity: 'medium' },
    dialogue: null,
    titleCard: null,
    fadeOpaque: false,
    fadeColor: 'black',
  };

  const limit = Math.min(upToIndex, events.length - 1);
  for (let i = 0; i <= limit; i++) {
    const ev = events[i];
    switch (ev.type) {
      case 'background':
        state.bgUrl = ev.url;
        if (i < upToIndex) {
          state.dialogue = null;
          state.titleCard = null;
        }
        break;
      case 'characterEnter':
        state.characters = state.characters.filter((c) => c.characterId !== ev.characterId);
        state.characters.push({ characterId: ev.characterId, mood: ev.mood, side: ev.side });
        break;
      case 'characterExit':
        state.characters = state.characters.filter((c) => c.characterId !== ev.characterId);
        break;
      case 'tint':
        state.tint = ev.preset;
        break;
      case 'zoom':
        state.zoom = ev.scale;
        break;
      case 'letterbox':
        state.letterbox = ev.on;
        break;
      case 'vignette':
        state.vignette = { visible: ev.on, intensity: ev.intensity };
        break;
      case 'dialogue':
        state.dialogue = { speaker: ev.speaker, speakerMood: ev.speakerMood, text: ev.text };
        state.titleCard = null;
        break;
      case 'titleCard':
        state.titleCard = { title: ev.title, subtitle: ev.subtitle };
        state.dialogue = null;
        break;
      case 'fade':
        // Affiche le fondu uniquement sur l'event courant
        if (i === upToIndex) {
          state.fadeOpaque = ev.direction === 'out';
          state.fadeColor = ev.color;
        }
        break;
      case 'flash':
        // Transitoire — pas d'état persistant, mais marque visuellement si c'est l'event courant
        if (i === upToIndex) {
          state.fadeOpaque = true;
          state.fadeColor = ev.color;
        }
        break;
      case 'characterExpression':
        // Change le mood/sprite du personnage déjà à l'écran
        state.characters = state.characters.map((c) =>
          c.characterId === ev.characterId ? { ...c, mood: ev.mood } : c
        );
        break;
      case 'characterMove':
        // Déplace le personnage vers une nouvelle position
        state.characters = state.characters.map((c) =>
          c.characterId === ev.characterId ? { ...c, side: ev.side } : c
        );
        break;
      // screenShake, wait, sfx, bgm, bgmStop, ambiance, characterShake → pas d'état visuel persistant
    }
  }

  return state;
}

// ── Composant ────────────────────────────────────────────────────────────────

interface Props {
  events: CinematicEvent[];
  playheadIndex: number;
  /** backgroundUrl de la scène (état initial avant tout événement) */
  backgroundUrl: string;
  characterLibrary: Character[];
}

export function CinematicPreviewCanvas({
  events,
  playheadIndex,
  backgroundUrl,
  characterLibrary,
}: Props) {
  const state = useMemo(
    () => accumulateState(events, playheadIndex, backgroundUrl),
    [events, playheadIndex, backgroundUrl]
  );

  const tintFilter = TINT_FILTERS[state.tint];
  const vignetteStyle = state.vignette.visible
    ? { boxShadow: `inset 0 0 ${VIGNETTE_SIZES[state.vignette.intensity]} rgba(0,0,0,0.75)` }
    : {};

  const getSidePos = (side: string): React.CSSProperties => {
    switch (side) {
      case 'left':
        return { left: '5%', bottom: 0 };
      case 'right':
        return { right: '5%', bottom: 0 };
      case 'top':
        return { left: '37%', bottom: '60%' };
      default:
        return { left: '37%', bottom: 0 };
    }
  };

  // ── Animation screenShake ──────────────────────────────────────────────────
  const currentEventType = events[playheadIndex]?.type;
  const isShaking = currentEventType === 'screenShake' || currentEventType === 'characterShake';
  // Clé unique → force re-mount → relance l'animation CSS à chaque navigation
  const shakeKey = isShaking ? `shake-${playheadIndex}-${events[playheadIndex]?.id}` : 'static';

  // Si pas d'événements → placeholder
  if (events.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-[var(--color-text-muted)] rounded-lg border border-[var(--color-border-base)]">
        <span className="text-3xl opacity-40">🎬</span>
        <p className="text-xs">Ajoute des événements pour voir l'aperçu</p>
      </div>
    );
  }

  return (
    <>
      {/* Keyframe d'animation secousse — injectée une seule fois */}
      <style>{`
        @keyframes previewShake {
          0%,100%{transform:translate(0,0)}
          20%{transform:translate(-6px,3px)}
          40%{transform:translate(6px,-3px)}
          60%{transform:translate(-4px,5px)}
          80%{transform:translate(4px,-2px)}
        }
        .preview-shaking { animation: previewShake 0.45s ease-in-out; }
      `}</style>
      <div
        key={shakeKey}
        className={`absolute inset-0 overflow-hidden rounded-lg border border-[var(--color-border-base)] bg-[#1a1a2e]${isShaking ? ' preview-shaking' : ''}`}
      >
        {/* Fond avec filtre de teinte */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: state.bgUrl ? `url(${state.bgUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#1a1a2e',
            filter: tintFilter || undefined,
            transform: `scale(${state.zoom})`,
            transformOrigin: 'center center',
          }}
        />

        {/* Vignette */}
        {state.vignette.visible && (
          <div className="absolute inset-0 pointer-events-none" style={vignetteStyle} />
        )}

        {/* Letterbox — barres cinéma */}
        {state.letterbox && (
          <>
            <div
              className="absolute top-0 left-0 right-0 bg-black z-20"
              style={{ height: '10%' }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 bg-black z-20"
              style={{ height: '10%' }}
            />
          </>
        )}

        {/* Personnages */}
        {state.characters.map((ac) => {
          const char = characterLibrary.find((c) => c.id === ac.characterId);
          const spriteUrl = resolveCharacterSprite(char, ac.mood);
          const pos = getSidePos(ac.side);
          return (
            <div
              key={ac.characterId}
              className="absolute"
              style={{ width: '25%', height: '70%', ...pos }}
            >
              {spriteUrl && (
                <img
                  src={spriteUrl}
                  alt={char?.name ?? ''}
                  className="w-full h-full object-contain object-bottom"
                />
              )}
            </div>
          );
        })}

        {/* Carte titre */}
        {state.titleCard && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-30 text-center px-4 border border-violet-500/30">
            <span className="text-2xl mb-2 opacity-60" aria-hidden="true">
              🎞️
            </span>
            {state.titleCard.title ? (
              <>
                <p
                  className="text-white font-bold drop-shadow-lg"
                  style={{ fontSize: 'clamp(12px, 3vw, 24px)' }}
                >
                  {state.titleCard.title}
                </p>
                {state.titleCard.subtitle && (
                  <p
                    className="text-white/70 mt-1 drop-shadow"
                    style={{ fontSize: 'clamp(10px, 2vw, 16px)' }}
                  >
                    {state.titleCard.subtitle}
                  </p>
                )}
              </>
            ) : (
              <div className="border border-dashed border-white/20 rounded px-4 py-1">
                <span className="text-white/25 text-[9px]">saisir un titre →</span>
              </div>
            )}
          </div>
        )}

        {/* Fondu (overlay opaque pour les events fade/flash) */}
        <div
          className="absolute inset-0 pointer-events-none z-40 transition-opacity"
          style={{
            backgroundColor: state.fadeColor === 'black' ? 'black' : 'white',
            opacity: state.fadeOpaque ? 1 : 0,
          }}
        />

        {/* Dialogue simplifié (texte complet, pas de typewriter) */}
        {state.dialogue && (
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-black/80 px-3 py-2 border-t border-white/10">
            {state.dialogue.speaker && (
              <p className="text-violet-300 text-[10px] font-bold mb-0.5 truncate">
                {/* Résoudre le nom du personnage depuis la bibliothèque */}
                {characterLibrary.find((c) => c.id === state.dialogue!.speaker)?.name ??
                  state.dialogue.speaker}
              </p>
            )}
            <p
              className="text-white leading-snug line-clamp-3"
              style={{ fontSize: 'clamp(9px, 1.5vw, 13px)' }}
            >
              {state.dialogue.text || <span className="opacity-40 italic">(texte vide)</span>}
            </p>
          </div>
        )}

        {/* Badge événement courant (si pas de dialogue/titleCard) */}
        {!state.dialogue && !state.titleCard && events[playheadIndex] && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/70 text-[10px] pointer-events-none">
            {(() => {
              const ev = events[playheadIndex];
              const labels: Partial<Record<string, string>> = {
                fade: '🌑 Fondu',
                flash: '⚡ Flash',
                screenShake: '📳 Tremblement',
                wait: '⏱️ Pause',
                sfx: '🔊 Effet sonore',
                bgm: '🎵 Musique de fond',
                bgmStop: '🔇 Arrêter musique',
                characterShake: '😨 Personnage tremble',
                characterExpression: '🎭 Changer expression',
                characterMove: '🚶 Déplacer personnage',
                ambiance: "🌧️ Son d'ambiance",
              };
              return labels[ev.type] ?? ev.type;
            })()}
          </div>
        )}
      </div>
    </>
  );
}
