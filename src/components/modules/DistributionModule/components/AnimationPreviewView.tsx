import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { useRigStore } from '@/stores/rigStore';
import type { CharacterRig } from '@/types/bone';
import { getRootBones } from '../utils/boneUtils';
import { useBoneImageCache } from '../hooks/useBoneImageCache';
import { usePoseInterpolation } from '../hooks/usePoseInterpolation';
import { BoneGroup } from './BoneGroup';

// Fallbacks stables (Acton §15.4)
const EMPTY_BONES: CharacterRig['bones'] = [];
const EMPTY_PARTS: CharacterRig['parts'] = [];
const EMPTY_POSE_IDS: string[] = [];

interface AnimationPreviewViewProps {
  characterId: string;
  selectedClipId: string | null;
  isPlaying: boolean;
}

/**
 * AnimationPreviewView — Lecteur animation (requestAnimationFrame).
 * Interpole entre poses via usePoseInterpolation.
 */
export function AnimationPreviewView({
  characterId,
  selectedClipId,
  isPlaying,
}: AnimationPreviewViewProps) {
  const rig = useRigStore((s) => s.rigs.find((r) => r.characterId === characterId));
  const bones = rig?.bones ?? EMPTY_BONES;
  const parts = rig?.parts ?? EMPTY_PARTS;

  const clip = rig?.animationClips.find((c) => c.id === selectedClipId);
  const poseIds = clip?.poseIds ?? EMPTY_POSE_IDS;
  const fps = clip?.fps ?? 24;
  const poses = rig?.poses ?? [];

  const imageCache = useBoneImageCache(parts);
  const rootBones = getRootBones(bones);

  // Fix #7 — Stage responsive (ResizeObserver — même pattern que BoneCanvasView)
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

  const [frame, setFrame] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameDuration = 1000 / fps;

  // rAF loop
  useEffect(() => {
    if (!isPlaying || poseIds.length < 2) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = (now: number) => {
      if (now - lastTimeRef.current >= frameDuration) {
        lastTimeRef.current = now;
        setFrame((f) => {
          const totalFrames = poseIds.length * Math.max(1, Math.round(fps));
          return clip?.loop ? (f + 1) % totalFrames : Math.min(f + 1, totalFrames - 1);
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, poseIds.length, fps, frameDuration, clip?.loop]);

  // Reset frame when clip changes
  useEffect(() => {
    setFrame(0);
  }, [selectedClipId]);

  const overridesMap = usePoseInterpolation(poses, poseIds, frame, fps);

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

  return (
    // §8 touchAction: 'none'
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'hidden', touchAction: 'none', background: 'rgba(0,0,0,0.3)' }}
    >
      <Stage width={canvasSize.w} height={canvasSize.h}>
        <Layer>
          <Group x={rig.originX} y={rig.originY}>
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
                onSelectBone={() => {}}
                onRotateBone={() => {}}
              />
            ))}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
