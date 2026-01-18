import type React from 'react';
import type { Scene, Character, Dialogue, SceneCharacter, SelectedElementType, ModalType } from '@/types';
import { useScenesStore, useCharactersStore, useUIStore } from '../../stores/index';
import { duplicateDialogue } from '../../utils/duplication';
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
export interface PropertiesPanelProps {
  selectedElement: SelectedElementType;
  selectedScene: Scene | undefined;
  characters: Character[];
  onOpenModal?: (modal: ModalType | string, context?: unknown) => void;
}

export default function PropertiesPanel({
  selectedElement,
  selectedScene,
  characters,
  onOpenModal
}: PropertiesPanelProps) {
  // Zustand stores (granular selectors)
  const updateScene = useScenesStore(state => state.updateScene);
  const updateDialogue = useScenesStore(state => state.updateDialogue);
  const addDialogue = useScenesStore(state => state.addDialogue);
  const updateSceneCharacter = useScenesStore(state => state.updateSceneCharacter);
  const scenes = useScenesStore(state => state.scenes);
  const updateCharacter = useCharactersStore(state => state.updateCharacter);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const lastSavedStr = useUIStore(state => state.lastSaved);
  const isSaving = useUIStore(state => state.isSaving);

  // Convert lastSaved from string to number (timestamp) for sub-components
  const lastSaved = lastSavedStr ? new Date(lastSavedStr).getTime() : undefined;

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
      // Create a new character ID and add the duplicate
      const newId = addCharacter();
      const duplicate: Character = {
        id: newId,
        name: `${character.name} (copy)`,
        description: character.description,
        sprites: { ...character.sprites },
        moods: [...(character.moods || [])]
      };
      updateCharacter(duplicate);
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
        scenes={scenes}
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
