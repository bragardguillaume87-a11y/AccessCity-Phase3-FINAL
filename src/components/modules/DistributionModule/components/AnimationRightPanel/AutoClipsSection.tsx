import { useState } from 'react';
import type { AnimationClip, CharacterRig } from '@/types/bone';
import { sectionLabel, selectStyle, smallBtn } from './styles';

interface AutoClipsSectionProps {
  rig: CharacterRig;
  clips: AnimationClip[];
  onSetIdleClip: (rigId: string, clipId: string | null) => void;
  onSetSpeakClip: (rigId: string, clipId: string | null) => void;
}

/**
 * AutoClipsSection — Assignation idle/speak.
 * Replié par défaut (Will Wright §4.3 : contenu avancé révélé à la demande).
 */
export function AutoClipsSection({
  rig,
  clips,
  onSetIdleClip,
  onSetSpeakClip,
}: AutoClipsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border-base)',
        flexShrink: 0,
      }}
    >
      {/* Header accordéon */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '8px 10px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ ...sectionLabel, flex: 1 }}>🎭 Joué automatiquement</span>
        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
          {rig.idleClipId || rig.speakClipId ? '✅ configuré' : '— non configuré'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 4 }}>
          {expanded ? '▴' : '▾'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 10px 10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 52, flexShrink: 0 }}
              >
                😴 Au repos
              </span>
              <select
                value={rig.idleClipId ?? ''}
                onChange={(e) => onSetIdleClip(rig.id, e.target.value || null)}
                style={selectStyle}
                title="Animation jouée en boucle quand le personnage ne fait rien"
              >
                <option value="">— aucun —</option>
                {clips.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 52, flexShrink: 0 }}
              >
                🗣 En parole
              </span>
              <select
                value={rig.speakClipId ?? ''}
                onChange={(e) => onSetSpeakClip(rig.id, e.target.value || null)}
                style={selectStyle}
                title="Animation jouée quand ce personnage parle dans une scène"
              >
                <option value="">— aucun —</option>
                {clips.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <p
              style={{
                fontSize: 9,
                color: 'var(--color-text-muted)',
                lineHeight: 1.4,
                marginTop: 2,
              }}
            >
              Ces animations se lancent toutes seules dans l'aperçu du jeu — sans que tu aies à
              faire quoi que ce soit.
            </p>
          </div>
        </div>
      )}

      {/* Bouton ✨ Idle accessible même replié */}
      {!expanded && !rig.idleClipId && (
        <div style={{ padding: '0 10px 8px' }}>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{ ...smallBtn, fontSize: 9, color: 'var(--color-text-muted)' }}
          >
            ▾ Configurer
          </button>
        </div>
      )}
    </div>
  );
}
