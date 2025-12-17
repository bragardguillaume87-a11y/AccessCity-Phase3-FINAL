import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CharactersExplorer from './panels/CharactersExplorer';
import CharacterEditor from './panels/CharacterEditor';
import CharacterProperties from './panels/CharacterProperties';
import { useCharacters } from './hooks/useCharacters';
import styles from './CharactersTab.module.css';

export const CharactersTab = ({ scenes }) => {
  const { t } = useTranslation('characters');
  const { characters, createCharacter, duplicateCharacter, removeCharacter, updateCharacter } = useCharacters();
  const [selectedId, setSelectedId] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);

  const selectedCharacter = characters.find(c => c.id === selectedId);

  const handleCreate = () => {
    const newId = createCharacter();
    setSelectedId(newId);
    const newChar = characters.find(c => c.id === newId);
    if (newChar) setEditingCharacter(newChar);
  };

  const handleDuplicate = (charId) => {
    const duplicateId = duplicateCharacter(charId);
    if (duplicateId) setSelectedId(duplicateId);
  };

  const handleDelete = (charId) => {
    const result = removeCharacter(charId);
    if (!result.success) {
      alert(result.error);
      return;
    }
    if (selectedId === charId) setSelectedId(null);
  };

  const handleEdit = (character) => {
    setEditingCharacter(character);
  };

  const handleSave = (updatedCharacter) => {
    updateCharacter(updatedCharacter);
    setEditingCharacter(null);
  };

  const handleCloseEditor = () => {
    setEditingCharacter(null);
  };

  // Passage explicite des traductions pour éviter la dépendance pure à i18next dans les sous-composants
  const labels = {
    characters: t('characters'),
    charactersList: t('charactersList'),
    createCharacter: t('createCharacter'),
    new: t('new'),
    noCharacters: t('noCharacters'),
    character: t('character'),
    duplicate: t('duplicate'),
    delete: t('delete'),
    editCharacter: t('editCharacter'),
    close: t('close'),
    name: t('name'),
    description: t('description'),
    avatars: t('avatars'),
    moods: {
      neutral: t('mood.neutral'),
      professional: t('mood.professional'),
      helpful: t('mood.helpful')
    },
    selectAvatar: t('selectAvatar'),
    presetAvatars: t('presetAvatars'),
    or: t('or'),
    uploadCustom: t('uploadCustom'),
    currentAvatar: t('currentAvatar'),
    invalidFileType: t('invalidFileType'),
    fileTooLarge: t('fileTooLarge'),
    cancel: t('cancel'),
    save: t('save'),
    properties: t('properties'),
    selectCharacter: t('selectCharacter'),
    id: t('id'),
    createdAt: t('createdAt'),
    modifiedAt: t('modifiedAt'),
    usedInScenes: t('usedInScenes'),
    notUsed: t('notUsed'),
    unknown: t('unknown')
  };

  return (
    <div className={styles.container}>
      <CharactersExplorer
        characters={characters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        labels={labels}
      />
      
      <main className={styles.main} aria-label={t('characterDetails')}>
        {selectedCharacter ? (
          <div className={styles.details}>
            <header className={styles.detailsHeader}>
              <h2>{selectedCharacter.name}</h2>
              <button 
                onClick={() => handleEdit(selectedCharacter)}
                className={styles.editBtn}
                aria-label={`${t('edit')} ${selectedCharacter.name}`}
              >
                {t('edit')}
              </button>
            </header>
            
            <div className={styles.avatarPreview}>
              {Object.entries(selectedCharacter.sprites).map(([mood, url]) => (
                <div key={mood} className={styles.avatarItem}>
                  <img src={url} alt={`${selectedCharacter.name} ${mood}`} />
                  <span>{labels.moods[mood] || mood}</span>
                </div>
              ))}
            </div>
            
            {selectedCharacter.description && (
              <p className={styles.description}>{selectedCharacter.description}</p>
            )}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>{t('selectCharacterToView')}</p>
          </div>
        )}
      </main>

      <CharacterProperties 
        character={selectedCharacter}
        scenes={scenes}
        labels={labels}
      />

      {editingCharacter && (
        <CharacterEditor
          character={editingCharacter}
          characters={characters}
          onSave={handleSave}
          onClose={handleCloseEditor}
          labels={labels}
        />
      )}
    </div>
  );
};
