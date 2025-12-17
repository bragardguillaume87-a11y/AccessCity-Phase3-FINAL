import React from 'react';

const CharacterProperties = ({ character, labels }) => {
  if (!character) return <div style={{ padding: '10px' }}>{labels.selectCharacter}</div>;
  return (
    <div style={{ padding: '10px' }}>
      <h3>{labels.properties}</h3>
      <p><strong>{labels.id}:</strong> {character.id}</p>
      <p><strong>{labels.name}:</strong> {character.name}</p>
      <p><strong>{labels.description}:</strong> {character.description || '-'}</p>
    </div>
  );
};
export default CharacterProperties;
