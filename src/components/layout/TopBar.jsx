import React from 'react';

/**
 * TopBar - Application header with navigation and status
 *
 * Features:
 * - role="banner" for ARIA landmark
 * - Back button with tooltip
 * - Toolbar with Settings, Characters, Assets, Export, Preview
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
  lastSaved,
  getTimeSinceLastSave
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
                Editor
              </h1>
            </div>
          </div>

          {/* Center: Toolbar */}
          <nav className="flex items-center gap-2" aria-label="Actions principales">
            <button
              onClick={() => onOpenModal('project')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              title="Project Settings"
              aria-label="Paramètres du projet"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={() => onOpenModal('characters')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              title="Manage Characters | Shortcut: Ctrl+Shift+C"
              aria-label="Gérer les personnages (Ctrl+Shift+C)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Personnages
            </button>
            <button
              onClick={() => onOpenModal('assets')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              title="Asset Library | Shortcut: Ctrl+Shift+A"
              aria-label="Bibliothèque d'assets (Ctrl+Shift+A)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Assets
            </button>
            <button
              onClick={() => onOpenModal('export')}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              title="Export Project"
              aria-label="Exporter le projet"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button
              onClick={() => onOpenModal('preview')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              title="Preview Game | Shortcut: Ctrl+R"
              aria-label="Prévisualiser le jeu (Ctrl+R)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Preview
            </button>
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
                  <span>Saving...</span>
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
                  <span>Saved {getTimeSinceLastSave?.()}</span>
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
                  <span>Not saved yet</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
