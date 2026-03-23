import { useCallback } from 'react';
import { useRigStore } from '@/stores/rigStore';
import type { BoneTool } from '@/types/bone';
import { BONE_DEFAULT_COLORS, DEFAULT_BONE_LENGTH } from '@/types/bone';

interface BoneEditorRightPanelProps {
  characterId: string;
  activeTool: BoneTool;
  selectedBoneId: string | null;
  onSelectBone: (id: string | null) => void;
  onToolChange: (tool: BoneTool) => void;
}

const TOOL_BUTTONS: { id: BoneTool; label: string; emoji: string; title: string }[] = [
  { id: 'select', emoji: '↖', label: 'Sélect.', title: 'Sélectionner un os' },
  { id: 'rotate', emoji: '↻', label: 'Pivoter', title: 'Faire pivoter un os' },
  { id: 'add-bone', emoji: '🦴', label: '+ Os', title: 'Ajouter un os (clic sur canvas)' },
  { id: 'add-part', emoji: '🖼', label: '+ Part', title: 'Ajouter une partie sprite' },
];

/**
 * BoneEditorRightPanel — Outils, hiérarchie des os et liste des parts.
 */
export function BoneEditorRightPanel({
  characterId,
  activeTool,
  selectedBoneId,
  onSelectBone,
  onToolChange,
}: BoneEditorRightPanelProps) {
  const rig = useRigStore((s) => s.rigs.find((r) => r.characterId === characterId));
  const deleteBone = useRigStore((s) => s.deleteBone);
  const addRig = useRigStore((s) => s.addRig);
  const addBone = useRigStore((s) => s.addBone);

  const bones = rig?.bones ?? [];
  const parts = rig?.parts ?? [];

  const handleCreateRig = () => {
    addRig(characterId);
  };

  const handleAddRootBone = () => {
    if (!rig) {
      addRig(characterId);
      return;
    }
    const colorIdx = bones.length % BONE_DEFAULT_COLORS.length;
    addBone(rig.id, {
      name: `Os ${bones.length + 1}`,
      parentId: null,
      localX: 300,
      localY: 200,
      length: DEFAULT_BONE_LENGTH,
      rotation: 0,
      color: BONE_DEFAULT_COLORS[colorIdx],
    });
  };

  const handleDeleteBone = () => {
    if (!rig || !selectedBoneId) return;
    deleteBone(rig.id, selectedBoneId);
    onSelectBone(null);
  };

  const selectedBone = bones.find((b) => b.id === selectedBoneId);

  // Fix #5 — handlers édition propriétés os (getState() dans handler — CLAUDE.md §3)
  const handleBoneName = useCallback(
    (name: string) => {
      if (!rig || !selectedBoneId) return;
      useRigStore.getState().updateBone(rig.id, selectedBoneId, { name });
    },
    [rig, selectedBoneId]
  );

  const handleBoneRotation = useCallback(
    (value: string) => {
      if (!rig || !selectedBoneId) return;
      const rotation = parseFloat(value);
      if (isNaN(rotation)) return;
      useRigStore.getState().updateBone(rig.id, selectedBoneId, { rotation });
    },
    [rig, selectedBoneId]
  );

  const handleBoneLength = useCallback(
    (value: string) => {
      if (!rig || !selectedBoneId) return;
      const length = parseInt(value, 10);
      if (isNaN(length) || length < 4) return;
      useRigStore.getState().updateBone(rig.id, selectedBoneId, { length });
    },
    [rig, selectedBoneId]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* ── Outils ── */}
      <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid var(--color-border-base)' }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginBottom: 8,
          }}
        >
          Outils
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {TOOL_BUTTONS.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.title}
              onClick={() => onToolChange(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 7px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: activeTool === t.id ? 700 : 400,
                border:
                  activeTool === t.id
                    ? '1.5px solid var(--color-primary)'
                    : '1.5px solid var(--color-border-base)',
                background: activeTool === t.id ? 'var(--color-primary-subtle)' : 'transparent',
                color: activeTool === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'background 0.1s, border-color 0.1s',
              }}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Hiérarchie des os ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 10px 8px',
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
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            Os ({bones.length})
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={handleAddRootBone}
              title="Ajouter os racine"
              style={smallBtnStyle}
            >
              🦴 +
            </button>
            {selectedBoneId && (
              <button
                type="button"
                onClick={handleDeleteBone}
                title="Supprimer cet os"
                style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {bones.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {rig ? 'Aucun os. Cliquez sur « 🦴 + ».' : 'Aucun rig. Créez-en un.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {bones.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBone(b.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 6px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  fontSize: 11,
                  textAlign: 'left',
                  border:
                    b.id === selectedBoneId
                      ? '1.5px solid var(--color-primary)'
                      : '1.5px solid transparent',
                  background:
                    b.id === selectedBoneId ? 'var(--color-primary-subtle)' : 'transparent',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: b.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.name}
                </span>
                {b.parentId === null && (
                  <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>racine</span>
                )}
              </button>
            ))}
          </div>
        )}

        {!rig && (
          <button
            type="button"
            onClick={handleCreateRig}
            style={{ ...smallBtnStyle, marginTop: 8, width: '100%', justifyContent: 'center' }}
          >
            🆕 Créer un rig
          </button>
        )}
      </div>

      {/* ── Propriétés de l'os sélectionné (Fix #5 — champs éditables) ── */}
      {selectedBone && (
        <div style={{ padding: '10px', borderBottom: '1px solid var(--color-border-base)' }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 8,
            }}
          >
            Os sélectionné
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={propRowStyle}>
              <label style={propLabelStyle} htmlFor="bone-name">
                Nom
              </label>
              <input
                id="bone-name"
                type="text"
                value={selectedBone.name}
                onChange={(e) => handleBoneName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={propRowStyle}>
              <label style={propLabelStyle} htmlFor="bone-rotation">
                Rotation °
              </label>
              <input
                id="bone-rotation"
                type="number"
                value={selectedBone.rotation.toFixed(1)}
                step={1}
                onChange={(e) => handleBoneRotation(e.target.value)}
                style={{ ...inputStyle, width: 70 }}
              />
            </div>
            <div style={propRowStyle}>
              <label style={propLabelStyle} htmlFor="bone-length">
                Longueur px
              </label>
              <input
                id="bone-length"
                type="number"
                value={selectedBone.length}
                min={4}
                step={4}
                onChange={(e) => handleBoneLength(e.target.value)}
                style={{ ...inputStyle, width: 70 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Parts ── */}
      <div style={{ padding: '10px', overflowY: 'auto' }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginBottom: 8,
          }}
        >
          Parts ({parts.length})
        </p>
        {parts.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            Aucune part. Utilisez l'outil 🖼 + Part.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {parts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 6px',
                  borderRadius: 5,
                  border: '1px solid var(--color-border-base)',
                  background: 'var(--color-bg-hover)',
                }}
              >
                <img
                  src={p.assetUrl}
                  alt=""
                  style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 3 }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.assetUrl.split('/').pop()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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

const propRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 6,
};
const propLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  flexShrink: 0,
};
const inputStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border-base)',
  borderRadius: 4,
  padding: '2px 5px',
  width: '100%',
  minWidth: 0,
  outline: 'none',
};
