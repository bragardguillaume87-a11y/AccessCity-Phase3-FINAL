import * as React from 'react';
import type { Scene, ModalType } from '@/types';
import { Button } from '@/components/ui/button';
import { AutoSaveIndicator } from '../../../ui/AutoSaveIndicator';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export interface ScenePropertiesFormProps {
  scene: Scene;
  onUpdate: (sceneId: string, updates: Partial<Scene>) => void;
  onOpenModal?: (modalType: ModalType, config?: { category?: string; targetSceneId?: string }) => void;
  lastSaved?: number;
  isSaving?: boolean;
}

/**
 * ScenePropertiesForm - Edit scene properties
 *
 * Displays and allows editing of:
 * - Title
 * - Description
 * - Background image (with preview and picker)
 * - Statistics (dialogue count, scene ID)
 */
export function ScenePropertiesForm({
  scene,
  onUpdate,
  onOpenModal,
  lastSaved,
  isSaving
}: ScenePropertiesFormProps) {
  const handleUpdate = (updates: Partial<Scene>) => {
    onUpdate(scene.id, updates);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex-shrink-0 border-b border-border px-4 py-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Scene Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="scene-title" className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Title
          </label>
          <input
            id="scene-title"
            type="text"
            value={scene.title || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate({ title: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter scene title"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="scene-description" className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Description
          </label>
          <textarea
            id="scene-description"
            value={scene.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdate({ description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe the scene"
          />
        </div>

        {/* Background Image */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            Arrière-plan
          </label>

          {/* Preview or Empty State */}
          {scene.backgroundUrl ? (
            <div className="relative group rounded-lg overflow-hidden border border-border mb-3">
              <img
                src={scene.backgroundUrl}
                alt="Background preview"
                className="w-full h-40 object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23334155" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2364748b" font-family="sans-serif" font-size="14"%3EImage non disponible%3C/text%3E%3C/svg%3E';
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
              className="w-full h-40 border-2 border-dashed border-border hover:border-blue-500 hover:bg-background/50 flex flex-col gap-2 text-muted-foreground hover:text-blue-400"
            >
              <ImageIcon className="w-12 h-12" />
              <span className="text-sm font-medium">Parcourir la bibliothèque</span>
              <span className="text-xs text-muted-foreground">Ou coller une URL ci-dessous</span>
            </Button>
          )}

          {/* Advanced: Manual URL Input */}
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground hover:text-muted-foreground cursor-pointer select-none">
              Avancé : Saisir URL manuellement
            </summary>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={scene.backgroundUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate({ backgroundUrl: e.target.value })}
                className="flex-1 px-3 py-1.5 bg-background border border-border rounded text-xs text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Statistics</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Dialogues:</span>
              <span className="text-foreground font-semibold">{scene.dialogues?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Scene ID:</span>
              <span className="text-foreground font-mono text-[10px]">{scene.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      <div className="flex-shrink-0 border-t border-border p-3">
        <AutoSaveIndicator lastSaved={lastSaved ? new Date(lastSaved) : null} isSaving={isSaving} />
      </div>
    </div>
  );
}
