
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Users, Image, Settings, Download, Play, Network, Film } from "lucide-react"
import { AutoSaveTimestamp } from "../ui/AutoSaveTimestamp"
import { useUIStore } from "@/stores"
import { useTranslation } from "@/i18n"
import { ModeSwitcher } from "@/components/ui/ModeSwitcher"
import { toggleTheatreStudio } from "@/lib/theatre"

export interface TopBarValidation {
  hasIssues: boolean
  totalErrors: number
  totalWarnings: number
}

export interface TopBarProps {
  onBack?: (() => void) | null
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  validation?: TopBarValidation
  isSaving: boolean
  lastSaved: string | null
}

/**
 * TopBar - Application header with navigation and status.
 * En mode 'kid' : boutons avancés masqués, labels simplifiés, ModeSwitcher visible.
 * Modal open + problems panel toggle lus depuis uiStore.
 */
export default function TopBar({
  onBack,
  undo,
  redo,
  canUndo,
  canRedo,
  validation,
  isSaving,
  lastSaved
}: TopBarProps) {
  const showProblemsPanel = useUIStore(s => s.showProblemsPanel);
  const setShowProblemsPanel = useUIStore(s => s.setShowProblemsPanel);
  const editorMode = useUIStore(s => s.editorMode);
  const { kidMode: km } = useTranslation();

  const [studioVisible, setStudioVisible] = useState(false);

  const handleOpenCharacters = () => useUIStore.getState().setActiveModal('characters');
  const handleOpenAssets     = () => useUIStore.getState().setActiveModal('assets');
  const handleOpenProject    = () => useUIStore.getState().setActiveModal('project');
  const handleOpenExport     = () => useUIStore.getState().setActiveModal('export');
  const handleOpenPreview    = () => useUIStore.getState().setActiveModal('preview');
  const handleOpenGraph      = () => {
    const store = useUIStore.getState();
    if (store.selectedSceneForEdit) {
      store.setDialogueGraphSelectedScene(store.selectedSceneForEdit);
      store.setDialogueGraphModalOpen(true);
    }
  };
  const handleToggleStudio = useCallback(() => {
    const next = !studioVisible;
    setStudioVisible(next);
    void toggleTheatreStudio(next); // async lazy init — fire-and-forget
  }, [studioVisible]);

  return (
    <header
      className="sticky top-0 z-fixed-v2 bg-card border-b border-border shadow-lg flex-shrink-0"
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
                className="px-3 py-2 bg-muted hover:bg-muted text-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
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
              <div className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
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
            <div className="flex items-center gap-1 px-2 py-1 bg-muted/30 rounded-lg border border-border/50" role="group" aria-label="Gestion du contenu">
              <Button
                variant="toolbar"
                size="sm"
                onClick={handleOpenCharacters}
                title="Gérer les personnages | Raccourci: Ctrl+Shift+C"
                aria-label="Gérer les personnages (Ctrl+Shift+C)"
              >
                <Users className="h-4 w-4" />
                Personnages
              </Button>
              <Button
                variant="toolbar"
                size="sm"
                onClick={handleOpenAssets}
                title="Bibliothèque de ressources | Raccourci: Ctrl+Shift+A"
                aria-label="Bibliothèque de ressources (Ctrl+Shift+A)"
              >
                <Image className="h-4 w-4" />
                {editorMode === 'kid' ? km.resources : 'Ressources'}
              </Button>
              {editorMode === 'pro' && (
                <Button
                  variant="gaming-accent"
                  size="sm"
                  onClick={handleOpenGraph}
                  title="Vue Graphe - Éditeur nodal des dialogues | Raccourci: Ctrl+Shift+G"
                  aria-label="Vue Graphe - Éditeur nodal (Ctrl+Shift+G)"
                  className="shadow-md"
                >
                  <Network className="h-4 w-4" />
                  Vue Graphe
                </Button>
              )}
              {import.meta.env.DEV && editorMode === 'pro' && (
                <Button
                  variant={studioVisible ? "gaming-accent" : "toolbar"}
                  size="sm"
                  onClick={handleToggleStudio}
                  title="Theatre Studio — Éditeur de timeline d'animations (dev uniquement)"
                  aria-label="Afficher/masquer Theatre Studio"
                  aria-pressed={studioVisible}
                >
                  <Film className="h-4 w-4" />
                  Timeline
                </Button>
              )}
            </div>

            {/* Separator — masqué en mode kid (Group 2 réduit à 1 bouton plat) */}
            {editorMode === 'pro' && (
              <div className="h-8 w-px bg-muted" aria-hidden="true" />
            )}

            {/* Group 2: Project Actions
                Mode pro : container groupé (Réglages + Exporter + Aperçu)
                Mode kid : bouton seul sans container pour éviter la double bordure */}
            {editorMode === 'pro' ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-muted/30 rounded-lg border border-border/50" role="group" aria-label="Actions du projet">
                <Button
                  variant="toolbar"
                  size="sm"
                  onClick={handleOpenProject}
                  title="Paramètres du projet"
                  aria-label="Paramètres du projet"
                >
                  <Settings className="h-4 w-4" />
                  Réglages
                </Button>
                <Button
                  variant="toolbar"
                  size="sm"
                  onClick={handleOpenExport}
                  title="Exporter le projet"
                  aria-label="Exporter le projet"
                >
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
                <Button
                  variant="gaming-accent"
                  size="sm"
                  onClick={handleOpenPreview}
                  title="Prévisualiser le jeu | Raccourci: Ctrl+R"
                  aria-label="Prévisualiser le jeu (Ctrl+R)"
                  className="shadow-md"
                >
                  <Play className="h-4 w-4" />
                  Aperçu
                </Button>
              </div>
            ) : (
              <Button
                variant="gaming-accent"
                size="sm"
                onClick={handleOpenPreview}
                title={`${km.preview} | Raccourci: Ctrl+R`}
                aria-label={`${km.preview} (Ctrl+R)`}
                className="shadow-md"
              >
                <Play className="h-4 w-4" />
                {km.preview}
              </Button>
            )}
          </nav>

          {/* Right: ModeSwitcher + Undo/Redo + Validation + Save indicator */}
          <div className="flex items-center gap-3">
            {/* ModeSwitcher — bascule Mode Élève / Mode Avancé */}
            <ModeSwitcher />
            <div className="h-8 w-px bg-muted" aria-hidden="true" />
            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1 border-r border-border pr-3" role="group" aria-label="Historique">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                  canUndo
                    ? "bg-muted hover:bg-muted text-foreground"
                    : "bg-card text-muted-foreground cursor-not-allowed"
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
                    ? "bg-muted hover:bg-muted text-foreground"
                    : "bg-card text-muted-foreground cursor-not-allowed"
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
                onClick={() => setShowProblemsPanel(!showProblemsPanel)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-md ${
                  validation.totalErrors > 0
                    ? "bg-red-900/30 border-red-600 text-red-300 hover:bg-red-900/50"
                    : "bg-amber-900/30 border-amber-600 text-amber-300 hover:bg-amber-900/50"
                }`}
                title="Cliquer pour voir les détails"
                aria-label={`${validation.totalErrors} erreurs, ${validation.totalWarnings} avertissements`}
                aria-expanded={showProblemsPanel}
              >
                <span className="font-bold text-xs" aria-hidden="true">
                  {validation.totalErrors > 0 ? "!" : "⚠"}
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
                  className="flex items-center gap-2 text-muted-foreground text-xs font-medium"
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
  )
}
