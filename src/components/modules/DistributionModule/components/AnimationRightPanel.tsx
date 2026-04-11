/**
 * AnimationRightPanel — Orchestrateur (workflow progressif en 3 étapes).
 *
 * Mode Débutant : une étape à la fois (Miyamoto §1.3 — découverte progressive).
 * Mode Expert   : toutes les sections visibles en permanence (comportement historique).
 *
 * Sous-composants dans AnimationRightPanel/ :
 *   ClipsSection · PosesSection · SequenceSection · AutoClipsSection
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { useRigStore } from '@/stores/rigStore';
import { DEFAULT_ANIMATION_FPS, DEFAULT_KEYFRAME_DURATION } from '@/types/bone';
import type { KeyframeEntry } from '@/types/bone';
import type { EasingType, BezierPoints } from '@/utils/animationEasing';
import type { PoseTemplate } from '@/config/poseTemplates';

import { uiSounds } from '@/utils/uiSounds';
import { ClipsSection } from './AnimationRightPanel/ClipsSection';
import { PosesSection } from './AnimationRightPanel/PosesSection';
import { SequenceSection } from './AnimationRightPanel/SequenceSection';
import { AutoClipsSection } from './AnimationRightPanel/AutoClipsSection';

interface AnimationRightPanelProps {
  characterId: string;
  selectedClipId: string | null;
  selectedPoseId: string | null;
  isPlaying: boolean;
  isBeginnerMode?: boolean;
  onSelectClip: (id: string | null) => void;
  onSelectPose: (id: string | null) => void;
  onPlayToggle: () => void;
  editingPoseId?: string | null;
  onLoadPose?: (poseId: string) => void;
  onUpdatePose?: () => void;
  onCancelEdit?: () => void;
  onApplyPoseTemplate?: (template: PoseTemplate) => void;
  onPoseHover?: (poseId: string | null) => void;
}

export function AnimationRightPanel({
  characterId,
  selectedClipId,
  selectedPoseId,
  isPlaying,
  isBeginnerMode = false,
  onSelectClip,
  onSelectPose,
  onPlayToggle,
  editingPoseId = null,
  onLoadPose,
  onUpdatePose,
  onCancelEdit,
  onApplyPoseTemplate,
  onPoseHover,
}: AnimationRightPanelProps) {
  // ── Store ──────────────────────────────────────────────────────────────────
  const rig = useRigStore((s) => s.rigs.find((r) => r.characterId === characterId));
  const addClip = useRigStore((s) => s.addClip);
  const addPose = useRigStore((s) => s.addPose);
  const deleteClip = useRigStore((s) => s.deleteClip);
  const deletePose = useRigStore((s) => s.deletePose);
  const updateClip = useRigStore((s) => s.updateClip);
  const updatePose = useRigStore((s) => s.updatePose);
  const generateAndAddIdle = useRigStore((s) => s.generateAndAddIdleClip);
  const setIdleClip = useRigStore((s) => s.setIdleClip);
  const setSpeakClip = useRigStore((s) => s.setSpeakClip);

  const clips = rig?.animationClips ?? [];
  const poses = rig?.poses ?? [];
  const selectedClip = clips.find((c) => c.id === selectedClipId) ?? null;

  // ── State local ────────────────────────────────────────────────────────────
  const [pendingDeleteClipId, setPendingDeleteClipId] = useState<string | null>(null);
  const [pendingDeletePoseId, setPendingDeletePoseId] = useState<string | null>(null);
  const [showPoseConfetti, setShowPoseConfetti] = useState(false);
  const poseConfettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (poseConfettiTimer.current) clearTimeout(poseConfettiTimer.current);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddClip = useCallback(() => {
    if (!rig) return;
    const newId = addClip(rig.id, {
      name: `Clip ${clips.length + 1}`,
      fps: DEFAULT_ANIMATION_FPS,
      poseIds: [],
      keyframes: [],
      loop: true,
    });
    // Auto-sélectionner le clip créé → SequenceSection devient visible immédiatement
    onSelectClip(newId);
  }, [rig, clips.length, addClip, onSelectClip]);

  const handleGenerateIdle = useCallback(() => {
    if (!rig) return;
    generateAndAddIdle(characterId);
  }, [rig, characterId, generateAndAddIdle]);

  const handleAddPose = useCallback(() => {
    if (!rig) return;
    const boneStates = Object.fromEntries(rig.bones.map((b) => [b.id, { rotation: b.rotation }]));
    addPose(rig.id, { name: `Pose ${poses.length + 1}`, boneStates });
    setShowPoseConfetti(true);
    uiSounds.minigameSuccess();
    if (poseConfettiTimer.current) clearTimeout(poseConfettiTimer.current);
    poseConfettiTimer.current = setTimeout(() => setShowPoseConfetti(false), 1800);
  }, [rig, poses.length, addPose]);

  const handleDeleteClip = useCallback(() => {
    if (!rig || !selectedClipId) return;
    if (pendingDeleteClipId !== selectedClipId) {
      setPendingDeleteClipId(selectedClipId);
      return;
    }
    deleteClip(rig.id, selectedClipId);
    onSelectClip(null);
    setPendingDeleteClipId(null);
  }, [rig, selectedClipId, pendingDeleteClipId, deleteClip, onSelectClip]);

  const handleDeletePose = useCallback(() => {
    if (!rig || !selectedPoseId) return;
    if (pendingDeletePoseId !== selectedPoseId) {
      setPendingDeletePoseId(selectedPoseId);
      return;
    }
    deletePose(rig.id, selectedPoseId);
    onSelectPose(null);
    setPendingDeletePoseId(null);
  }, [rig, selectedPoseId, pendingDeletePoseId, deletePose, onSelectPose]);

  const handleReorderKeyframes = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (!rig || !selectedClipId) return;
      const clip = rig.animationClips.find((c) => c.id === selectedClipId);
      if (!clip) return;
      const kfs = [...(clip.keyframes ?? [])];
      const [moved] = kfs.splice(fromIdx, 1);
      kfs.splice(toIdx, 0, moved);
      updateClip(rig.id, selectedClipId, { keyframes: kfs });
    },
    [rig, selectedClipId, updateClip]
  );

  const handleRenameClip = useCallback(
    (id: string, name: string) => {
      if (!rig) return;
      updateClip(rig.id, id, { name });
    },
    [rig, updateClip]
  );

  const handleRenamePose = useCallback(
    (id: string, name: string) => {
      if (!rig) return;
      updatePose(rig.id, id, { name });
    },
    [rig, updatePose]
  );

  const handleAddPoseToClip = useCallback(() => {
    if (!rig || !selectedClipId || !selectedPoseId) return;
    const clip = rig.animationClips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    const newKf: KeyframeEntry = {
      poseId: selectedPoseId,
      duration: DEFAULT_KEYFRAME_DURATION,
      easing: 'linear',
    };
    updateClip(rig.id, selectedClipId, { keyframes: [...(clip.keyframes ?? []), newKf] });
  }, [rig, selectedClipId, selectedPoseId, updateClip]);

  const handleRemoveKeyframe = useCallback(
    (index: number) => {
      if (!rig || !selectedClipId) return;
      const clip = rig.animationClips.find((c) => c.id === selectedClipId);
      if (!clip) return;
      updateClip(rig.id, selectedClipId, {
        keyframes: (clip.keyframes ?? []).filter((_, i) => i !== index),
      });
    },
    [rig, selectedClipId, updateClip]
  );

  const handleKeyframeDuration = useCallback(
    (index: number, duration: number) => {
      if (!rig || !selectedClipId) return;
      const clip = rig.animationClips.find((c) => c.id === selectedClipId);
      if (!clip) return;
      updateClip(rig.id, selectedClipId, {
        keyframes: (clip.keyframes ?? []).map((kf, i) =>
          i === index ? { ...kf, duration: Math.max(0.1, duration) } : kf
        ),
      });
    },
    [rig, selectedClipId, updateClip]
  );

  const handleKeyframeEasing = useCallback(
    (index: number, easing: EasingType, bezierPoints?: BezierPoints) => {
      if (!rig || !selectedClipId) return;
      const clip = rig.animationClips.find((c) => c.id === selectedClipId);
      if (!clip) return;
      updateClip(rig.id, selectedClipId, {
        keyframes: (clip.keyframes ?? []).map((kf, i) =>
          i === index ? { ...kf, easing, bezierPoints } : kf
        ),
      });
    },
    [rig, selectedClipId, updateClip]
  );

  // ── Garde ─────────────────────────────────────────────────────────────────
  if (!rig) {
    return (
      <div style={{ padding: 12, color: 'var(--color-text-muted)', fontSize: 12 }}>
        Créez d'abord un rig dans l'Éditeur osseux.
      </div>
    );
  }

  // ── Workflow progressif (Miyamoto §1.3 + Meier §10.1) ────────────────────
  // Étape 1 : pas de clip sélectionné → CLIPS seulement
  // Étape 2 : clip sélectionné, < 2 poses → CLIPS + POSES
  // Étape 3 : clip sélectionné, ≥ 2 poses → CLIPS + POSES + SÉQUENCE
  // Expert   : tout visible en permanence
  const step = !selectedClipId ? 1 : poses.length < 2 ? 2 : 3;
  const showPoses = isBeginnerMode ? step >= 2 : true;
  const showSequence = isBeginnerMode ? step >= 3 : !!selectedClip;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Indicateur de progression — mode Débutant uniquement (Norman §9.4) */}
      {isBeginnerMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            padding: '6px 10px',
            borderBottom: '1px solid var(--color-border-base)',
            flexShrink: 0,
          }}
        >
          {(['🎬 Clip', '🧍 Poses', '▶ Play'] as const).map((label, i) => {
            const stepNum = i + 1;
            const active = step === stepNum;
            const done = step > stepNum;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: done || active ? 700 : 400,
                    color: done
                      ? 'var(--color-success)'
                      : active
                        ? 'var(--color-primary)'
                        : 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {done ? '✓ ' : ''}
                  {label}
                </span>
                {i < 2 && (
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      margin: '0 4px',
                      background: done ? 'var(--color-success)' : 'var(--color-border-base)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Étape 1 : Clips ── */}
      <ClipsSection
        clips={clips}
        selectedClipId={selectedClipId}
        pendingDeleteClipId={pendingDeleteClipId}
        onSelectClip={onSelectClip}
        onAddClip={handleAddClip}
        onGenerateIdle={handleGenerateIdle}
        onDeleteClip={handleDeleteClip}
        onCancelDelete={() => setPendingDeleteClipId(null)}
        onRenameClip={handleRenameClip}
      />

      {/* Hint étape 1 → 2 (mode débutant) */}
      {isBeginnerMode && step === 1 && (
        <div
          style={{
            padding: '10px 12px',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          ← Sélectionne un clip pour commencer à créer des poses.
        </div>
      )}

      {/* ── Étape 2 : Poses ── */}
      {showPoses && (
        <PosesSection
          poses={poses}
          selectedPoseId={selectedPoseId}
          editingPoseId={editingPoseId}
          pendingDeletePoseId={pendingDeletePoseId}
          showConfetti={showPoseConfetti}
          isBeginnerMode={isBeginnerMode}
          onSelectPose={onSelectPose}
          onAddPose={handleAddPose}
          onDeletePose={handleDeletePose}
          onCancelDelete={() => setPendingDeletePoseId(null)}
          onLoadPose={onLoadPose}
          onUpdatePose={onUpdatePose}
          onCancelEdit={onCancelEdit}
          onApplyPoseTemplate={onApplyPoseTemplate}
          onPoseHover={onPoseHover}
          onRenamePose={handleRenamePose}
        />
      )}

      {/* Hint étape 2 → 3 (mode débutant) */}
      {isBeginnerMode && step === 2 && (
        <div
          style={{
            padding: '10px 12px',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        >
          Crée au moins <strong style={{ color: 'var(--color-text-secondary)' }}>2 poses</strong>{' '}
          puis ajoute-les à la séquence avec{' '}
          <strong style={{ color: 'var(--color-primary)' }}>📸 + Séq.</strong>
        </div>
      )}

      {/* ── Étape 3 : Séquence + Lecture ── */}
      {showSequence && selectedClip && (
        <SequenceSection
          selectedClip={selectedClip}
          poses={poses}
          selectedPoseId={selectedPoseId}
          isPlaying={isPlaying}
          isBeginnerMode={isBeginnerMode}
          onAddPoseToClip={handleAddPoseToClip}
          onRemoveKeyframe={handleRemoveKeyframe}
          onKeyframeDuration={handleKeyframeDuration}
          onKeyframeEasing={handleKeyframeEasing}
          onPlayToggle={onPlayToggle}
          onReorderKeyframes={handleReorderKeyframes}
        />
      )}

      {/* ── Clips Auto (accordéon, replié par défaut) ── */}
      <AutoClipsSection
        rig={rig}
        clips={clips}
        onSetIdleClip={setIdleClip}
        onSetSpeakClip={setSpeakClip}
      />
    </div>
  );
}
