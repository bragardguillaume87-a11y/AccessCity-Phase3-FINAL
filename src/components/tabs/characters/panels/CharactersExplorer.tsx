import React from 'react';
import { CharacterCard } from '../components/CharacterCard';

/**
 * Panneau gauche : Liste/explorateur de personnages
 * Affiche tous les personnages sous forme de cartes avec actions CRUD
 */
export const CharactersExplorer = ({
  characters = [],
  selectedId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  labels = {}
}) => {
  const sortedCharacters = [...characters].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <aside style={{
      width: '300px',
      borderRight: '1px solid #e2e8f0',
      padding: '20px',
      overflowY: 'auto',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
          {labels.characters || 'Personnages'}
        </h2>
        <button
          onClick={onCreate}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          + {labels.new || 'Nouveau'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedCharacters.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            border: '2px dashed #cbd5e1',
            borderRadius: '8px',
            backgroundColor: '#f1f5f9',
            color: '#64748b'
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {labels.noCharacters || 'Aucun personnage'}
            </p>
          </div>
        )}

        {sortedCharacters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isSelected={character.id === selectedId}
            onSelect={() => onSelect(character.id)}
            onDuplicate={() => onDuplicate(character.id)}
            onDelete={() => onDelete(character.id)}
            labels={labels}
          />
        ))}
      </div>
    </aside>
  );
};
