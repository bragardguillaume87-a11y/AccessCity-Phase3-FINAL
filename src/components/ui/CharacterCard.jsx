import React from 'react';
import styles from './CharacterCard.module.css';

const CharacterCard = ({ character, isSelected, onClick, onDelete, onDuplicate }) => {
  return (
    <div 
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={() => onClick(character.id)}
    >
      <div className={styles.info}>
        <strong>{character.name}</strong>
        <p>{character.description?.substring(0, 50)}...</p>
      </div>
      <div className={styles.actions}>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(character.id); }}>D</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(character.id); }}>X</button>
      </div>
    </div>
  );
};
export default CharacterCard;
