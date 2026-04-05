import { useCallback, useState, useRef, useEffect } from 'react';
import { useRigStore } from '@/stores/rigStore';
import { DEFAULT_ANIMATION_FPS, DEFAULT_KEYFRAME_DURATION } from '@/types/bone';
import type { KeyframeEntry } from '@/types/bone';
import { EASING_LABELS, BEZIER_PRESETS } from '@/utils/animationEasing';
import type { EasingType, BezierPoints } from '@/utils/animationEasing';
import { Confetti } from '@/components/ui/confetti';
import { POSE_TEMPLATES } from '@/config/poseTemplates';
import type { PoseTemplate } from '@/config/poseTemplates';

interface AnimationRightPanelProps {
  characterId: string;
  selectedClipId: string | null;
  selectedPoseId: string | null;
  isPlaying: boolean;
  isBeginnerMode?: boolean;
  onSelectClip: (id: string | null) => void;
  onSelectPose: (id: string | null) => void;
  onPlayToggle: () => void;
  /** ID de la pose en cours d'édition (chargée dans le squelette pour modification) */
  editingPoseId?: string | null;
  /** Charger les rotations d'une pose dans le squelette + basculer vers l'onglet Squelette */
  onLoadPose?: (poseId: string) => void;
  /** Mettre à jour la pose éditée avec l'état actuel du squelette */
  onUpdatePose?: () => void;
  /** Annuler le mode édition sans sauvegarder */
  onCancelEdit?: () => void;
  /** Appliquer un template de pose au rig (charge les rotations dans le squelette et capture la pose) */
  onApplyPoseTemplate?: (template: PoseTemplate) => void;
  /** Preview de pose au survol dans le canvas Squelette (null = effacer la preview) */
  onPoseHover?: (poseId: string | null) => void;
}

// Easing presets affichés en mode expert (hors bezier)
const EASING_PRESET_IDS: EasingType[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];

/**
 * AnimationRightPanel — Clips, poses, séquence de keyframes, contrôles lecture.
 * Chaque keyframe dans la séquence est éditable : durée (s) + courbe d'easing.
 */
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
  const rig = useRigStore((s) => s.rigs.find((r) => r.characterId === characterId));
  const addClip = useRigStore((s) => s.addClip);
  const addPose = useRigStore((s) => s.addPose);
  const deleteClip = useRigStore((s) => s.deleteClip);
  const deletePose = useRigStore((s) => s.deletePose);
  const updateClip = useRigStore((s) => s.updateClip);

  const clips = rig?.animationClips ?? [];
  const poses = rig?.poses ?? [];
  const selectedClip = clips.find((c) => c.id === selectedClipId);

  // Confirmations de suppression deux-étapes (Norman §9.2 / Meier §10.3)
  const [pendingDeleteClipId, setPendingDeleteClipId] = useState<string | null>(null);
  const [pendingDeletePoseId, setPendingDeletePoseId] = useState<string | null>(null);

  // Accordéon "Poses de base"
  const [showPresets, setShowPresets] = useState(false);

  // Popover Bezier ouvert pour quel keyframe index
  const [bezierPopoverIdx, setBezierPopoverIdx] = useState<number | null>(null);

  // Célébration après capture de pose (§3 : ref + cleanup)
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
    addClip(rig.id, {
      name: `Clip ${clips.length + 1}`,
      fps: DEFAULT_ANIMATION_FPS,
      poseIds: [],
      keyframes: [],
      loop: true,
    });
  }, [rig, clips.length, addClip]);

  const handleAddPose = useCallback(() => {
    if (!rig) return;
    const boneStates = Object.fromEntries(rig.bones.map((b) => [b.id, { rotation: b.rotation }]));
    addPose(rig.id, { name: `Pose ${poses.length + 1}`, boneStates });
    // Célébration (Nijman §8.4 : reward loop) — §3 : ref + cleanup dans useEffect
    setShowPoseConfetti(true);
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

  // Ajouter la pose sélectionnée à la fin de la séquence du clip
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

  // Retirer un keyframe de la séquence
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

  // Modifier la durée d'un keyframe
  const handleKeyframeDuration = useCallback(
    (index: number, duration: number) => {
      if (!rig || !selectedClipId) return;
      const clip = rig.animationClips.find((c) => c.id === selectedClipId);
      if (!clip) return;
      const updated = (clip.keyframes ?? []).map((kf, i) =>
        i === index ? { ...kf, duration: Math.max(0.1, duration) } : kf
      );
      updateClip(rig.id, selectedClipId, { keyframes: updated });
    },
    [rig, selectedClipId, updateClip]
  );

  // Modifier l'easing d'un keyframe
  const handleKeyframeEasing = useCallback(
    (index: number, easing: EasingType, bezierPoints?: BezierPoints) => {
      if (!rig || !selectedClipId) return;
      const clip = rig.animationClips.find((c) => c.id === selectedClipId);
      if (!clip) return;
      const updated = (clip.keyframes ?? []).map((kf, i) =>
        i === index ? { ...kf, easing, bezierPoints } : kf
      );
      updateClip(rig.id, selectedClipId, { keyframes: updated });
      setBezierPopoverIdx(null);
    },
    [rig, selectedClipId, updateClip]
  );

  if (!rig) {
    return (
      <div style={{ padding: 12, color: 'var(--color-text-muted)', fontSize: 12 }}>
        Créez d'abord un rig dans l'Éditeur osseux.
      </div>
    );
  }

  const totalDuration = selectedClip
    ? (selectedClip.keyframes ?? []).reduce((s, kf) => s + kf.duration, 0).toFixed(1)
    : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {showPoseConfetti && <Confetti />}
      {/* ── Clips ── */}
      <div
        style={{
          padding: '10px',
          borderBottom: '1px solid var(--color-border-base)',
          flexShrink: 0,
        }}
      >
        <div style={rowBetween}>
          <p style={sectionLabel}>🎬 Clips ({clips.length})</p>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={handleAddClip}
              title="Nouveau clip"
              style={smallBtn}
              data-tutorial-id="add-clip-button"
            >
              + Clip
            </button>
            {selectedClipId && (
              <button
                type="button"
                onClick={handleDeleteClip}
                title={
                  pendingDeleteClipId === selectedClipId
                    ? 'Confirmer la suppression'
                    : 'Supprimer clip'
                }
                style={{
                  ...smallBtn,
                  color: 'var(--color-danger)',
                  opacity: pendingDeleteClipId === selectedClipId ? 1 : 0.7,
                }}
              >
                {pendingDeleteClipId === selectedClipId ? '⚠️ Confirmer' : '✕'}
              </button>
            )}
            {pendingDeleteClipId && (
              <button type="button" onClick={() => setPendingDeleteClipId(null)} style={smallBtn}>
                Annuler
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
          {clips.map((clip) => (
            <button
              key={clip.id}
              type="button"
              onClick={() => onSelectClip(clip.id)}
              style={clipRowStyle(clip.id === selectedClipId)}
            >
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {clip.name}
              </span>
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {(clip.keyframes ?? []).length}kf
              </span>
            </button>
          ))}
          {clips.length === 0 && <p style={emptyText}>Aucun clip.</p>}
        </div>
      </div>

      {/* ── Poses ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          borderBottom: '1px solid var(--color-border-base)',
        }}
      >
        <div style={rowBetween}>
          <p style={sectionLabel}>🧍 Poses ({poses.length})</p>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={handleAddPose}
              title="Capturer pose actuelle"
              style={smallBtn}
              data-tutorial-id="pose-capture-button"
            >
              📸 +
            </button>
            {selectedPoseId && !editingPoseId && (
              <button
                type="button"
                onClick={handleDeletePose}
                title={
                  pendingDeletePoseId === selectedPoseId
                    ? 'Confirmer la suppression'
                    : 'Supprimer pose'
                }
                style={{
                  ...smallBtn,
                  color: 'var(--color-danger)',
                  opacity: pendingDeletePoseId === selectedPoseId ? 1 : 0.7,
                }}
              >
                {pendingDeletePoseId === selectedPoseId ? '⚠️ Confirmer' : '✕'}
              </button>
            )}
            {pendingDeletePoseId && (
              <button type="button" onClick={() => setPendingDeletePoseId(null)} style={smallBtn}>
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Bannière mode édition */}
        {editingPoseId && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderRadius: 6,
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.35)',
              fontSize: 11,
              color: 'var(--color-text-secondary)',
            }}
          >
            <p style={{ fontWeight: 700, marginBottom: 4, color: 'var(--color-primary)' }}>
              ✏️ Mode édition
            </p>
            <p style={{ marginBottom: 8, lineHeight: 1.4 }}>
              Ajuste le squelette, puis sauvegarde.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={onUpdatePose}
                style={{
                  ...smallBtn,
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                💾 Mettre à jour
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                style={{ ...smallBtn, color: 'var(--color-text-muted)' }}
              >
                ✕ Annuler
              </button>
            </div>
          </div>
        )}

        {/* Accordéon "Poses de base" — toujours visible si onApplyPoseTemplate fourni */}
        {onApplyPoseTemplate && (
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setShowPresets((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                width: '100%',
                padding: '4px 6px',
                borderRadius: 5,
                border: '1px solid var(--color-border-base)',
                background: showPresets ? 'var(--color-bg-hover)' : 'transparent',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textAlign: 'left',
              }}
            >
              <span>{showPresets ? '▾' : '▸'}</span>
              <span>🎯 Poses de base</span>
              <span style={{ marginLeft: 'auto', opacity: 0.6 }}>clic pour appliquer</span>
            </button>

            {showPresets && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 4,
                  marginTop: 4,
                  padding: '6px',
                  background: 'var(--color-bg-hover)',
                  borderRadius: 5,
                  border: '1px solid var(--color-border-base)',
                }}
              >
                {POSE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      onApplyPoseTemplate(tpl);
                      setShowPresets(false);
                    }}
                    title={tpl.description}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 7px',
                      borderRadius: 4,
                      border: '1px solid var(--color-border-base)',
                      background: 'var(--color-bg-elevated)',
                      cursor: 'pointer',
                      fontSize: 10,
                      color: 'var(--color-text-secondary)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{tpl.emoji}</span>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tpl.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guide débutant — affiché uniquement si aucune pose (Will Wright §4.1) */}
        {poses.length === 0 ? (
          <div
            style={{
              marginTop: 10,
              padding: '10px 8px',
              borderRadius: 6,
              background: 'var(--color-bg-hover)',
              border: '1px solid var(--color-border-base)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {[
              { emoji: '🦴', text: "Pose ton squelette dans l'onglet Squelette" },
              { emoji: '📸', text: 'Reviens ici → 📸 + pour capturer la pose' },
              { emoji: '🎬', text: 'Crée un Clip et ajoute ta pose avec 📸 + Séq.' },
              { emoji: '▶', text: "Ajoute d'autres poses et appuie sur Play !" },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{step.emoji}</span>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--color-text-secondary)' }}>Étape {i + 1}</strong>{' '}
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
            {poses.map((pose) => (
              <div
                key={pose.id}
                onMouseEnter={() => onPoseHover?.(pose.id)}
                onMouseLeave={() => onPoseHover?.(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 5,
                  border:
                    pose.id === selectedPoseId
                      ? '1.5px solid var(--color-primary)'
                      : '1.5px solid transparent',
                  background:
                    pose.id === selectedPoseId ? 'var(--color-primary-subtle)' : 'transparent',
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectPose(pose.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 7px',
                    cursor: 'pointer',
                    fontSize: 11,
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {editingPoseId === pose.id ? '✏️ ' : ''}
                    {pose.name}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                    {Object.keys(pose.boneStates).length}os
                  </span>
                </button>
                {/* Bouton charger dans squelette */}
                <button
                  type="button"
                  onClick={() => onLoadPose?.(pose.id)}
                  title="Charger cette pose dans le squelette pour l'éditer"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    color:
                      editingPoseId === pose.id
                        ? 'var(--color-primary)'
                        : 'var(--color-text-muted)',
                    padding: '4px 6px',
                    flexShrink: 0,
                  }}
                >
                  📥
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Séquence (keyframes) ── */}
      {selectedClip && (
        <div
          data-tutorial-id="keyframe-section"
          style={{
            flexShrink: 0,
            padding: '10px',
            borderBottom: '1px solid var(--color-border-base)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          <div style={rowBetween}>
            <p style={sectionLabel}>
              ⏱ Séquence — {(selectedClip.keyframes ?? []).length}kf · {totalDuration}s
            </p>
            {selectedPoseId && (
              <button
                type="button"
                onClick={handleAddPoseToClip}
                title="Ajouter la pose à la séquence"
                style={{
                  ...smallBtn,
                  color: 'var(--color-primary)',
                  borderColor: 'var(--color-primary-40)',
                }}
              >
                📸 + Séq.
              </button>
            )}
          </div>

          {(selectedClip.keyframes ?? []).length === 0 ? (
            <p style={{ ...emptyText, marginTop: 6 }}>
              Sélectionne une pose puis clique « 📸 + Séq. ».
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
              {(selectedClip.keyframes ?? []).map((kf, idx) => {
                const pose = poses.find((p) => p.id === kf.poseId);
                const isBezierOpen = bezierPopoverIdx === idx;
                return (
                  <div
                    key={`${kf.poseId}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 6px',
                      borderRadius: 5,
                      background: 'var(--color-bg-hover)',
                      border: '1px solid var(--color-border-base)',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Index + nom pose */}
                    <span
                      style={{
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        minWidth: 14,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 40,
                      }}
                    >
                      {pose?.name ?? `Pose inconnue`}
                    </span>

                    {/* Durée (cachée en mode débutant) */}
                    {!isBeginnerMode && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>⏱</span>
                        <input
                          type="number"
                          value={kf.duration}
                          min={0.1}
                          max={10}
                          step={0.1}
                          onChange={(e) => handleKeyframeDuration(idx, parseFloat(e.target.value))}
                          style={{
                            width: 38,
                            fontSize: 10,
                            padding: '1px 3px',
                            borderRadius: 3,
                            border: '1px solid var(--color-border-base)',
                            background: 'var(--color-bg-base)',
                            color: 'var(--color-text-primary)',
                          }}
                          title="Durée en secondes"
                        />
                        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>s</span>
                      </div>
                    )}

                    {/* Easing selector (caché en mode débutant) */}
                    {!isBeginnerMode && (
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {EASING_PRESET_IDS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              title={EASING_LABELS[e]}
                              onClick={() => handleKeyframeEasing(idx, e)}
                              style={{
                                padding: '1px 4px',
                                borderRadius: 3,
                                fontSize: 9,
                                cursor: 'pointer',
                                border:
                                  kf.easing === e
                                    ? '1.5px solid var(--color-primary)'
                                    : '1px solid var(--color-border-base)',
                                background:
                                  kf.easing === e ? 'var(--color-primary-subtle)' : 'transparent',
                                color:
                                  kf.easing === e
                                    ? 'var(--color-primary)'
                                    : 'var(--color-text-muted)',
                              }}
                            >
                              {EASING_LABELS[e].split(' ')[0]}
                            </button>
                          ))}
                          {/* Bézier custom */}
                          <button
                            type="button"
                            title="Bézier custom"
                            onClick={() => setBezierPopoverIdx(isBezierOpen ? null : idx)}
                            style={{
                              padding: '1px 4px',
                              borderRadius: 3,
                              fontSize: 9,
                              cursor: 'pointer',
                              border:
                                kf.easing === 'bezier'
                                  ? '1.5px solid var(--color-primary)'
                                  : '1px solid var(--color-border-base)',
                              background:
                                kf.easing === 'bezier'
                                  ? 'var(--color-primary-subtle)'
                                  : 'transparent',
                              color:
                                kf.easing === 'bezier'
                                  ? 'var(--color-primary)'
                                  : 'var(--color-text-muted)',
                            }}
                          >
                            ◠
                          </button>
                        </div>

                        {/* Mini-popover Bézier */}
                        {isBezierOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '110%',
                              right: 0,
                              zIndex: 100,
                              background: 'var(--color-bg-elevated)',
                              border: '1px solid var(--color-border-base)',
                              borderRadius: 6,
                              padding: 8,
                              minWidth: 150,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                            }}
                          >
                            <p
                              style={{
                                fontSize: 9,
                                color: 'var(--color-text-muted)',
                                marginBottom: 6,
                                fontWeight: 700,
                              }}
                            >
                              ◠ BÉZIER PRESETS
                            </p>
                            {Object.entries(BEZIER_PRESETS).map(([name, pts]) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() =>
                                  handleKeyframeEasing(idx, 'bezier', pts as BezierPoints)
                                }
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '3px 6px',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 10,
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                {name}
                                <span
                                  style={{
                                    fontSize: 8,
                                    color: 'var(--color-text-muted)',
                                    marginLeft: 4,
                                  }}
                                >
                                  ({pts.join(', ')})
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Supprimer keyframe */}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyframe(idx)}
                      title="Retirer de la séquence"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        padding: '0 2px',
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Contrôles lecture ── */}
      {selectedClip && (
        <div style={{ padding: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onPlayToggle}
              data-tutorial-id="play-button"
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                border: '1.5px solid var(--color-primary)',
                background: isPlaying ? 'var(--color-primary)' : 'var(--color-primary-subtle)',
                color: isPlaying ? '#fff' : 'var(--color-primary)',
                transition: 'background 0.1s',
              }}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {selectedClip.fps}&thinsp;fps · {selectedClip.loop ? '🔁 boucle' : '1×'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles constants ────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

const rowBetween: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const emptyText: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
};

const smallBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '3px 6px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: 600,
  border: '1px solid var(--color-border-base)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
};

function clipRowStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 7px',
    borderRadius: 5,
    cursor: 'pointer',
    fontSize: 11,
    textAlign: 'left',
    border: active ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
    background: active ? 'var(--color-primary-subtle)' : 'transparent',
    color: 'var(--color-text-secondary)',
  };
}
