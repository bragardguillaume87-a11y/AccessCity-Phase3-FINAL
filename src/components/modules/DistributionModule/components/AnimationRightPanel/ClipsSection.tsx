import type { AnimationClip } from '@/types/bone';
import { sectionLabel, rowBetween, emptyText, smallBtn, clipRowStyle } from './styles';

interface ClipsSectionProps {
  clips: AnimationClip[];
  selectedClipId: string | null;
  pendingDeleteClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onAddClip: () => void;
  onGenerateIdle: () => void;
  onDeleteClip: () => void;
  onCancelDelete: () => void;
}

export function ClipsSection({
  clips,
  selectedClipId,
  pendingDeleteClipId,
  onSelectClip,
  onAddClip,
  onGenerateIdle,
  onDeleteClip,
  onCancelDelete,
}: ClipsSectionProps) {
  return (
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
            onClick={onAddClip}
            title="Nouveau clip vide"
            style={smallBtn}
            data-tutorial-id="add-clip-button"
          >
            + Clip
          </button>
          <button
            type="button"
            onClick={onGenerateIdle}
            title="Générer automatiquement un clip de respiration idle à partir de la pose Repos"
            style={smallBtn}
          >
            ✨ Idle
          </button>
          {selectedClipId && (
            <button
              type="button"
              onClick={onDeleteClip}
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
            <button type="button" onClick={onCancelDelete} style={smallBtn}>
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
        {clips.length === 0 && (
          <p style={emptyText}>Aucun clip — crée-en un ou génère un idle ✨</p>
        )}
      </div>
    </div>
  );
}
