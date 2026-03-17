/**
 * EntityPropertyPanel — Panneau d'édition des propriétés d'une entité sélectionnée
 *
 * S'affiche dans la barre de statut inférieure du canvas quand une entité est sélectionnée.
 * Permet de modifier : nom d'affichage, comportement, direction, cible patrouille,
 * scène de dialogue associée et texte de dialogue.
 *
 * @module components/modules/TopdownEditor/EntityPropertyPanel
 */

import { useCallback } from 'react';
import { X } from 'lucide-react';
import { useMapsStore } from '@/stores/mapsStore';
import type { EntityInstance, EntityBehavior, FacingDir } from '@/types/sprite';
import { SOUND_BRICKS } from '@/config/soundBricks';

// ============================================================================
// CONSTANTS (externalisées — pas de magic strings dans le code métier)
// ============================================================================

const BEHAVIOR_OPTIONS: { value: EntityBehavior; label: string }[] = [
  { value: 'static', label: '📌 Statique' },
  { value: 'patrol', label: '↔ Patrouille' },
  { value: 'dialogue', label: '💬 Dialogue' },
];

const FACING_OPTIONS: { value: FacingDir; label: string }[] = [
  { value: 'down', label: '↓ Bas' },
  { value: 'left', label: '← Gauche' },
  { value: 'right', label: '→ Droite' },
  { value: 'up', label: '↑ Haut' },
];

// ============================================================================
// PROPS
// ============================================================================

interface EntityPropertyPanelProps {
  mapId: string;
  entity: EntityInstance;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function EntityPropertyPanel({ mapId, entity, onClose }: EntityPropertyPanelProps) {
  const updateEntity = useMapsStore((s) => s.updateEntity);

  const patch = useCallback(
    (p: Partial<EntityInstance>) => {
      updateEntity(mapId, entity.id, p);
    },
    [mapId, entity.id, updateEntity]
  );

  const inputStyle: React.CSSProperties = {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 4,
    border: '1px solid var(--color-border-base)',
    background: 'var(--color-bg-base)',
    color: 'var(--color-text-base)',
    width: '100%',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--color-text-secondary)',
    marginBottom: 2,
    display: 'block',
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 90,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '6px 10px',
        background: 'var(--color-primary-08)',
        borderTop: '1px solid var(--color-primary-30)',
        flexWrap: 'wrap',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 90 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          Entité
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
          ({entity.cx}, {entity.cy})
        </span>
        <button
          onClick={onClose}
          title="Désélectionner (Échap)"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 1,
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Display name */}
      <label style={fieldStyle}>
        <span style={labelStyle}>Nom</span>
        <input
          type="text"
          value={entity.displayName ?? ''}
          placeholder="NPC"
          onChange={(e) => patch({ displayName: e.target.value || undefined })}
          style={{ ...inputStyle, minWidth: 80 }}
        />
      </label>

      {/* Behavior */}
      <label style={fieldStyle}>
        <span style={labelStyle}>Comportement</span>
        <select
          value={entity.behavior}
          onChange={(e) => patch({ behavior: e.target.value as EntityBehavior })}
          style={{ ...inputStyle, minWidth: 110 }}
        >
          {BEHAVIOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {/* Facing direction */}
      <label style={fieldStyle}>
        <span style={labelStyle}>Direction</span>
        <select
          value={entity.facing}
          onChange={(e) => patch({ facing: e.target.value as FacingDir })}
          style={{ ...inputStyle, minWidth: 90 }}
        >
          {FACING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {/* Patrol target — shown only when behavior === 'patrol' */}
      {entity.behavior === 'patrol' && (
        <>
          <label style={fieldStyle}>
            <span style={labelStyle}>Cible X (col)</span>
            <input
              type="number"
              min={0}
              value={entity.patrolTargetCx ?? ''}
              placeholder="col"
              onChange={(e) =>
                patch({
                  patrolTargetCx: e.target.value !== '' ? parseInt(e.target.value, 10) : undefined,
                })
              }
              style={{ ...inputStyle, width: 52 }}
            />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Cible Y (rangée)</span>
            <input
              type="number"
              min={0}
              value={entity.patrolTargetCy ?? ''}
              placeholder="rang"
              onChange={(e) =>
                patch({
                  patrolTargetCy: e.target.value !== '' ? parseInt(e.target.value, 10) : undefined,
                })
              }
              style={{ ...inputStyle, width: 52 }}
            />
          </label>
        </>
      )}

      {/* Dialogue scene — shown when behavior === 'dialogue' */}
      {entity.behavior === 'dialogue' && (
        <>
          <label style={{ ...fieldStyle, minWidth: 120 }}>
            <span style={labelStyle}>ID scène dialogue</span>
            <input
              type="text"
              value={entity.dialogueSceneId ?? ''}
              placeholder="scene-abc"
              onChange={(e) => patch({ dialogueSceneId: e.target.value || undefined })}
              style={{ ...inputStyle, minWidth: 120 }}
            />
          </label>
          <label style={{ ...fieldStyle, minWidth: 140 }}>
            <span style={labelStyle}>Texte dialogue</span>
            <input
              type="text"
              value={entity.dialogueText ?? ''}
              placeholder="Bonjour…"
              onChange={(e) => patch({ dialogueText: e.target.value || undefined })}
              style={{ ...inputStyle, minWidth: 140 }}
            />
          </label>
        </>
      )}

      {/* Entry sound — always visible */}
      <label style={fieldStyle}>
        <span style={labelStyle}>🔊 Son d'entrée</span>
        <select
          value={entity.entrySoundId ?? ''}
          onChange={(e) => patch({ entrySoundId: e.target.value || undefined })}
          style={{ ...inputStyle, minWidth: 110 }}
        >
          <option value="">Aucun</option>
          {SOUND_BRICKS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.emoji} {b.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
