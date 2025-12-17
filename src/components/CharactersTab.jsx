import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CharactersExplorer from './panels/CharactersExplorer';
import CharacterEditor from './panels/CharacterEditor'; // Gardez le placeholder pour l'instant
import CharacterProperties from './panels/CharacterProperties'; // Gardez le placeholder pour l'instant
import { useCharacters } from './hooks/useCharacters';

export const CharactersTab = ({ scenes }) => {
  const { t } = useTranslation('characters');
  const { characters, createCharacter, duplicateCharacter, removeCharacter, updateCharacter } = useCharacters();
  const [selectedId, setSelectedId] = useState(null);

  const selectedCharacter = characters.find(c => c.id === selectedId);

  // Traduction "manuelle" pour éviter les bugs si le json n'est pas chargé
  const labels = {
    charactersList: t('charactersList', 'Liste Personnages'),
    new: t('new', 'Nouveau'),
    properties: t('properties', 'Propriétés'),
    editCharacter: t('editCharacter', 'Éditer'),
    save: t('save', 'Sauvegarder'),
    cancel: t('cancel', 'Annuler')
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', height: '100%', width: '100%' }}>
      {/* Volet Gauche */}
      <CharactersExplorer
        characters={characters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setSelectedId(createCharacter())}
        onDuplicate={duplicateCharacter}
        onDelete={(id) => { removeCharacter(id); if(selectedId === id) setSelectedId(null); }}
        labels={labels}
      />
      
      {/* Volet Central (MainCanvas) */}
      <div style={{ padding: '20px', backgroundColor: '#f3f4f6', overflow: 'auto' }}>
        {selectedCharacter ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2>{selectedCharacter.name}</h2>
            <p>{selectedCharacter.description || "Aucune description"}</p>
            {/* Ici viendra l'éditeur visuel plus tard */}
          </div>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            Sélectionnez un personnage pour commencer
          </div>
        )}
        {/* Affichage temporaire de l'éditeur modal si besoin */}
        <CharacterEditor />
      </div>

      {/* Volet Droit */}
      <div style={{ borderLeft: '1px solid #e5e7eb', background: 'white' }}>
        <CharacterProperties character={selectedCharacter} labels={labels} />
      </div>
    </div>
  );
};
