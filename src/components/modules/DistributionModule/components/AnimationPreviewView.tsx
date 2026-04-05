import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { useRigStore } from '@/stores/rigStore';
import type { CharacterRig, KeyframeEntry } from '@/types/bone';
import { getRootBones } from '../utils/boneUtils';
import { useBoneImageCache } from '../hooks/useBoneImageCache';
import { usePoseInterpolation } from '../hooks/usePoseInterpolation';
import { BoneGroup } from './BoneGroup';
import { AnimationTimeline } from './AnimationTimeline';
import { IosToggle } from '@/components/ui/IosToggle';

// Fallbacks stables (Acton §15.4 — module-level constants)
const EMPTY_BONES: CharacterRig['bones'] = [];
const EMPTY_PARTS: CharacterRig['parts'] = [];
const EMPTY_POSES: CharacterRig['poses'] = [];
const EMPTY_KEYFRAMES: KeyframeEntry[] = [];

// NOOP stables pour BoneGroup preview (module-level → référence stable → mémo non brisé)
const NOOP_SELECT = () => {};
const NOOP_ROTATE = () => {};

interface AnimationPreviewViewProps {
  characterId: string;
  selectedClipId: string | null;
  isPlaying: boolean;
  onPlayToggle: () => void;
}

/**
 * AnimationPreviewView — Lecteur animation (requestAnimationFrame).
 * Interpole entre poses via usePoseInterpolation (KeyframeEntry[] avec durée + easing).
 * Onion Skinning : 2 layers supplémentaires Konva (prev + next frame) à opacité réduite.
 * §6 konva-patterns : layers onion avec listening={false}.
 */
export function AnimationPreviewView({
  characterId,
  selectedClipId,
  isPlaying,
  onPlayToggle,
}: AnimationPreviewViewProps) {
  const rig = useRigStore((s) => s.rigs.find((r) => r.characterId === characterId));
  const bones = rig?.bones ?? EMPTY_BONES;
  const parts = rig?.parts ?? EMPTY_PARTS;

  const clip = rig?.animationClips.find((c) => c.id === selectedClipId);
  const keyframes = clip?.keyframes ?? EMPTY_KEYFRAMES;
  const fps = clip?.fps ?? 24;
  const poses = rig?.poses ?? EMPTY_POSES;

  const imageCache = useBoneImageCache(parts);
  // useMemo : évite une nouvelle référence array à chaque render → stabilise les props BoneGroup
  const rootBones = useMemo(() => getRootBones(bones), [bones]);

  // ── Stage responsive (ResizeObserver) ────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 400 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Vitesse de lecture : 0.5× | 1× | 2× ─────────────────────────────────
  const [speed, setSpeed] = useState(1);

  // ── Onion Skinning toggle ────────────────────────────────────────────────
  const [showOnionSkin, setShowOnionSkin] = useState(false);

  // ── Frame courante (0-based) ─────────────────────────────────────────────
  const [frame, setFrame] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Durée totale du clip en frames (somme des durées des keyframes)
  const totalFrames =
    keyframes.length > 0
      ? keyframes.reduce((sum, kf) => sum + Math.max(1, Math.round(kf.duration * fps)), 0)
      : 0;

  const frameDurationMs = totalFrames > 0 ? (1000 / fps) * (1 / speed) : 0;

  // ── Seek ─────────────────────────────────────────────────────────────────
  const handleSeek = useCallback((f: number) => {
    setFrame(Math.max(0, f));
  }, []);

  // ── rAF loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || keyframes.length < 2) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = (now: number) => {
      if (now - lastTimeRef.current >= frameDurationMs) {
        lastTimeRef.current = now;
        setFrame((f) => (clip?.loop ? (f + 1) % totalFrames : Math.min(f + 1, totalFrames - 1)));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, keyframes.length, frameDurationMs, totalFrames, clip?.loop]);

  // Reset frame on clip change
  useEffect(() => {
    setFrame(0);
  }, [selectedClipId]);

  // ── Interpolation frame courante ─────────────────────────────────────────
  const overridesMap = usePoseInterpolation(poses, keyframes, frame, fps);

  // ── Onion skin : frames -2 et +2 (§7 plan) ───────────────────────────────
  const prevFrame = Math.max(0, frame - 2);
  const nextFrame = totalFrames > 0 ? Math.min(frame + 2, totalFrames - 1) : 0;
  const prevOverrides = usePoseInterpolation(
    poses,
    showOnionSkin ? keyframes : EMPTY_KEYFRAMES,
    prevFrame,
    fps
  );
  const nextOverrides = usePoseInterpolation(
    poses,
    showOnionSkin ? keyframes : EMPTY_KEYFRAMES,
    nextFrame,
    fps
  );

  if (!rig || bones.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 32 }}>🎬</span>
        <p style={{ fontSize: 13 }}>Créez un rig et des poses pour prévisualiser.</p>
      </div>
    );
  }

  const rigOriginX = rig.originX;
  const rigOriginY = rig.originY;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Barre d'en-tête preview — IosToggle Onion Skin */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          borderBottom: '1px solid var(--color-border-base)',
          background: 'var(--color-bg-elevated)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          🧅 Pelure d'oignon
        </span>
        <IosToggle
          enabled={showOnionSkin}
          onToggle={() => setShowOnionSkin((s) => !s)}
          label="pelure d'oignon"
        />
      </div>

      {/* Canvas preview */}
      {/* §8 touchAction: 'none' — konva-patterns */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'hidden', touchAction: 'none', background: 'rgba(0,0,0,0.3)' }}
      >
        <Stage width={canvasSize.w} height={canvasSize.h}>
          {/* Onion skin — frame précédente (opacity 0.2, §6 konva-patterns listening=false) */}
          {showOnionSkin && (
            <Layer listening={false} opacity={0.2}>
              <Group x={rigOriginX} y={rigOriginY}>
                {rootBones.map((bone) => (
                  <BoneGroup
                    key={bone.id}
                    bone={bone}
                    allBones={bones}
                    allParts={parts}
                    imageCache={imageCache}
                    activeTool="select"
                    selectedBoneId={null}
                    overridesMap={prevOverrides}
                    rotationOverride={prevOverrides[bone.id]?.rotation}
                    onSelectBone={NOOP_SELECT}
                    onRotateBone={NOOP_ROTATE}
                  />
                ))}
              </Group>
            </Layer>
          )}

          {/* Layer principal */}
          <Layer>
            <Group x={rigOriginX} y={rigOriginY}>
              {rootBones.map((bone) => (
                <BoneGroup
                  key={bone.id}
                  bone={bone}
                  allBones={bones}
                  allParts={parts}
                  imageCache={imageCache}
                  activeTool="select"
                  selectedBoneId={null}
                  overridesMap={overridesMap}
                  rotationOverride={overridesMap[bone.id]?.rotation}
                  onSelectBone={NOOP_SELECT}
                  onRotateBone={NOOP_ROTATE}
                />
              ))}
            </Group>
          </Layer>

          {/* Onion skin — frame suivante (opacity 0.15, §6 konva-patterns listening=false) */}
          {showOnionSkin && (
            <Layer listening={false} opacity={0.15}>
              <Group x={rigOriginX} y={rigOriginY}>
                {rootBones.map((bone) => (
                  <BoneGroup
                    key={bone.id}
                    bone={bone}
                    allBones={bones}
                    allParts={parts}
                    imageCache={imageCache}
                    activeTool="select"
                    selectedBoneId={null}
                    overridesMap={nextOverrides}
                    rotationOverride={nextOverrides[bone.id]?.rotation}
                    onSelectBone={NOOP_SELECT}
                    onRotateBone={NOOP_ROTATE}
                  />
                ))}
              </Group>
            </Layer>
          )}
        </Stage>
      </div>

      {/* Timeline + contrôles */}
      {clip && (
        <AnimationTimeline
          keyframes={keyframes}
          currentFrame={frame}
          totalFrames={totalFrames}
          fps={fps}
          isPlaying={isPlaying}
          speed={speed}
          onPlayToggle={onPlayToggle}
          onSeek={handleSeek}
          onSpeedChange={setSpeed}
        />
      )}
    </div>
  );
}
