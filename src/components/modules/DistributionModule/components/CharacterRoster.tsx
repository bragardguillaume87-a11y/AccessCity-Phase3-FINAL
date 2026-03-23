import { useMemo } from 'react';
import { useCharactersStore } from '@/stores';
import { useRigStore } from '@/stores/rigStore';
import type { Character } from '@/types/characters';

interface CharacterRosterProps {
  selectedCharacterId: string | null;
  onSelect: (characterId: string) => void;
}

/**
 * CharacterRoster — Liste des personnages avec badge rig (vert = rig existant, gris = aucun).
 */
export function CharacterRoster({ selectedCharacterId, onSelect }: CharacterRosterProps) {
  const characters = useCharactersStore((s) => s.characters);
  const rigs = useRigStore((s) => s.rigs);

  const riggedIds = useMemo(() => new Set(rigs.map((r) => r.characterId)), [rigs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 6px' }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          padding: '4px 6px 8px',
        }}
      >
        Personnages
      </p>

      {characters.map((char: Character) => {
        const isActive = char.id === selectedCharacterId;
        const hasRig = riggedIds.has(char.id);
        const portrait = char.sprites['default'] ?? Object.values(char.sprites)[0] ?? null;

        return (
          <button
            key={char.id}
            type="button"
            onClick={() => onSelect(char.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
              background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.12s, border-color 0.12s',
            }}
          >
            {/* Miniature portrait */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                flexShrink: 0,
                background: 'var(--color-bg-hover)',
                overflow: 'hidden',
                border: '1px solid var(--color-border-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {portrait ? (
                <img
                  src={portrait}
                  alt={char.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: 14 }}>🧑</span>
              )}
            </div>

            {/* Nom */}
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {char.name}
            </span>

            {/* Badge rig */}
            <span
              title={hasRig ? 'Rig existant' : 'Aucun rig'}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                flexShrink: 0,
                background: hasRig ? 'var(--color-success)' : 'var(--color-text-disabled)',
              }}
            />
          </button>
        );
      })}

      {characters.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '8px 6px' }}>
          Aucun personnage. Créez-en un d'abord.
        </p>
      )}
    </div>
  );
}
