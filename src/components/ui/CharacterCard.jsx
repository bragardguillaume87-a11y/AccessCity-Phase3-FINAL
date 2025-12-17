import React from 'react';

// Styles simples pour le rendu immédiat
const styles = {
  card: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    backgroundColor: 'white',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  selected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    boxShadow: '0 0 0 2px rgba(37,99,235,0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  name: { fontWeight: '600', margin: 0, fontSize: '0.95rem' },
  actions: { display: 'flex', gap: '8px' },
  btn: { padding: '2px 8px', fontSize: '11px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#f9fafb' },
  btnDelete: { color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }
};

const CharacterCard = ({ character, isSelected, onClick, onDelete, onDuplicate }) => {
  return (
    <div 
      style={{ ...styles.card, ...(isSelected ? styles.selected : {}) }}
      onClick={() => onClick(character.id)}
    >
      <div style={styles.header}>
        <h4 style={styles.name}>{character.name}</h4>
      </div>
      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px' }}>
        {character.description ? character.description.substring(0, 50) + (character.description.length > 50 ? '...' : '') : <em>Pas de description</em>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
        <button style={styles.btn} onClick={(e) => { e.stopPropagation(); onDuplicate(character.id); }}>Dupliquer</button>
        <button style={{...styles.btn, ...styles.btnDelete}} onClick={(e) => { e.stopPropagation(); onDelete(character.id); }}>Supprimer</button>
      </div>
    </div>
  );
};
export default CharacterCard;
