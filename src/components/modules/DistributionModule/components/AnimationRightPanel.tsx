import { useCallback } from 'react';
import { useRigStore } from '@/stores/rigStore';
import { DEFAULT_ANIMATION_FPS } from '@/types/bone';

interface AnimationRightPanelProps {
  characterId: string;
  selectedClipId: string | null;
  selectedPoseId: string | null;
  isPlaying: boolean;
  onSelectClip: (id: string | null) => void;
  onSelectPose: (id: string | null) => void;
  onPlayToggle: () => void;
}

/**
 * AnimationRightPanel — Liste des clips + poses, contrôles de lecture.
 */
export function AnimationRightPanel({
  characterId,
  selectedClipId,
  selectedPoseId,
  isPlaying,
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

  const handleAddClip = useCallback(() => {
    if (!rig) return;
    addClip(rig.id, {
      name: `Clip ${clips.length + 1}`,
      fps: DEFAULT_ANIMATION_FPS,
      poseIds: [],
      loop: true,
    });
  }, [rig, clips.length, addClip]);

  const handleAddPose = useCallback(() => {
    if (!rig) return;
    const bones = rig.bones;
    const boneStates = Object.fromEntries(bones.map((b) => [b.id, { rotation: b.rotation }]));
    addPose(rig.id, {
      name: `Pose ${poses.length + 1}`,
      boneStates,
    });
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

  // Fix #6 — liaison pose ↔ clip
  const handleAddPoseToClip = useCallback(() => {
    if (!rig || !selectedClipId || !selectedPoseId) return;
    const clip = rig.animationClips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    updateClip(rig.id, selectedClipId, { poseIds: [...clip.poseIds, selectedPoseId] });
  }, [rig, selectedClipId, selectedPoseId, updateClip]);

  const handleRemovePoseFromClip = useCallback(
    (index: number) => {
      if (!rig || !selectedClipId) return;
      const clip = rig.animationClips.find((c) => c.id === selectedClipId);
      if (!clip) return;
      const newPoseIds = clip.poseIds.filter((_, i) => i !== index);
      updateClip(rig.id, selectedClipId, { poseIds: newPoseIds });
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Clips ── */}
      <div style={{ padding: '10px', borderBottom: '1px solid var(--color-border-base)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <p style={sectionLabelStyle}>Clips ({clips.length})</p>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={handleAddClip}
              title="Nouveau clip"
              style={smallBtnStyle}
            >
              🎬 +
            </button>
            {selectedClipId && (
              <button
                type="button"
                onClick={handleDeleteClip}
                title="Supprimer clip"
                style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {clips.map((clip) => (
            <button
              key={clip.id}
              type="button"
              onClick={() => onSelectClip(clip.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 7px',
                borderRadius: 5,
                cursor: 'pointer',
                fontSize: 11,
                textAlign: 'left',
                border:
                  clip.id === selectedClipId
                    ? '1.5px solid var(--color-primary)'
                    : '1.5px solid transparent',
                background:
                  clip.id === selectedClipId ? 'var(--color-primary-subtle)' : 'transparent',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>🎬</span>
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
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                {clip.poseIds.length}p
              </span>
            </button>
          ))}
          {clips.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Aucun clip.</p>
          )}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <p style={sectionLabelStyle}>Poses ({poses.length})</p>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={handleAddPose}
              title="Capturer pose actuelle"
              style={smallBtnStyle}
            >
              📸 +
            </button>
            {selectedPoseId && (
              <button
                type="button"
                onClick={handleDeletePose}
                title="Supprimer pose"
                style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {poses.map((pose) => (
            <button
              key={pose.id}
              type="button"
              onClick={() => onSelectPose(pose.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 7px',
                borderRadius: 5,
                cursor: 'pointer',
                fontSize: 11,
                textAlign: 'left',
                border:
                  pose.id === selectedPoseId
                    ? '1.5px solid var(--color-primary)'
                    : '1.5px solid transparent',
                background:
                  pose.id === selectedPoseId ? 'var(--color-primary-subtle)' : 'transparent',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>🧍</span>
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
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                {Object.keys(pose.boneStates).length}os
              </span>
            </button>
          ))}
          {poses.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Aucune pose capturée.</p>
          )}
        </div>
      </div>

      {/* ── Séquence du clip (Fix #6) ── */}
      {selectedClip && (
        <div style={{ padding: '10px', borderBottom: '1px solid var(--color-border-base)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <p style={sectionLabelStyle}>Séquence ({selectedClip.poseIds.length})</p>
            {selectedPoseId && (
              <button
                type="button"
                onClick={handleAddPoseToClip}
                title="Ajouter la pose sélectionnée à la séquence"
                style={{
                  ...smallBtnStyle,
                  color: 'var(--color-primary)',
                  borderColor: 'var(--color-primary)',
                }}
              >
                📸 + Séquence
              </button>
            )}
          </div>
          {selectedClip.poseIds.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Sélectionne une pose et clique « 📸 + Séquence ».
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {selectedClip.poseIds.map((poseId, idx) => {
                const pose = poses.find((p) => p.id === poseId);
                return (
                  <div
                    key={`${poseId}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 6px',
                      borderRadius: 4,
                      background: 'var(--color-bg-hover)',
                      border: '1px solid var(--color-border-base)',
                    }}
                  >
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', minWidth: 16 }}>
                      {idx + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pose?.name ?? `Pose inconnue (${poseId.slice(0, 6)})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePoseFromClip(idx)}
                      title="Retirer de la séquence"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        padding: '0 2px',
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
        <div style={{ padding: '10px' }}>
          <p style={{ ...sectionLabelStyle, marginBottom: 8 }}>Lecture — {selectedClip.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onPlayToggle}
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
              {selectedClip.fps} fps · {selectedClip.loop ? '🔁 boucle' : '1×'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

const smallBtnStyle: React.CSSProperties = {
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
