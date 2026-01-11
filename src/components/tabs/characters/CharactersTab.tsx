import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CharactersExplorer } from './panels/CharactersExplorer';
import { CharacterEditor } from './panels/CharacterEditor';
import { CharacterProperties } from './panels/CharacterProperties';
import { useCharacters } from '@/hooks/useCharacters';
import styles from './CharactersTab.module.css';
import type { Character, Scene } from '@/types';

/**
 * Labels for internationalization
 */
export interface CharactersTabLabels {
  characters?: string;
  new?: string;
  noCharacters?: string;
  editCharacter?: string;
  save?: string;
  cancel?: string;
  name?: string;
  description?: string;
  properties?: string;
  selectCharacter?: string;
  edit?: string;
}

/**
 * Props for CharactersTab component
 */
export interface CharactersTabProps {
  /** Array of scenes (used for character usage statistics) */
  scenes?: Scene[];
}

/**
 * CharactersTab - 3-Panel Character Management Architecture
 *
 * Layout:
 * - Left: Character list (CharactersExplorer)
 * - Center: Selected character preview
 * - Right: Technical properties (CharacterProperties)
 * - Modal: Character editor (CharacterEditor)
 *
 * @example
 * \`\`\`tsx
 * <CharactersTab scenes={scenes} />
 * \`\`\`
 */
export const CharactersTab: React.FC<CharactersTabProps> = ({ scenes = [] }) => {
  const { t } = useTranslation('characters');
  const {
    characters,
    createCharacter,
    duplicateCharacter,
    removeCharacter,
    updateCharacter
  } = useCharacters();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const selectedCharacter = characters.find(c => c.id === selectedId);

  const handleCreate = () => {
    const newId = createCharacter();
    setSelectedId(newId);
    // Open editor directly after creation
    setTimeout(() => {
      const newChar = characters.find(c => c.id === newId);
      if (newChar) setEditingCharacter(newChar);
    }, 100);
  };

  const handleDuplicate = (charId: string) => {
    const duplicateId = duplicateCharacter(charId);
    if (duplicateId) {
      setSelectedId(duplicateId);
    }
  };

  const handleDelete = (charId: string) => {
    const result = removeCharacter(charId);
    if (!result.success) {
      alert(result.error);
      return;
    }
    if (selectedId === charId) {
      setSelectedId(null);
    }
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
  };

  const handleSave = (updatedCharacter: Character) => {
    updateCharacter(updatedCharacter);
    setEditingCharacter(null);
  };

  const labels: CharactersTabLabels = {
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
      {/* 1. Left Panel: Character List */}
      <CharactersExplorer
        characters={characters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        labels={labels}
      />

      {/* 2. Center Panel: Preview */}
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

      {/* 3. Right Panel: Technical Properties */}
      <CharacterProperties
        character={selectedCharacter}
        scenes={scenes}
        labels={labels}
      />

      {/* 4. Editor Modal */}
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
