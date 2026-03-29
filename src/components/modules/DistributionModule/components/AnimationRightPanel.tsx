import { useCallback, useState } from 'react';
import { useRigStore } from '@/stores/rigStore';
import { DEFAULT_ANIMATION_FPS, DEFAULT_KEYFRAME_DURATION } from '@/types/bone';
import type { KeyframeEntry } from '@/types/bone';
import { EASING_LABELS, BEZIER_PRESETS } from '@/utils/animationEasing';
import type { EasingType, BezierPoints } from '@/utils/animationEasing';

interface AnimationRightPanelProps {
  characterId: string;
  selectedClipId: string | null;
  selectedPoseId: string | null;
  isPlaying: boolean;
  isBeginnerMode?: boolean;
  onSelectClip: (id: string | null) => void;
  onSelectPose: (id: string | null) => void;
  onPlayToggle: () => void;
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

  // Popover Bezier ouvert pour quel keyframe index
  const [bezierPopoverIdx, setBezierPopoverIdx] = useState<number | null>(null);

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
  }, [rig, poses.length, addPose]);

  const handleDeleteClip = useCallback(() => {
    if (!rig || !selectedClipId) return;
    deleteClip(rig.id, selectedClipId);
    onSelectClip(null);
  }, [rig, selectedClipId, deleteClip, onSelectClip]);

  const handleDeletePose = useCallback(() => {
    if (!rig || !selectedPoseId) return;
    deletePose(rig.id, selectedPoseId);
    onSelectPose(null);
  }, [rig, selectedPoseId, deletePose, onSelectPose]);

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
                title="Supprimer clip"
                style={{ ...smallBtn, color: 'var(--color-danger)' }}
              >
                ✕
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
            {selectedPoseId && (
              <button
                type="button"
                onClick={handleDeletePose}
                title="Supprimer pose"
                style={{ ...smallBtn, color: 'var(--color-danger)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
          {poses.map((pose) => (
            <button
              key={pose.id}
              type="button"
              onClick={() => onSelectPose(pose.id)}
              style={clipRowStyle(pose.id === selectedPoseId)}
            >
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {pose.name}
              </span>
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {Object.keys(pose.boneStates).length}os
              </span>
            </button>
          ))}
          {poses.length === 0 && <p style={emptyText}>Aucune pose capturée.</p>}
        </div>
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
                    key={`kf-${idx}`}
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
