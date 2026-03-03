
import { Users, Image, Settings, Download, Play, Network, Undo2, Redo2, AlertTriangle, Check, Loader2, ChevronLeft } from "lucide-react"
import { AutoSaveTimestamp } from "../ui/AutoSaveTimestamp"
import { useUIStore } from "@/stores"
import { useTranslation } from "@/i18n"
import { ModeSwitcher } from "@/components/ui/ModeSwitcher"

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
 * TopBar — Design premium "Midnight Bloom" (50px, studio.css classes)
 *
 * Structure : Brand | Nav center | Undo+Mode+Validation+Save+Preview right
 * Toutes les fonctionnalités existantes sont conservées, seul le rendu change.
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
  const showProblemsPanel  = useUIStore(s => s.showProblemsPanel);
  const setShowProblemsPanel = useUIStore(s => s.setShowProblemsPanel);
  const editorMode = useUIStore(s => s.editorMode);
  const { kidMode: km } = useTranslation();

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

  return (
    <header
      className="topbar"
      role="banner"
      aria-label="Application header"
    >
      {/* ── GAUCHE : Brand + Retour ── */}
      <div className="topbar-brand">
        {onBack && (
          <button
            className="topbar-back"
            onClick={onBack}
            title="Retour à l'accueil"
            aria-label="Retour à l'accueil"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            Retour
          </button>
        )}
        <div className="topbar-sep" aria-hidden="true" />
        <span className="topbar-title" aria-label="AccessCity Studio">
          AccessCity Studio
        </span>
      </div>

      {/* ── CENTRE : Navigation ── */}
      <nav className="topbar-center" aria-label="Actions principales">
        {/* Personnages */}
        <button
          className="topbar-nav"
          onClick={handleOpenCharacters}
          title="Gérer les personnages (Ctrl+Shift+C)"
          aria-label="Gérer les personnages"
        >
          <Users size={14} aria-hidden="true" />
          Personnages
        </button>

        {/* Ressources */}
        <button
          className="topbar-nav"
          onClick={handleOpenAssets}
          title="Bibliothèque de ressources (Ctrl+Shift+A)"
          aria-label="Bibliothèque de ressources"
        >
          <Image size={14} aria-hidden="true" />
          {editorMode === 'kid' ? km.resources : 'Ressources'}
        </button>

        {/* Vue Graphe — mode pro uniquement */}
        {editorMode === 'pro' && (
          <>
            <div className="topbar-divider" aria-hidden="true" />
            <button
              className="topbar-nav"
              onClick={handleOpenGraph}
              title="Vue Graphe — éditeur nodal (Ctrl+Shift+G)"
              aria-label="Vue Graphe"
            >
              <Network size={14} aria-hidden="true" />
              Graphe
            </button>
          </>
        )}

        {/* Réglages + Export — mode pro uniquement */}
        {editorMode === 'pro' && (
          <>
            <div className="topbar-divider" aria-hidden="true" />
            <button
              className="topbar-nav"
              onClick={handleOpenProject}
              title="Paramètres du projet"
              aria-label="Paramètres du projet"
            >
              <Settings size={14} aria-hidden="true" />
              Réglages
            </button>
            <button
              className="topbar-nav"
              onClick={handleOpenExport}
              title="Exporter le projet"
              aria-label="Exporter le projet"
            >
              <Download size={14} aria-hidden="true" />
              Exporter
            </button>
          </>
        )}
      </nav>

      {/* ── DROITE : ModeSwitcher + Undo/Redo + Validation + Save + Preview ── */}
      <div className="topbar-right">
        {/* Mode Élève / Avancé */}
        <ModeSwitcher />

        <div className="topbar-sep" aria-hidden="true" />

        {/* Undo / Redo */}
        <div role="group" aria-label="Historique" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            className="topbar-icon"
            onClick={undo}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
            aria-label="Annuler"
            aria-disabled={!canUndo}
          >
            <Undo2 size={15} aria-hidden="true" />
          </button>
          <button
            className="topbar-icon"
            onClick={redo}
            disabled={!canRedo}
            title="Refaire (Ctrl+Y)"
            aria-label="Refaire"
            aria-disabled={!canRedo}
          >
            <Redo2 size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Validation badge — visible si problèmes */}
        {validation?.hasIssues && (
          <button
            className="topbar-warn"
            onClick={() => setShowProblemsPanel(!showProblemsPanel)}
            title="Cliquer pour voir les détails"
            aria-label={`${validation.totalErrors} erreurs, ${validation.totalWarnings} avertissements`}
            aria-expanded={showProblemsPanel}
          >
            <AlertTriangle size={13} aria-hidden="true" />
            {validation.totalErrors > 0 && <span>{validation.totalErrors}e</span>}
            {validation.totalWarnings > 0 && <span>{validation.totalWarnings}w</span>}
          </button>
        )}

        {/* Indicateur sauvegarde */}
        <div
          className="topbar-unsaved"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {isSaving ? (
            <>
              <Loader2 size={12} className="topbar-dot" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
              <span>Sauvegarde…</span>
            </>
          ) : lastSaved ? (
            <>
              <Check size={12} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
              <span>Sauvegardé <AutoSaveTimestamp /></span>
            </>
          ) : (
            <span>Non sauvegardé</span>
          )}
        </div>

        {/* Bouton Preview — toujours visible */}
        <button
          className="btn-preview"
          onClick={handleOpenPreview}
          title={`${editorMode === 'kid' ? km.preview : 'Aperçu'} (Ctrl+R)`}
          aria-label={editorMode === 'kid' ? km.preview : 'Prévisualiser le jeu'}
        >
          <Play size={14} aria-hidden="true" />
          {editorMode === 'kid' ? km.preview : 'Aperçu'}
        </button>
      </div>
    </header>
  )
}
