import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { AutoSaveIndicator } from '../../../ui/AutoSaveIndicator.jsx';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

/**
 * ScenePropertiesForm - Edit scene properties
 *
 * Displays and allows editing of:
 * - Title
 * - Description
 * - Background image (with preview and picker)
 * - Statistics (dialogue count, scene ID)
 *
 * @param {Object} props
 * @param {Object} props.scene - Scene object to edit
 * @param {Function} props.onUpdate - Callback to update scene (sceneId, updates)
 * @param {Function} props.onOpenModal - Callback to open assets library modal
 * @param {number} props.lastSaved - Last saved timestamp
 * @param {boolean} props.isSaving - Whether currently saving
 */
export function ScenePropertiesForm({
  scene,
  onUpdate,
  onOpenModal,
  lastSaved,
  isSaving
}) {
  const handleUpdate = (updates) => {
    onUpdate(scene.id, updates);
  };

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
            value={scene.title || ''}
            onChange={(e) => handleUpdate({ title: e.target.value })}
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
            value={scene.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
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
          {scene.backgroundUrl ? (
            <div className="relative group rounded-lg overflow-hidden border border-slate-700 mb-3">
              <img
                src={scene.backgroundUrl}
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
                      onOpenModal('assets', { category: 'backgrounds', targetSceneId: scene.id });
                    }
                  }}
                >
                  <Upload className="h-3 w-3" />
                  Changer
                </Button>
                <Button
                  variant="danger-ghost"
                  size="sm"
                  onClick={() => handleUpdate({ backgroundUrl: '' })}
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
                  onOpenModal('assets', { category: 'backgrounds', targetSceneId: scene.id });
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
                value={scene.backgroundUrl || ''}
                onChange={(e) => handleUpdate({ backgroundUrl: e.target.value })}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="assets/backgrounds/scene.jpg"
              />
              {scene.backgroundUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdate({ backgroundUrl: '' })}
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
              <span className="text-slate-300 font-semibold">{scene.dialogues?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Scene ID:</span>
              <span className="text-slate-300 font-mono text-[10px]">{scene.id}</span>
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

ScenePropertiesForm.propTypes = {
  scene: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    backgroundUrl: PropTypes.string,
    dialogues: PropTypes.array
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onOpenModal: PropTypes.func,
  lastSaved: PropTypes.number,
  isSaving: PropTypes.bool
};
