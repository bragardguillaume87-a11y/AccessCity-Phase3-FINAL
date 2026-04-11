import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  onRenameClip?: (id: string, name: string) => void;
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
  onRenameClip,
}: ClipsSectionProps) {
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = (clip: AnimationClip) => {
    setEditingNameId(clip.id);
    setEditingName(clip.name);
    // focus handled by autoFocus on input
  };

  const commitRename = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed && onRenameClip) onRenameClip(id, trimmed);
    setEditingNameId(null);
  };

  const cancelRename = () => setEditingNameId(null);

  // F2 → renommer l'animation sélectionnée (standard Spine/DragonBones)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'F2') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (selectedClipId && editingNameId !== selectedClipId) {
        const clip = clips.find((c) => c.id === selectedClipId);
        if (clip) startRename(clip);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, clips, editingNameId]);

  return (
    <div
      style={{
        padding: '10px',
        borderBottom: '1px solid var(--color-border-base)',
        flexShrink: 0,
      }}
    >
      <div style={rowBetween}>
        <p style={sectionLabel}>🎬 Animations ({clips.length})</p>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={onAddClip}
            title="Créer une nouvelle animation vide"
            style={smallBtn}
            data-tutorial-id="add-clip-button"
          >
            🎬 +
          </button>
          <button
            type="button"
            onClick={onGenerateIdle}
            title="Génère automatiquement : 3 poses de respiration + 1 animation 'Repos' en boucle + l'assigne comme idle du personnage"
            style={smallBtn}
          >
            ✨ Repos
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

      {/* layoutRoot isole les animations layout — évite les reflows sur le panneau parent */}
      <motion.div
        layoutRoot
        style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}
      >
        {clips.map((clip) => {
          const isEditing = editingNameId === clip.id;
          const isSelected = clip.id === selectedClipId;
          if (isEditing) {
            return (
              <div key={clip.id} style={clipRowStyle(isSelected)}>
                <input
                  ref={inputRef}
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitRename(clip.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitRename(clip.id);
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelRename();
                    }
                    e.stopPropagation();
                  }}
                  style={{
                    flex: 1,
                    fontSize: 11,
                    padding: '0 2px',
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: 3,
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <span style={{ fontSize: 9, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {(clip.keyframes ?? []).length} étape
                  {(clip.keyframes ?? []).length !== 1 ? 's' : ''}
                </span>
              </div>
            );
          }
          return (
            /* layout + initial/animate : apparition fluide du nouveau clip (Nijman §8.1) */
            <motion.button
              key={clip.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              type="button"
              onClick={() => onSelectClip(clip.id)}
              style={clipRowStyle(isSelected)}
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
                  startRename(clip);
                }}
                title="Double-clic ou F2 pour renommer"
              >
                {clip.name}
              </span>
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {(clip.keyframes ?? []).length} étape
                {(clip.keyframes ?? []).length !== 1 ? 's' : ''}
              </span>
            </motion.button>
          );
        })}
        {clips.length === 0 && (
          <p style={emptyText}>Aucune animation — crée-en une avec 🎬 + ou génère un repos ✨</p>
        )}
      </motion.div>
    </div>
  );
}
