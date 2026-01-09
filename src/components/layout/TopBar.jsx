import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Image, Settings, Download, Play } from 'lucide-react';
import { AutoSaveTimestamp } from '../ui/AutoSaveTimestamp.tsx';

/**
 * TopBar - Application header with navigation and status
 *
 * Features:
 * - role="banner" for ARIA landmark
 * - Back button with tooltip
 * - Toolbar with Button Groups (Content Management | Project Actions)
 * - Undo/Redo buttons
 * - Validation badge (errors/warnings)
 * - Auto-save indicator
 */
export default function TopBar({
  onBack,
  onOpenModal,
  undo,
  redo,
  canUndo,
  canRedo,
  validation,
  showProblemsPanel,
  onToggleProblemsPanel,
  isSaving,
  lastSaved
}) {
  return (
    <header
      className="bg-slate-800 border-b border-slate-700 shadow-lg flex-shrink-0"
      role="banner"
      aria-label="Application header"
    >
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Back Button + Title */}
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                title="Retour à l'accueil"
                aria-label="Retour à l'accueil"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour
              </button>
            )}
            <div>
              <div className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                AccessCity Studio
              </div>
              <h1 className="text-xl font-bold text-white mt-0.5">
                Éditeur
              </h1>
            </div>
          </div>

          {/* Center: Toolbar with Button Groups */}
          <nav className="flex items-center gap-3" aria-label="Actions principales">
            {/* Group 1: Content Management */}
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/30 rounded-lg border border-slate-600/50" role="group" aria-label="Gestion du contenu">
              <Button
                variant="toolbar"
                size="sm"
                onClick={() => onOpenModal('characters')}
                title="Gérer les personnages | Raccourci: Ctrl+Shift+C"
                aria-label="Gérer les personnages (Ctrl+Shift+C)"
              >
                <Users className="h-4 w-4" />
                Personnages
              </Button>
              <Button
                variant="toolbar"
                size="sm"
                onClick={() => onOpenModal('assets')}
                title="Bibliothèque de ressources | Raccourci: Ctrl+Shift+A"
                aria-label="Bibliothèque de ressources (Ctrl+Shift+A)"
              >
                <Image className="h-4 w-4" />
                Ressources
              </Button>
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-slate-600" aria-hidden="true" />

            {/* Group 2: Project Actions */}
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/30 rounded-lg border border-slate-600/50" role="group" aria-label="Actions du projet">
              <Button
                variant="toolbar"
                size="sm"
                onClick={() => onOpenModal('project')}
                title="Paramètres du projet"
                aria-label="Paramètres du projet"
              >
                <Settings className="h-4 w-4" />
                Réglages
              </Button>
              <Button
                variant="toolbar"
                size="sm"
                onClick={() => onOpenModal('export')}
                title="Exporter le projet"
                aria-label="Exporter le projet"
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button
                variant="gaming-accent"
                size="sm"
                onClick={() => onOpenModal('preview')}
                title="Prévisualiser le jeu | Raccourci: Ctrl+R"
                aria-label="Prévisualiser le jeu (Ctrl+R)"
                className="shadow-md"
              >
                <Play className="h-4 w-4" />
                Aperçu
              </Button>
            </div>
          </nav>

          {/* Right: Undo/Redo + Validation + Save indicator */}
          <div className="flex items-center gap-3">
            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1 border-r border-slate-600 pr-3" role="group" aria-label="Historique">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                  canUndo
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Undo | Shortcut: Ctrl+Z"
                aria-label="Annuler (Ctrl+Z)"
                aria-disabled={!canUndo}
              >
                ↶
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                  canRedo
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Redo | Shortcut: Ctrl+Y"
                aria-label="Refaire (Ctrl+Y)"
                aria-disabled={!canRedo}
              >
                ↷
              </button>
            </div>

            {/* Validation badge (clickable) */}
            {validation?.hasIssues && (
              <button
                onClick={onToggleProblemsPanel}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-md ${
                  validation.totalErrors > 0
                    ? 'bg-red-900/30 border-red-600 text-red-300 hover:bg-red-900/50'
                    : 'bg-amber-900/30 border-amber-600 text-amber-300 hover:bg-amber-900/50'
                }`}
                title="Cliquer pour voir les détails"
                aria-label={`${validation.totalErrors} erreurs, ${validation.totalWarnings} avertissements`}
                aria-expanded={showProblemsPanel}
              >
                <span className="font-bold text-xs" aria-hidden="true">
                  {validation.totalErrors > 0 ? '!' : '⚠'}
                </span>
                <div className="text-xs font-semibold">
                  {validation.totalErrors > 0 && <div>{validation.totalErrors}</div>}
                  {validation.totalWarnings > 0 && <div>{validation.totalWarnings}</div>}
                </div>
              </button>
            )}

            {/* Auto-save indicator */}
            <div className="text-right">
              {isSaving ? (
                <div
                  className="flex items-center gap-2 text-amber-400 text-xs font-medium"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sauvegarde en cours...</span>
                </div>
              ) : lastSaved ? (
                <div
                  className="flex items-center gap-2 text-green-400 text-xs font-medium"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Sauvegardé <AutoSaveTimestamp /></span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 text-slate-500 text-xs font-medium"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  <span>Non sauvegardé</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
