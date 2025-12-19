import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Imports des sous-composants
import { CharactersExplorer } from './panels/CharactersExplorer.jsx';
import { CharacterEditor } from './panels/CharacterEditor.jsx';
import { CharacterProperties } from './panels/CharacterProperties.jsx';
import { useCharacters } from './hooks/useCharacters.js';

// Import du CSS Module
import styles from './CharactersTab.module.css';

/**
 * Onglet Characters - Architecture 3 panneaux
 * - Gauche: Liste des personnages (CharactersExplorer)
 * - Centre: Prévisualisation du personnage sélectionné
 * - Droite: Propriétés techniques (CharacterProperties)
 * - Modal: Éditeur de personnage (CharacterEditor)
 */
export const CharactersTab = ({ scenes = [] }) => {
  const { t } = useTranslation('characters');
  const {
    characters,
    createCharacter,
    duplicateCharacter,
    removeCharacter,
    updateCharacter
  } = useCharacters();

  const [selectedId, setSelectedId] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);

  const selectedCharacter = characters.find(c => c.id === selectedId);

  const handleCreate = () => {
    const newId = createCharacter();
    setSelectedId(newId);
    // Ouvrir l'éditeur directement après création
    setTimeout(() => {
      const newChar = characters.find(c => c.id === newId);
      if (newChar) setEditingCharacter(newChar);
    }, 100);
  };

  const handleDuplicate = (charId) => {
    const duplicateId = duplicateCharacter(charId);
    if (duplicateId) {
      setSelectedId(duplicateId);
    }
  };

  const handleDelete = (charId) => {
    const result = removeCharacter(charId);
    if (!result.success) {
      alert(result.error);
      return;
    }
    if (selectedId === charId) {
      setSelectedId(null);
    }
  };

  const handleEdit = (character) => {
    setEditingCharacter(character);
  };

  const handleSave = (updatedCharacter) => {
    updateCharacter(updatedCharacter);
    setEditingCharacter(null);
  };

  const labels = {
    characters: t('characters', 'Personnages'),
    new: t('new', 'Nouveau'),
    noCharacters: t('noCharacters', 'Aucun personnage'),
    editCharacter: t('editCharacter', 'Éditer le personnage'),
    save: t('save', 'Enregistrer'),
    cancel: t('cancel', 'Annuler'),
    name: t('name', 'Nom'),
    description: t('description', 'Description'),
    properties: t('properties', 'Propriétés'),
    selectCharacter: t('selectCharacter', 'Sélectionnez un personnage'),
    edit: t('edit', 'Éditer')
  };

  return (
    <div className={styles.container}>
      {/* 1. Panneau Gauche : Liste */}
      <CharactersExplorer
        characters={characters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        labels={labels}
      />

      {/* 2. Panneau Central : Prévisualisation */}
      <main className={styles.main}>
        {selectedCharacter ? (
          <div className={styles.details}>
            <header className={styles.detailsHeader}>
              <h2>{selectedCharacter.name}</h2>
              <button
                onClick={() => handleEdit(selectedCharacter)}
                className={styles.editBtn}
              >
                {labels.edit}
              </button>
            </header>

            {/* Avatars */}
            {selectedCharacter.sprites && Object.keys(selectedCharacter.sprites).length > 0 && (
              <div className={styles.avatarPreview}>
                {Object.entries(selectedCharacter.sprites).map(([mood, url]) => (
                  <div key={mood} className={styles.avatarItem}>
                    {url ? (
                      <img src={url} alt={mood} />
                    ) : (
                      <div style={{
                        width: '100px',
                        height: '120px',
                        background: '#eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}>
                        ?
                      </div>
                    )}
                    <span>{mood}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <p className={styles.description}>
              {selectedCharacter.description || <em>Aucune description</em>}
            </p>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>{labels.selectCharacter}</p>
          </div>
        )}
      </main>

      {/* 3. Panneau Droit : Propriétés techniques */}
      <CharacterProperties
        character={selectedCharacter}
        scenes={scenes}
        labels={labels}
      />

      {/* 4. Modale d'édition */}
      {editingCharacter && (
        <CharacterEditor
          character={editingCharacter}
          characters={characters}
          onSave={handleSave}
          onClose={() => setEditingCharacter(null)}
          labels={labels}
        />
      )}
    </div>
  );
};
