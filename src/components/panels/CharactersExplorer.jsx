import React from 'react';
import CharacterCard from '../ui/CharacterCard';

const CharactersExplorer = ({ characters, selectedId, onSelect, onCreate, onDuplicate, onDelete, labels }) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '10px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
        <h3>{labels.charactersList}</h3>
        <button onClick={onCreate}>{labels.new}</button>
      </header>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
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
