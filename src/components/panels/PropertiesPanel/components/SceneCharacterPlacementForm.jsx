import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { AutoSaveIndicator } from '../../../ui/AutoSaveIndicator.tsx';
import { CollapsibleSection, FormField } from '../../../ui/CollapsibleSection.tsx';
import { POSITION_PRESETS } from '@/utils/canvasPositioning';

/**
 * SceneCharacterPlacementForm - Edit character placement in a scene
 *
 * Displays and allows editing of:
 * - Character info (readonly)
 * - Position (quick presets + manual X/Y)
 * - Scale (size slider)
 * - Mood (expression dropdown)
 * - Z-Index (layer slider)
 *
 * @param {Object} props
 * @param {Object} props.sceneCharacter - Scene character placement object
 * @param {Object} props.character - Character definition
 * @param {Object} props.scene - Scene object
 * @param {Function} props.onUpdate - Callback to update scene character (sceneId, sceneCharId, updates)
 * @param {number} props.lastSaved - Last saved timestamp
 * @param {boolean} props.isSaving - Whether currently saving
 */
export function SceneCharacterPlacementForm({
  sceneCharacter,
  character,
  scene,
  onUpdate,
  lastSaved,
  isSaving
}) {
  const currentPosition = sceneCharacter.position || { x: 50, y: 50 };
  const currentScale = sceneCharacter.scale || 1.0;
  const currentMood = sceneCharacter.mood || 'neutral';
  const currentZIndex = sceneCharacter.zIndex || 1;

  const handleUpdate = (updates) => {
    onUpdate(scene.id, sceneCharacter.id, updates);
  };

  // Position presets
  const applyPositionPreset = (preset) => {
    handleUpdate({ position: POSITION_PRESETS[preset] });
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
                    handleUpdate({
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
                    handleUpdate({
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
                  handleUpdate({
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
                  handleUpdate({
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
                  handleUpdate({
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

SceneCharacterPlacementForm.propTypes = {
  sceneCharacter: PropTypes.shape({
    id: PropTypes.string.isRequired,
    characterId: PropTypes.string.isRequired,
    position: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    }),
    scale: PropTypes.number,
    mood: PropTypes.string,
    zIndex: PropTypes.number
  }).isRequired,
  character: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    moods: PropTypes.array
  }).isRequired,
  scene: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  lastSaved: PropTypes.number,
  isSaving: PropTypes.bool
};
