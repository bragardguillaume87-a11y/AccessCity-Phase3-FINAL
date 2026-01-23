import * as React from 'react';
import { useState } from 'react';
import type { Dialogue, Scene, Character } from '@/types';
import { Button } from '@/components/ui/button';
import { AutoSaveIndicator } from '../../../ui/AutoSaveIndicator';
import { ChoiceEditor } from './ChoiceEditor';
import { Copy, Plus } from 'lucide-react';

export interface DialoguePropertiesFormProps {
  dialogue: Dialogue;
  dialogueIndex: number;
  scene: Scene;
  characters: Character[];
  scenes: Scene[];  // NEW: All scenes for dropdown navigation
  onUpdate: (sceneId: string, dialogueIndex: number, updates: Partial<Dialogue>) => void;
  onDuplicate: () => void;
  lastSaved?: number;
  isSaving?: boolean;
}

type TabType = 'properties' | 'choices';

/**
 * DialoguePropertiesForm - Edit dialogue properties
 *
 * Displays and allows editing of:
 * - Speaker selection
 * - Dialogue text
 * - Choices (with add/delete)
 * - Choice details (text, next scene, dice rolls)
 * - Duplicate dialogue button
 */
export function DialoguePropertiesForm({
  dialogue,
  dialogueIndex,
  scene,
  characters,
  scenes,
  onUpdate,
  onDuplicate,
  lastSaved,
  isSaving
}: DialoguePropertiesFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('properties');

  const handleUpdate = (updates: Partial<Dialogue>) => {
    onUpdate(scene.id, dialogueIndex, updates);
  };

  const handleAddChoice = () => {
    const newChoice = {
      id: `choice-${Date.now()}`,
      text: 'New choice',
      nextSceneId: '',
      effects: []
    };
    const updatedChoices = [...(dialogue.choices || []), newChoice];
    handleUpdate({ choices: updatedChoices });
  };

  const handleUpdateChoice = (choiceIndex: number, updatedChoice: Dialogue['choices'][number]) => {
    const updatedChoices = [...(dialogue.choices || [])];
    updatedChoices[choiceIndex] = updatedChoice;
    handleUpdate({ choices: updatedChoices });
  };

  const handleDeleteChoice = (choiceIndex: number) => {
    const updatedChoices = dialogue.choices.filter((_, i) => i !== choiceIndex);
    handleUpdate({ choices: updatedChoices });
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header with duplicate button */}
      <div className="flex-shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Dialogue Properties</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          title="Duplicate this dialogue"
        >
          <Copy className="h-3 w-3" />
          Duplicate
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="flex px-4" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'properties'}
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'properties'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Properties
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'choices'}
            onClick={() => setActiveTab('choices')}
            className={`px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'choices'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Choices ({dialogue.choices?.length || 0})
          </button>
        </div>
      </div>

      {/* Properties tab */}
      {activeTab === 'properties' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Speaker */}
          <div>
            <label htmlFor="dialogue-speaker" className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Speaker
            </label>
            <select
              id="dialogue-speaker"
              value={dialogue.speaker || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdate({ speaker: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select speaker --</option>
              {characters.map(char => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>

          {/* Text */}
          <div>
            <label htmlFor="dialogue-text" className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Text
            </label>
            <textarea
              id="dialogue-text"
              value={dialogue.text || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdate({ text: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter dialogue text"
            />
          </div>

          {/* Stats */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Info</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Index:</span>
                <span className="text-foreground font-semibold">{dialogueIndex}</span>
              </div>
              <div className="flex justify-between">
                <span>Choices:</span>
                <span className="text-foreground font-semibold">{dialogue.choices?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Choices tab */}
      {activeTab === 'choices' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Add Choice button */}
          <Button
            variant="gaming-success"
            size="default"
            onClick={handleAddChoice}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Add Choice
          </Button>

          {dialogue.choices && dialogue.choices.length > 0 ? (
            dialogue.choices.map((choice, choiceIdx) => (
              <ChoiceEditor
                key={choiceIdx}
                choice={choice}
                choiceIndex={choiceIdx}
                onUpdate={handleUpdateChoice}
                onDelete={handleDeleteChoice}
                scenes={scenes}
                currentSceneId={scene.id}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No choices for this dialogue</p>
              <p className="text-xs mt-1">Click "+ Add Choice" to create branching</p>
            </div>
          )}
        </div>
      )}

      {/* Auto-save indicator */}
      <div className="flex-shrink-0 border-t border-border p-3">
        <AutoSaveIndicator lastSaved={lastSaved ? new Date(lastSaved) : null} isSaving={isSaving} />
      </div>
    </div>
  );
}
