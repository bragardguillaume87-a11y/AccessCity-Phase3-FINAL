import { useState, useRef, useEffect, useCallback } from 'react';
import type { BonePose } from '@/types/bone';
import { Confetti } from '@/components/ui/confetti';
import { POSE_TEMPLATES } from '@/config/poseTemplates';
import type { PoseTemplate } from '@/config/poseTemplates';
import { sectionLabel, rowBetween, emptyText, smallBtn } from './styles';
import { uiSounds } from '@/utils/uiSounds';

interface PosesSectionProps {
  poses: BonePose[];
  selectedPoseId: string | null;
  editingPoseId: string | null;
  pendingDeletePoseId: string | null;
  showConfetti: boolean;
  isBeginnerMode: boolean;
  onSelectPose: (id: string | null) => void;
  onAddPose: () => void;
  onDeletePose: () => void;
  onCancelDelete: () => void;
  onLoadPose?: (id: string) => void;
  onUpdatePose?: () => void;
  onCancelEdit?: () => void;
  onApplyPoseTemplate?: (tpl: PoseTemplate) => void;
  onPoseHover?: (id: string | null) => void;
  onRenamePose?: (id: string, name: string) => void;
}

export function PosesSection({
  poses,
  selectedPoseId,
  editingPoseId,
  pendingDeletePoseId,
  showConfetti,
  isBeginnerMode,
  onSelectPose,
  onAddPose,
  onDeletePose,
  onCancelDelete,
  onLoadPose,
  onUpdatePose,
  onCancelEdit,
  onApplyPoseTemplate,
  onPoseHover,
  onRenamePose,
}: PosesSectionProps) {
  const [showPresets, setShowPresets] = useState(false);

  // Flash vert 800ms sur "Mettre à jour" — feedback localisé (Norman §9.3)
  const [poseFlash, setPoseFlash] = useState(false);
  const poseFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (poseFlashTimer.current) clearTimeout(poseFlashTimer.current);
    };
  }, []);

  // Rename inline
  const [renamingPoseId, setRenamingPoseId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');

  const startRenamePose = useCallback((pose: BonePose) => {
    setRenamingPoseId(pose.id);
    setRenamingName(pose.name);
  }, []);

  const commitRenamePose = useCallback(
    (id: string) => {
      const trimmed = renamingName.trim();
      if (trimmed && onRenamePose) onRenamePose(id, trimmed);
      setRenamingPoseId(null);
    },
    [renamingName, onRenamePose]
  );

  const cancelRenamePose = useCallback(() => setRenamingPoseId(null), []);

  const handleUpdatePose = () => {
    onUpdatePose?.();
    uiSounds.minigameDing();
    setPoseFlash(true);
    if (poseFlashTimer.current) clearTimeout(poseFlashTimer.current);
    poseFlashTimer.current = setTimeout(() => setPoseFlash(false), 800);
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        borderBottom: '1px solid var(--color-border-base)',
      }}
    >
      {showConfetti && <Confetti />}

      {/* Header */}
      <div style={rowBetween}>
        <p style={sectionLabel}>🧍 Poses ({poses.length})</p>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={onAddPose}
            title="Capturer la pose actuelle du squelette"
            style={smallBtn}
            data-tutorial-id="pose-capture-button"
          >
            📸 +
          </button>
          {selectedPoseId && !editingPoseId && (
            <button
              type="button"
              onClick={onDeletePose}
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
            <button type="button" onClick={onCancelDelete} style={smallBtn}>
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
          <p style={{ marginBottom: 8, lineHeight: 1.4 }}>Ajuste le squelette, puis sauvegarde.</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={handleUpdatePose}
              style={{
                ...smallBtn,
                background: poseFlash ? 'var(--color-success)' : 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                flex: 1,
                justifyContent: 'center',
                transition: 'background 0.2s ease',
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

      {/* Accordéon "Poses de base" */}
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
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {tpl.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guide débutant (aucune pose) */}
      {poses.length === 0 ? (
        <div
          style={{
            marginTop: 10,
            padding: '10px 8px',
            borderRadius: 6,
            background: 'var(--color-bg-hover)',
            border: isBeginnerMode
              ? '1.5px solid rgba(139,92,246,0.4)'
              : '1px solid var(--color-border-base)',
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
          {poses.map((pose) => {
            const isRenaming = renamingPoseId === pose.id;
            const isSelected = pose.id === selectedPoseId;
            return (
              <div
                key={pose.id}
                onMouseEnter={() => onPoseHover?.(pose.id)}
                onMouseLeave={() => onPoseHover?.(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 5,
                  border: isSelected
                    ? '1.5px solid var(--color-primary)'
                    : '1.5px solid transparent',
                  background: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                }}
              >
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renamingName}
                    onChange={(e) => setRenamingName(e.target.value)}
                    onBlur={() => commitRenamePose(pose.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitRenamePose(pose.id);
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelRenamePose();
                      }
                      e.stopPropagation();
                    }}
                    style={{
                      flex: 1,
                      fontSize: 11,
                      padding: '4px 7px',
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-primary)',
                      borderRadius: 3,
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                ) : (
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
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startRenamePose(pose);
                      }}
                      title="Double-clic pour renommer"
                    >
                      {editingPoseId === pose.id ? '✏️ ' : ''}
                      {pose.name}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {Object.keys(pose.boneStates).length}os
                    </span>
                    {Object.keys(pose.spriteVariants ?? {}).length > 0 && (
                      <span
                        title={`${Object.keys(pose.spriteVariants!).length} variante(s) sprite`}
                        style={{ fontSize: 9, color: 'var(--color-primary)', flexShrink: 0 }}
                      >
                        🖼
                      </span>
                    )}
                  </button>
                )}
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
            );
          })}
        </div>
      )}

      {/* Indicateur "sélectionne une pose" en mode débutant quand clip sélectionné */}
      {!isBeginnerMode && poses.length > 0 && !selectedPoseId && (
        <p style={{ ...emptyText, marginTop: 6 }}>
          ← Sélectionne une pose pour l'ajouter à la séquence
        </p>
      )}
    </div>
  );
}
