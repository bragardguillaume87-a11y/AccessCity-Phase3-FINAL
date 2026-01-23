import { useCallback } from 'react';
import type { Scene, Character, SelectedElementType, ModalType } from '@/types';
import {
  useUIStore,
  useScenes,
  useCharacterActions,
  useSceneActions,
  useDialogueActions,
  useSceneCharacterActions
} from '../../stores/index';
import { duplicateDialogue, duplicateCharacter } from '../../utils/duplication';
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
  // Zustand stores (memoized selectors)
  const scenes = useScenes();
  const { updateScene } = useSceneActions();
  const { addDialogue, updateDialogue } = useDialogueActions();
  const { updateSceneCharacter } = useSceneCharacterActions();
  const { addCharacter, updateCharacter } = useCharacterActions();
  const lastSavedStr = useUIStore(state => state.lastSaved);
  const isSaving = useUIStore(state => state.isSaving);

  // Convert lastSaved from string to number (timestamp) for sub-components
  const lastSaved = lastSavedStr ? new Date(lastSavedStr).getTime() : undefined;

  // IMPORTANT: All hooks must be called BEFORE any conditional returns (React rules)
  // Memoized character duplication handler
  const handleDuplicateCharacter = useCallback((character: Character) => {
    const existingIds = characters.map(c => c.id);
    const existingNames = characters.map(c => c.name);
    const duplicate = duplicateCharacter(character, existingIds, existingNames);
    addCharacter();
    updateCharacter(duplicate);
  }, [characters, addCharacter, updateCharacter]);

  // Memoized dialogue duplication handler
  const handleDuplicateDialogue = useCallback((sceneId: string, dialogueIndex: number) => {
    const scene = scenes.find(s => s.id === sceneId);
    const dialogue = scene?.dialogues?.[dialogueIndex];
    if (dialogue) {
      const duplicated = duplicateDialogue(dialogue);
      addDialogue(sceneId, duplicated);
    }
  }, [scenes, addDialogue]);

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
          <p className="text-sm text-muted-foreground">Character not found</p>
        </div>
      );
    }

    return (
      <CharacterPropertiesForm
        character={character}
        characters={characters}
        selectedElement={selectedElement}
        scenes={scenes}
        onUpdate={updateCharacter}
        onDuplicate={() => handleDuplicateCharacter(character)}
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
          <p className="text-sm text-muted-foreground">Character not found in scene</p>
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
          <p className="text-sm text-muted-foreground">Dialogue not found</p>
        </div>
      );
    }

    return (
      <DialoguePropertiesForm
        dialogue={dialogue}
        dialogueIndex={selectedElement.index}
        scene={selectedScene}
        characters={characters}
        scenes={scenes}
        onUpdate={updateDialogue}
        onDuplicate={() => handleDuplicateDialogue(selectedScene.id, selectedElement.index)}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
    );
  }

  // Unknown element type
  return (
    <div className="h-full flex items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Unknown element type</p>
    </div>
  );
}
