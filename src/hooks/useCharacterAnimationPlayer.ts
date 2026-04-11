/**
 * useCharacterAnimationPlayer — Hook RAF réutilisable pour la lecture de clips FK.
 *
 * Extrait la logique de lecture d'AnimationPreviewView pour la rendre utilisable
 * dans n'importe quel contexte (PreviewPlayer, scène, etc.).
 *
 * Pattern Carmack : mesure le temps réel (rAF timestamp) — pas de setInterval.
 * Pattern Acton : EMPTY_* stables, selector granulaire.
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRigStore } from '../stores/rigStore';
import { usePoseInterpolation } from '../components/modules/DistributionModule/hooks/usePoseInterpolation';
import type { BoneFrameState, BonePose, KeyframeEntry } from '../types/bone';

// ── Fallbacks stables (Acton §15.4) ─────────────────────────────────────────
const EMPTY_POSES: BonePose[] = [];
const EMPTY_KEYFRAMES: KeyframeEntry[] = [];
const EMPTY_OVERRIDES: Record<string, BoneFrameState> = {};

// ── Types ────────────────────────────────────────────────────────────────────

export interface CharacterAnimationPlayerResult {
  /** Rotations + sprite overrides interpolés pour la frame courante. */
  overridesMap: Record<string, BoneFrameState>;
  /** Frame courante (0-based). */
  frame: number;
  /** Nombre total de frames du clip. */
  totalFrames: number;
  /** True si le clip n'est pas en boucle et a atteint sa dernière frame. */
  isComplete: boolean;
}

/**
 * Joue un clip d'animation FK pour un personnage donné.
 *
 * @param characterId - ID du personnage (lien vers CharacterRig via characterId).
 * @param clipId      - ID du clip à jouer. null = retourne EMPTY_OVERRIDES.
 * @param enabled     - Active/désactive la lecture (rAF stoppé si false).
 * @param speed       - Multiplicateur de vitesse (0.5 | 1 | 2). Défaut : 1.
 */
export function useCharacterAnimationPlayer(
  characterId: string | null,
  clipId: string | null,
  enabled: boolean,
  speed = 1
): CharacterAnimationPlayerResult {
  // ── Données du store (selectors granulaires) ─────────────────────────────
  const rig = useRigStore((s) =>
    characterId ? s.rigs.find((r) => r.characterId === characterId) : undefined
  );

  const clip = useMemo(
    () => (clipId ? rig?.animationClips.find((c) => c.id === clipId) : undefined),
    [rig, clipId]
  );

  const poses = rig?.poses ?? EMPTY_POSES;
  const keyframes = clip?.keyframes ?? EMPTY_KEYFRAMES;
  const fps = clip?.fps ?? 24;

  // ── Calcul totalFrames ───────────────────────────────────────────────────
  const totalFrames = useMemo(
    () =>
      keyframes.length > 0
        ? keyframes.reduce((sum, kf) => sum + Math.max(1, Math.round(kf.duration * fps)), 0)
        : 0,
    [keyframes, fps]
  );

  const frameDurationMs = totalFrames > 0 ? 1000 / fps / speed : 0;

  // ── Frame state ──────────────────────────────────────────────────────────
  const [frame, setFrame] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Reset frame à chaque changement de clip
  useEffect(() => {
    setFrame(0);
    lastTimeRef.current = 0;
  }, [clipId]);

  // ── rAF loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || keyframes.length < 2 || frameDurationMs <= 0) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const isLoop = clip?.loop ?? false;

    const tick = (now: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      if (now - lastTimeRef.current >= frameDurationMs) {
        lastTimeRef.current = now;
        setFrame((f) => (isLoop ? (f + 1) % totalFrames : Math.min(f + 1, totalFrames - 1)));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, keyframes.length, frameDurationMs, totalFrames, clip?.loop]);

  // ── Interpolation ────────────────────────────────────────────────────────
  // usePoseInterpolation est pure — pas d'accès store ici (invariant §3)
  const overridesMap = usePoseInterpolation(poses, keyframes, frame, fps);

  // ── Early exit si pas de clip ────────────────────────────────────────────
  if (!clipId || !clip || keyframes.length < 2) {
    return { overridesMap: EMPTY_OVERRIDES, frame: 0, totalFrames: 0, isComplete: false };
  }

  const isComplete = !clip.loop && frame >= totalFrames - 1;

  return { overridesMap, frame, totalFrames, isComplete };
}
