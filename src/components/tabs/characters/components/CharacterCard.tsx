import React from 'react';
import type { Character } from '@/types';

/**
 * Props for CharacterCard component
 */
export interface CharacterCardProps {
  /** Character data */
  character: Character;
  /** Whether this character is selected */
  isSelected: boolean;
  /** Callback when character is selected */
  onSelect: () => void;
  /** Callback to duplicate character */
  onDuplicate: () => void;
  /** Callback to delete character */
  onDelete: () => void;
  /** Labels for i18n */
  labels?: Record<string, string>;
}

/**
 * CharacterCard - Character display card
 * Affiche le nom, un aperçu et les actions (dupliquer, supprimer)
 */
export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  labels = {}
}) => {
  const isSystemCharacter = character.id === 'player' || character.id === 'narrator';

  const cardStyle = {
    padding: '12px',
    backgroundColor: isSelected ? '#dbeafe' : 'white',
    border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) {
      e.currentTarget.style.borderColor = '#cbd5e1';
      e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0,0,0,0.05)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) {
      e.currentTarget.style.borderColor = '#e2e8f0';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  return (
    <div
      style={cardStyle}
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* En-tête avec nom et badge système */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#1e293b',
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {character.name}
        </h3>

        {isSystemCharacter && (
          <span style={{
            fontSize: '0.625rem',
            padding: '2px 6px',
            backgroundColor: '#fbbf24',
            color: '#78350f',
            borderRadius: '4px',
            fontWeight: '600',
            marginLeft: '8px',
            flexShrink: 0
          }}>
            SYSTÈME
          </span>
        )}
      </div>

      {/* Aperçu de l'avatar */}
      {character.sprites && Object.keys(character.sprites).length > 0 && (
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '8px',
          overflow: 'hidden'
        }}>
          {Object.entries(character.sprites).slice(0, 3).map(([mood, url]) => (
            url && (
              <img
                key={mood}
                src={url}
                alt={mood}
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  backgroundColor: '#f1f5f9'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginTop: '8px'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          style={{
            flex: 1,
            padding: '6px',
            fontSize: '0.75rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#7c3aed'}
          onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#8b5cf6'}
          title="Dupliquer ce personnage"
        >
          📋
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isSystemCharacter) {
              alert('Impossible de supprimer un personnage système');
              return;
            }
            if (confirm(`Voulez-vous vraiment supprimer "${character.name}" ?`)) {
              onDelete();
            }
          }}
          disabled={isSystemCharacter}
          style={{
            flex: 1,
            padding: '6px',
            fontSize: '0.75rem',
            backgroundColor: isSystemCharacter ? '#e2e8f0' : '#ef4444',
            color: isSystemCharacter ? '#94a3b8' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSystemCharacter ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            if (!isSystemCharacter) {
              (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626';
            }
          }}
          onMouseOut={(e) => {
            if (!isSystemCharacter) {
              (e.target as HTMLButtonElement).style.backgroundColor = '#ef4444';
            }
          }}
          title={isSystemCharacter ? 'Personnage système protégé' : 'Supprimer ce personnage'}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
