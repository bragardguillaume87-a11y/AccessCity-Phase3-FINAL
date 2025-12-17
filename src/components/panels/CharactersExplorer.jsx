import React from 'react';
import CharacterCard from '../ui/CharacterCard';

const CharactersExplorer = ({ characters, selectedId, onSelect, onCreate, onDuplicate, onDelete, labels }) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
      <header style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{labels?.charactersList || 'Personnages'}</h3>
        <button 
          onClick={onCreate}
          style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {labels?.new || '+'}
        </button>
      </header>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {characters.map(char => (
          <CharacterCard 
            key={char.id} 
            character={char} 
            isSelected={char.id === selectedId}
            onClick={onSelect}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
export default CharactersExplorer;
