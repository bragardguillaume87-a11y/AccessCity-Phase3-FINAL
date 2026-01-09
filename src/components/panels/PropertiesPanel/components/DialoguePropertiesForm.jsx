import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { AutoSaveIndicator } from '../../../ui/AutoSaveIndicator.tsx';
import { ChoiceEditor } from './ChoiceEditor.jsx';
import { Copy, Plus } from 'lucide-react';

/**
 * DialoguePropertiesForm - Edit dialogue properties
 *
 * Displays and allows editing of:
 * - Speaker selection
 * - Dialogue text
 * - Choices (with add/delete)
 * - Choice details (text, next scene, dice rolls)
 * - Duplicate dialogue button
 *
 * @param {Object} props
 * @param {Object} props.dialogue - Dialogue object to edit
 * @param {number} props.dialogueIndex - Index of dialogue in scene
 * @param {Object} props.scene - Scene object containing dialogue
 * @param {Array} props.characters - All characters (for speaker dropdown)
 * @param {Function} props.onUpdate - Callback to update dialogue (sceneId, dialogueIndex, updates)
 * @param {Function} props.onDuplicate - Callback to duplicate dialogue
 * @param {number} props.lastSaved - Last saved timestamp
 * @param {boolean} props.isSaving - Whether currently saving
 */
export function DialoguePropertiesForm({
  dialogue,
  dialogueIndex,
  scene,
  characters,
  onUpdate,
  onDuplicate,
  lastSaved,
  isSaving
}) {
  const [activeTab, setActiveTab] = useState('properties');

  const handleUpdate = (updates) => {
    onUpdate(scene.id, dialogueIndex, updates);
  };

  const handleAddChoice = () => {
    const newChoice = {
      id: `choice-${Date.now()}`,
      text: 'New choice',
      nextScene: '',
      effects: []
    };
    const updatedChoices = [...(dialogue.choices || []), newChoice];
    handleUpdate({ choices: updatedChoices });
  };

  const handleUpdateChoice = (choiceIndex, updatedChoice) => {
    const updatedChoices = [...(dialogue.choices || [])];
    updatedChoices[choiceIndex] = updatedChoice;
    handleUpdate({ choices: updatedChoices });
  };

  const handleDeleteChoice = (choiceIndex) => {
    const updatedChoices = dialogue.choices.filter((_, i) => i !== choiceIndex);
    handleUpdate({ choices: updatedChoices });
  };

  return (
    <div className="h-full flex flex-col bg-slate-800">
      {/* Header with duplicate button */}
      <div className="flex-shrink-0 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
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
      <div className="flex-shrink-0 border-b border-slate-700">
        <div className="flex px-4" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'properties'}
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'properties'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-300'
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
                : 'text-slate-500 hover:text-slate-300'
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
            <label htmlFor="dialogue-speaker" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Speaker
            </label>
            <select
              id="dialogue-speaker"
              value={dialogue.speaker || ''}
              onChange={(e) => handleUpdate({ speaker: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label htmlFor="dialogue-text" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Text
            </label>
            <textarea
              id="dialogue-text"
              value={dialogue.text || ''}
              onChange={(e) => handleUpdate({ text: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter dialogue text"
            />
          </div>

          {/* Stats */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Info</h4>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Index:</span>
                <span className="text-slate-300 font-semibold">{dialogueIndex}</span>
              </div>
              <div className="flex justify-between">
                <span>Choices:</span>
                <span className="text-slate-300 font-semibold">{dialogue.choices?.length || 0}</span>
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
              />
            ))
          ) : (
            <div className="text-center py-8 text-slate-600">
              <p className="text-sm">No choices for this dialogue</p>
              <p className="text-xs mt-1">Click "+ Add Choice" to create branching</p>
            </div>
          )}
        </div>
      )}

      {/* Auto-save indicator */}
      <div className="flex-shrink-0 border-t border-slate-700 p-3">
        <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
      </div>
    </div>
  );
}

DialoguePropertiesForm.propTypes = {
  dialogue: PropTypes.shape({
    speaker: PropTypes.string,
    text: PropTypes.string,
    choices: PropTypes.array
  }).isRequired,
  dialogueIndex: PropTypes.number.isRequired,
  scene: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  characters: PropTypes.array.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  lastSaved: PropTypes.number,
  isSaving: PropTypes.bool
};
