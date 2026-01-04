import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useScenesStore, useCharactersStore, useUIStore } from '../../stores/index.js';
import { AvatarPicker } from '../tabs/characters/components/AvatarPicker.jsx';
import { duplicateDialogue } from '../../utils/duplication.js';
import { CollapsibleSection, FormField } from '../ui/CollapsibleSection.jsx';
import { AutoSaveIndicator } from '../ui/AutoSaveIndicator.jsx';
import { Button } from '@/components/ui/button';
import { Upload, X, Copy, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { POSITION_PRESETS } from '@/utils/canvasPositioning';
import { useMoodManagement } from '@/hooks/useMoodManagement';

/**
 * PropertiesPanel - Right sidebar for editing selected element properties
 * Displays editable properties for:
 * - Scene (title, description, background)
 * - Character (name, description, sprites)
 * - Dialogue (speaker, text, choices, effects)
 * ASCII only, form-based editing.
 */
function PropertiesPanel({ selectedElement, selectedScene, characters, onOpenModal }) {
  // Zustand stores (granular selectors)
  const updateScene = useScenesStore(state => state.updateScene);
  const updateDialogue = useScenesStore(state => state.updateDialogue);
  const addDialogue = useScenesStore(state => state.addDialogue);
  const scenes = useScenesStore(state => state.scenes);
  const updateCharacter = useCharactersStore(state => state.updateCharacter);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const lastSaved = useUIStore(state => state.lastSaved);
  const isSaving = useUIStore(state => state.isSaving);

  const [activeTab, setActiveTab] = useState('properties');

  // Get current character (null if not viewing a character)
  const currentCharacter = selectedElement?.type === 'character'
    ? characters.find(c => c.id === selectedElement.id)
    : null;

  // Mood management (only active when viewing a character)
  const {
    newMood,
    setNewMood,
    activeMood,
    setActiveMood,
    moodError,
    setMoodError,
    handleAddMood,
    handleRemoveMood
  } = useMoodManagement({
    character: currentCharacter,
    characters,
    selectedElement,
    updateCharacter
  });

  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-slate-500 max-w-xs">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-slate-400 mb-1">Aucune sélection</h3>
          <p className="text-xs text-slate-600">
            Sélectionne une scène, un personnage ou un dialogue pour voir ses propriétés
          </p>
        </div>
      </div>
    );
  }

  // Render scene properties
  if (selectedElement.type === 'scene' && selectedScene) {
    return (
      <div className="h-full flex flex-col bg-slate-800">
        <div className="flex-shrink-0 border-b border-slate-700 px-4 py-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Scene Properties</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="scene-title" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Title
            </label>
            <input
              id="scene-title"
              type="text"
              value={selectedScene.title || ''}
              onChange={(e) => updateScene(selectedScene.id, { title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter scene title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="scene-description" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              id="scene-description"
              value={selectedScene.description || ''}
              onChange={(e) => updateScene(selectedScene.id, { description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the scene"
            />
          </div>

          {/* Background Image */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Arrière-plan
            </label>

            {/* Preview or Empty State */}
            {selectedScene.backgroundUrl ? (
              <div className="relative group rounded-lg overflow-hidden border border-slate-700 mb-3">
                <img
                  src={selectedScene.backgroundUrl}
                  alt="Background preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23334155" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2364748b" font-family="sans-serif" font-size="14"%3EImage non disponible%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (onOpenModal) {
                        onOpenModal('assets', { category: 'backgrounds', targetSceneId: selectedScene.id });
                      }
                    }}
                  >
                    <Upload className="h-3 w-3" />
                    Changer
                  </Button>
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    onClick={() => updateScene(selectedScene.id, { backgroundUrl: '' })}
                  >
                    <X className="h-3 w-3" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  if (onOpenModal) {
                    onOpenModal('assets', { category: 'backgrounds', targetSceneId: selectedScene.id });
                  }
                }}
                className="w-full h-40 border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-slate-900/50 flex flex-col gap-2 text-slate-500 hover:text-blue-400"
              >
                <ImageIcon className="w-12 h-12" />
                <span className="text-sm font-medium">Parcourir la bibliothèque</span>
                <span className="text-xs text-slate-600">Ou coller une URL ci-dessous</span>
              </Button>
            )}

            {/* Advanced: Manual URL Input */}
            <details className="mt-2">
              <summary className="text-xs text-slate-500 hover:text-slate-400 cursor-pointer select-none">
                Avancé : Saisir URL manuellement
              </summary>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={selectedScene.backgroundUrl || ''}
                  onChange={(e) => updateScene(selectedScene.id, { backgroundUrl: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="assets/backgrounds/scene.jpg"
                />
                {selectedScene.backgroundUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updateScene(selectedScene.id, { backgroundUrl: '' })}
                  >
                    <X className="h-3 w-3" />
                    Effacer
                  </Button>
                )}
              </div>
            </details>
          </div>

          {/* Stats */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Statistics</h4>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Dialogues:</span>
                <span className="text-slate-300 font-semibold">{selectedScene.dialogues?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Scene ID:</span>
                <span className="text-slate-300 font-mono text-[10px]">{selectedScene.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-save indicator */}
        <div className="flex-shrink-0 border-t border-slate-700 p-3">
          <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
        </div>
      </div>
    );
  }

  // Render character properties
  if (selectedElement.type === 'character') {
    const character = currentCharacter; // Already fetched at top level
    if (!character) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <p className="text-sm text-slate-500">Character not found</p>
        </div>
      );
    }

    const isSystemCharacter = character.id === 'player' || character.id === 'narrator';

    // Calculate usage statistics
    const appearancesCount = scenes.filter(scene =>
      scene.dialogues?.some(d => d.speaker === character.id)
    ).length;
    const linesCount = scenes.reduce((total, scene) => {
      const sceneLines = scene.dialogues?.filter(d => d.speaker === character.id).length || 0;
      return total + sceneLines;
    }, 0);

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
      <div className="h-full flex flex-col bg-slate-800">
        {/* Header with duplicate button */}
        <div className="flex-shrink-0 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Character Properties</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            title="Duplicate this character"
          >
            <Copy className="h-3 w-3" />
            Duplicate
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* System character badge */}
          {isSystemCharacter && (
            <div className="px-3 py-2 bg-amber-900/30 border border-amber-600 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold">System Character (Protected)</span>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="char-name" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Name
            </label>
            <input
              id="char-name"
              type="text"
              value={character.name || ''}
              onChange={(e) => updateCharacter({ ...character, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Character name"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="char-description" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              id="char-description"
              value={character.description || ''}
              onChange={(e) => updateCharacter({ ...character, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the character"
            />
          </div>

          {/* Moods (editable) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Moods
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {(character.moods || ['neutral']).map((mood) => (
                  <div
                    key={mood}
                    className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all ${
                      activeMood === mood
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    onClick={() => setActiveMood(mood)}
                  >
                    <span className="text-xs font-medium">{mood}</span>
                    {mood !== 'neutral' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMood(mood);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                        title="Remove mood"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add mood */}
              <div className="space-y-1">
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newMood}
                    onChange={(e) => {
                      setNewMood(e.target.value);
                      setMoodError(''); // Clear error on type
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMood()}
                    placeholder="Add mood (e.g., happy, angry)"
                    className={`flex-1 px-2 py-1 bg-slate-900 border rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                      moodError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-700 focus:ring-blue-500'
                    }`}
                    aria-invalid={!!moodError}
                    aria-describedby={moodError ? "mood-error" : undefined}
                  />
                  <Button
                    variant="gaming-success"
                    size="sm"
                    onClick={handleAddMood}
                    disabled={!newMood.trim()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {moodError && (
                  <p id="mood-error" className="text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {moodError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sprites (with AvatarPicker) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Avatar for "{activeMood}"
            </label>
            <AvatarPicker
              currentSprites={character.sprites || {}}
              onSelect={(mood, url) => {
                updateCharacter({
                  ...character,
                  sprites: { ...(character.sprites || {}), [mood]: url }
                });
              }}
              mood={activeMood}
              labels={{}}
            />
          </div>

          {/* Usage Statistics */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Usage Statistics</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Appears in scenes:</span>
                <span className="text-slate-300 font-semibold">{appearancesCount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total lines:</span>
                <span className="text-slate-300 font-semibold">{linesCount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Moods defined:</span>
                <span className="text-slate-300 font-semibold">{(character.moods || []).length}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sprites assigned:</span>
                <span className="text-slate-300 font-semibold">
                  {Object.values(character.sprites || {}).filter(Boolean).length} / {(character.moods || []).length}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Info</h4>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Character ID:</span>
                <span className="text-slate-300 font-mono text-[10px]">{character.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-save indicator */}
        <div className="flex-shrink-0 border-t border-slate-700 p-3">
          <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
        </div>
      </div>
    );
  }

  // Render scene character properties (character placed in a specific scene)
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

    const updateSceneCharacter = useScenesStore.getState().updateSceneCharacter;
    const currentPosition = sceneChar.position || { x: 50, y: 50 };
    const currentScale = sceneChar.scale || 1.0;
    const currentMood = sceneChar.mood || 'neutral';
    const currentZIndex = sceneChar.zIndex || 1;

    // Position presets
    const applyPositionPreset = (preset) => {
      updateSceneCharacter(selectedScene.id, sceneChar.id, { position: POSITION_PRESETS[preset] });
    };

    return (
      <div className="h-full flex flex-col bg-slate-800">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-700 px-4 py-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Scene Character Placement</h3>
          <p className="text-xs text-slate-400 mt-1">{character.name} in this scene</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Character Info - Collapsible (readonly) */}
          <CollapsibleSection title="Character Info" defaultOpen={false}>
            <div className="space-y-3">
              <FormField label="Name">
                <input
                  type="text"
                  value={character.name}
                  disabled
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-400 cursor-not-allowed"
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  value={character.description || 'No description'}
                  disabled
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-400 cursor-not-allowed resize-none"
                />
              </FormField>
            </div>
          </CollapsibleSection>

          {/* Scene Placement - Always open */}
          <CollapsibleSection title="Scene Placement" defaultOpen={true}>
            <div className="space-y-4">
              {/* Position Presets */}
              <FormField label="Quick Position">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={Math.abs(currentPosition.x - 20) < 5 ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => applyPositionPreset('left')}
                  >
                    ← Left
                  </Button>
                  <Button
                    variant={Math.abs(currentPosition.x - 50) < 5 ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => applyPositionPreset('center')}
                  >
                    Center
                  </Button>
                  <Button
                    variant={Math.abs(currentPosition.x - 80) < 5 ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => applyPositionPreset('right')}
                  >
                    Right →
                  </Button>
                </div>
              </FormField>

              {/* Manual Position */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Position X (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(currentPosition.x)}
                    onChange={(e) => {
                      const x = Math.max(0, Math.min(100, Number(e.target.value)));
                      updateSceneCharacter(selectedScene.id, sceneChar.id, {
                        position: { ...currentPosition, x }
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </FormField>
                <FormField label="Position Y (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(currentPosition.y)}
                    onChange={(e) => {
                      const y = Math.max(0, Math.min(100, Number(e.target.value)));
                      updateSceneCharacter(selectedScene.id, sceneChar.id, {
                        position: { ...currentPosition, y }
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </FormField>
              </div>

              {/* Scale/Size */}
              <FormField label={`Scale: ${Math.round(currentScale * 100)}%`}>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={currentScale * 100}
                  onChange={(e) => {
                    updateSceneCharacter(selectedScene.id, sceneChar.id, {
                      scale: Number(e.target.value) / 100
                    });
                  }}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>50%</span>
                  <span>200%</span>
                </div>
              </FormField>

              {/* Mood */}
              <FormField label="Mood (Expression)">
                <select
                  value={currentMood}
                  onChange={(e) => {
                    updateSceneCharacter(selectedScene.id, sceneChar.id, {
                      mood: e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {(character.moods || ['neutral']).map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
              </FormField>

              {/* Z-Index (Layer) */}
              <FormField label={`Layer (Z-Index): ${currentZIndex}`}>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={currentZIndex}
                  onChange={(e) => {
                    updateSceneCharacter(selectedScene.id, sceneChar.id, {
                      zIndex: Number(e.target.value)
                    });
                  }}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Back (1)</span>
                  <span>Front (10)</span>
                </div>
              </FormField>

              {/* Helper Text */}
              <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg text-xs text-blue-300">
                <p className="font-semibold mb-1">💡 Tips:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-200">
                  <li>Use Quick Position for standard layouts</li>
                  <li>Adjust Layer to control overlap (higher = front)</li>
                  <li>Scale affects character size on canvas</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Auto-save indicator */}
        <div className="flex-shrink-0 border-t border-slate-700 p-3">
          <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
        </div>
      </div>
    );
  }

  // Render dialogue properties
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
      <div className="h-full flex flex-col bg-slate-800">
        {/* Header with duplicate button */}
        <div className="flex-shrink-0 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Dialogue Properties</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateDialogue}
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
                onChange={(e) => updateDialogue(selectedScene.id, selectedElement.index, { speaker: e.target.value })}
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
                onChange={(e) => updateDialogue(selectedScene.id, selectedElement.index, { text: e.target.value })}
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
                  <span className="text-slate-300 font-semibold">{selectedElement.index}</span>
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
              onClick={() => {
                const newChoice = {
                  id: `choice-${Date.now()}`,
                  text: 'New choice',
                  nextScene: '',
                  effects: []
                };
                const updatedChoices = [...(dialogue.choices || []), newChoice];
                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              Add Choice
            </Button>

            {dialogue.choices && dialogue.choices.length > 0 ? (
              dialogue.choices.map((choice, choiceIdx) => (
                <div key={choiceIdx} className="p-4 bg-slate-900 border-2 border-slate-700 rounded-lg space-y-3">
                  {/* Choice header */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-blue-400">Choice {choiceIdx + 1}</div>
                    <Button
                      variant="danger-ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete choice ${choiceIdx + 1}?`)) {
                          const updatedChoices = dialogue.choices.filter((_, i) => i !== choiceIdx);
                          updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>

                  {/* Choice text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Choice Text
                    </label>
                    <input
                      type="text"
                      value={choice.text || ''}
                      onChange={(e) => {
                        const updatedChoices = [...dialogue.choices];
                        updatedChoices[choiceIdx] = { ...updatedChoices[choiceIdx], text: e.target.value };
                        updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Accept the mission"
                    />
                  </div>

                  {/* Next scene */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Next Scene ID
                    </label>
                    <input
                      type="text"
                      value={choice.nextScene || ''}
                      onChange={(e) => {
                        const updatedChoices = [...dialogue.choices];
                        updatedChoices[choiceIdx] = { ...updatedChoices[choiceIdx], nextScene: e.target.value };
                        updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., scene-2 (optional)"
                    />
                  </div>

                  {/* Dice roll toggle */}
                  <div className="pt-3 border-t border-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={choice.diceRoll?.enabled || false}
                        onChange={(e) => {
                          const updatedChoices = [...dialogue.choices];
                          if (!updatedChoices[choiceIdx].diceRoll) {
                            updatedChoices[choiceIdx].diceRoll = {
                              enabled: false,
                              difficulty: 12,
                              successOutcome: { message: '', moral: 0, illustration: '' },
                              failureOutcome: { message: '', moral: 0, illustration: '' }
                            };
                          }
                          updatedChoices[choiceIdx].diceRoll.enabled = e.target.checked;
                          updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                        }}
                        className="w-4 h-4 text-purple-600 border-slate-600 rounded focus:ring-2 focus:ring-purple-500 bg-slate-800"
                      />
                      <span className="text-xs font-semibold text-purple-400">
                        🎲 Enable dice roll
                      </span>
                    </label>
                  </div>

                  {/* Dice configuration */}
                  {choice.diceRoll?.enabled && (
                    <div className="p-3 border border-purple-500/30 rounded-lg bg-purple-900/20 space-y-3">
                      {/* Difficulty */}
                      <div>
                        <label className="block text-xs font-semibold text-purple-300 mb-1.5">
                          Difficulty (1-20)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={choice.diceRoll?.difficulty || 12}
                          onChange={(e) => {
                            const updatedChoices = [...dialogue.choices];
                            if (!updatedChoices[choiceIdx].diceRoll) {
                              updatedChoices[choiceIdx].diceRoll = {
                                enabled: true,
                                difficulty: 12,
                                successOutcome: { message: '', moral: 0, illustration: '' },
                                failureOutcome: { message: '', moral: 0, illustration: '' }
                              };
                            }
                            updatedChoices[choiceIdx].diceRoll.difficulty = parseInt(e.target.value) || 12;
                            updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                          }}
                          className="w-full px-3 py-2 bg-slate-800 border border-purple-500/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-purple-400 mt-1">Player must roll this score or higher (d20)</p>
                      </div>

                      {/* Success outcome */}
                      <div className="p-3 border border-green-500/30 rounded-lg bg-green-900/20">
                        <h4 className="text-xs font-bold text-green-300 mb-2">✅ On Success</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-green-400 mb-1">Message</label>
                            <input
                              type="text"
                              value={choice.diceRoll?.successOutcome?.message || ''}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.successOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.successOutcome,
                                  message: e.target.value
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-green-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="e.g., Found a spot!"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-green-400 mb-1">Moral Impact</label>
                            <input
                              type="number"
                              value={choice.diceRoll?.successOutcome?.moral || 0}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.successOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.successOutcome,
                                  moral: parseInt(e.target.value) || 0
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-green-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="5"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-green-400 mb-1">Illustration</label>
                            <input
                              type="text"
                              value={choice.diceRoll?.successOutcome?.illustration || ''}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.successOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.successOutcome,
                                  illustration: e.target.value
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-green-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="parking-success.png"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Failure outcome */}
                      <div className="p-3 border border-red-500/30 rounded-lg bg-red-900/20">
                        <h4 className="text-xs font-bold text-red-300 mb-2">❌ On Failure</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-red-400 mb-1">Message</label>
                            <input
                              type="text"
                              value={choice.diceRoll?.failureOutcome?.message || ''}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.failureOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.failureOutcome,
                                  message: e.target.value
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-red-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                              placeholder="e.g., No spots..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-red-400 mb-1">Moral Impact</label>
                            <input
                              type="number"
                              value={choice.diceRoll?.failureOutcome?.moral || 0}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.failureOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.failureOutcome,
                                  moral: parseInt(e.target.value) || 0
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-red-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                              placeholder="-3"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-red-400 mb-1">Illustration</label>
                            <input
                              type="text"
                              value={choice.diceRoll?.failureOutcome?.illustration || ''}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.failureOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.failureOutcome,
                                  illustration: e.target.value
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-red-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                              placeholder="parking-fail.png"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Effects (legacy support - read-only for now) */}
                  {choice.effects && choice.effects.length > 0 && (
                    <div className="pt-3 border-t border-slate-700">
                      <div className="text-xs font-semibold text-amber-400 mb-2">Effects (legacy):</div>
                      {choice.effects.map((effect, eIdx) => (
                        <div key={eIdx} className="text-xs text-amber-500 ml-2">
                          {effect.variable}: {effect.operation} {effect.value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
    index: PropTypes.number
  }),
  selectedScene: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    backgroundUrl: PropTypes.string,
    dialogues: PropTypes.array
  }),
  characters: PropTypes.array.isRequired,
  onOpenModal: PropTypes.func
};

export default PropertiesPanel;
