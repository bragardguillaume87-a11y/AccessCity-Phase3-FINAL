// src/components/ExportPanel.tsx
import React from 'react';
import { useScenesStore, useCharactersStore, useSettingsStore } from '../stores/index';
import { toast } from 'sonner';
import { logger } from '../utils/logger';
import type { Scene, Character } from '@/types';

/**
 * Core system data structure for export
 */
interface CoreSystemData {
  title: string;
  location: string;
  tone: string;
  description: string;
}

/**
 * ExportPanel component props
 */
export interface ExportPanelProps {
  /** Callback when navigating to previous step */
  onPrev?: () => void;
}

/**
 * Downloads JSON data as a file
 */
function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * ExportPanel - Export project data to JSON files
 *
 * Features:
 * - Export scenes, characters, and core system data
 * - Download as formatted JSON files
 * - Toast notifications for success/error
 */
export default function ExportPanel({ onPrev }: ExportPanelProps): React.JSX.Element {
  const scenes = useScenesStore(state => state.scenes);
  const characters = useCharactersStore(state => state.characters);
  const context = useSettingsStore(state => state.projectData);

  function handleExport(type: string, data: Scene[] | Character[] | CoreSystemData, filename: string): void {
    try {
      downloadJson(filename, data);
      toast.success(`Fichier ${filename} exporte avec succes`);
    } catch (error) {
      toast.error(`Echec de l export de ${filename}`);
      logger.error('Export error:', error);
    }
  }

  function exportCore(): void {
    const core: CoreSystemData = {
      title: context.title || '',
      location: context.location || '',
      tone: context.tone || '',
      description: context.description || ''
    };
    handleExport('core', core, 'core_system.json');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          📦 Etape 7 : Export
        </h2>
        <p className="text-slate-600">
          Exportez votre projet au format JSON
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h3 className="text-xl font-bold text-slate-900">Fichiers disponibles</h3>
        <p className="text-sm text-slate-600">Exportez vos donnees en fichiers JSON.</p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleExport('scenes', scenes, 'scenes.json')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          aria-label="Exporter les scenes"
        >
          scenes.json
        </button>
        <button
          onClick={() => handleExport('characters', characters, 'characters.json')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          aria-label="Exporter les personnages"
        >
          characters.json
        </button>
        <button
          onClick={exportCore}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          aria-label="Exporter le contexte"
        >
          core_system.json
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Les fichiers sont generes a partir de l etat courant du contexte.
      </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onPrev && (
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-all"
          >
            ← Precedent
          </button>
        )}
      </div>
    </div>
  );
}
