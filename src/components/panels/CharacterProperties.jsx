import React from 'react';
import PropTypes from 'prop-types';
// C'est ici l'important : on importe le fichier CSS qu'on a créé à l'étape 2 (CSS)
// Si vous n'avez pas créé de CharacterProperties.module.css spécifique,
// vous pouvez utiliser un style inline temporaire ou créer le fichier CSS.
// Pour faire simple et robuste maintenant, voici une version avec styles inline
// (comme ça pas d'erreur de fichier CSS manquant)

export const CharacterProperties = ({ character, scenes, labels }) => {
  const styles = {
    container: { padding: '20px', background: 'white', height: '100%', borderLeft: '1px solid #e5e7eb' },
    title: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', color: '#111827' },
    item: { marginBottom: '16px' },
    label: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px', fontWeight: '600' },
    value: { fontSize: '0.95rem', color: '#374151' },
    empty: { color: '#9ca3af', textAlign: 'center', marginTop: '40px' },
    moodBadge: { display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', borderRadius: '12px', fontSize: '0.8rem', marginRight: '5px', marginBottom: '5px' }
  };

  if (!character) {
    return (
      <aside style={styles.container}>
        <p style={styles.empty}>{labels?.selectCharacter || 'Sélectionnez un personnage'}</p>
      </aside>
    );
  }

  // On gère le cas où scenes est undefined
  const usedInScenes = (scenes || []).filter(scene => 
    scene.characters?.includes(character.id)
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return labels?.unknown || 'Inconnu';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <aside style={styles.container}>
      <h2 style={styles.title}>{labels?.properties || 'Propriétés'}</h2>

      <div style={styles.item}>
        <div style={styles.label}>{labels?.id || 'ID'}</div>
        <div style={styles.value}><code>{character.id}</code></div>
      </div>

      <div style={styles.item}>
        <div style={styles.label}>{labels?.createdAt || 'Créé le'}</div>
        <div style={styles.value}>{formatDate(character.createdAt)}</div>
      </div>

      <div style={styles.item}>
        <div style={styles.label}>{labels?.modifiedAt || 'Modifié le'}</div>
        <div style={styles.value}>{formatDate(character.modifiedAt)}</div>
      </div>

      <div style={styles.item}>
        <div style={styles.label}>{labels?.usedInScenes || 'Utilisé dans'}</div>
        <div style={styles.value}>
          {usedInScenes.length === 0 ? (
            <span style={{color: '#9ca3af'}}>{labels?.notUsed || 'Aucune scène'}</span>
          ) : (
            <ul style={{paddingLeft: '20px', margin: 0}}>
              {usedInScenes.map(scene => (
                <li key={scene.id}>{scene.title || scene.id}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={styles.item}>
        <div style={styles.label}>{labels?.moods || 'Humeurs'}</div>
        <div style={styles.value}>
          {character.moods && character.moods.map(mood => (
            <span key={mood} style={styles.moodBadge}>
              {labels?.moods?.[mood] || mood}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
};

CharacterProperties.propTypes = {
  character: PropTypes.object,
  scenes: PropTypes.array,
  labels: PropTypes.object
};
