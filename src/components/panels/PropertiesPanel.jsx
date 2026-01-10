import PropTypes from 'prop-types';
import { useScenesStore, useCharactersStore, useUIStore } from '../../stores/index.js';
import { duplicateDialogue } from '../../utils/duplication.js';
import { EmptySelectionState } from './PropertiesPanel/components/EmptySelectionState';
import { ScenePropertiesForm } from './PropertiesPanel/components/ScenePropertiesForm';
import { CharacterPropertiesForm } from './PropertiesPanel/components/CharacterPropertiesForm';
import { SceneCharacterPlacementForm } from './PropertiesPanel/components/SceneCharacterPlacementForm';
import { DialoguePropertiesForm } from './PropertiesPanel/components/DialoguePropertiesForm';

/**
 * PropertiesPanel - Right sidebar for editing selected element properties
 *
 * Routes to the appropriate form component based on selected element type:
 * - Scene → ScenePropertiesForm
 * - Character → CharacterPropertiesForm
 * - SceneCharacter → SceneCharacterPlacementForm
 * - Dialogue → DialoguePropertiesForm
 * - None → EmptySelectionState
 */
function PropertiesPanel({ selectedElement, selectedScene, characters, onOpenModal }) {
  // Zustand stores (granular selectors)
  const updateScene = useScenesStore(state => state.updateScene);
  const updateDialogue = useScenesStore(state => state.updateDialogue);
  const addDialogue = useScenesStore(state => state.addDialogue);
  const updateSceneCharacter = useScenesStore(state => state.updateSceneCharacter);
  const scenes = useScenesStore(state => state.scenes);
  const updateCharacter = useCharactersStore(state => state.updateCharacter);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const lastSaved = useUIStore(state => state.lastSaved);
  const isSaving = useUIStore(state => state.isSaving);

  // No selection
  if (!selectedElement) {
    return <EmptySelectionState />;
  }

  // Scene properties
  if (selectedElement.type === 'scene' && selectedScene) {
    return (
      <ScenePropertiesForm
        scene={selectedScene}
        onUpdate={updateScene}
        onOpenModal={onOpenModal}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
    );
  }

  // Character properties
  if (selectedElement.type === 'character') {
    const character = characters.find(c => c.id === selectedElement.id);
    if (!character) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <p className="text-sm text-slate-500">Character not found</p>
        </div>
      );
    }

    const handleDuplicate = () => {
      const duplicate = {
        ...character,
        name: `${character.name} (copy)`,
        sprites: { ...character.sprites },
        moods: [...(character.moods || [])]
      };
      delete duplicate.id;
      addCharacter(duplicate);
    };

    return (
      <CharacterPropertiesForm
        character={character}
        characters={characters}
        selectedElement={selectedElement}
        scenes={scenes}
        onUpdate={updateCharacter}
        onDuplicate={handleDuplicate}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
    );
  }

  // Scene character placement
  if (selectedElement.type === 'sceneCharacter' && selectedScene) {
    const sceneChar = selectedScene.characters?.find(sc => sc.id === selectedElement.sceneCharacterId);
    const character = sceneChar ? characters.find(c => c.id === sceneChar.characterId) : null;

    if (!sceneChar || !character) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <p className="text-sm text-slate-500">Character not found in scene</p>
        </div>
      );
    }

    return (
      <SceneCharacterPlacementForm
        sceneCharacter={sceneChar}
        character={character}
        scene={selectedScene}
        onUpdate={updateSceneCharacter}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
    );
  }

  // Dialogue properties
  if (selectedElement.type === 'dialogue' && selectedScene) {
    const dialogue = selectedScene.dialogues?.[selectedElement.index];
    if (!dialogue) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <p className="text-sm text-slate-500">Dialogue not found</p>
        </div>
      );
    }

    const handleDuplicateDialogue = () => {
      const duplicated = duplicateDialogue(dialogue);
      addDialogue(selectedScene.id, duplicated);
    };

    return (
      <DialoguePropertiesForm
        dialogue={dialogue}
        dialogueIndex={selectedElement.index}
        scene={selectedScene}
        characters={characters}
        onUpdate={updateDialogue}
        onDuplicate={handleDuplicateDialogue}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
    );
  }

  // Unknown element type
  return (
    <div className="h-full flex items-center justify-center p-6">
      <p className="text-sm text-slate-500">Unknown element type</p>
    </div>
  );
}

PropertiesPanel.propTypes = {
  selectedElement: PropTypes.shape({
    type: PropTypes.string,
    id: PropTypes.string,
    sceneId: PropTypes.string,
    sceneCharacterId: PropTypes.string,
    index: PropTypes.number
  }),
  selectedScene: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    backgroundUrl: PropTypes.string,
    dialogues: PropTypes.array,
    characters: PropTypes.array
  }),
  characters: PropTypes.array.isRequired,
  onOpenModal: PropTypes.func
};

export default PropertiesPanel;
