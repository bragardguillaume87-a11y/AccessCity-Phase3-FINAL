
import { Users, Image, Settings, Download, Play, Network, Undo2, Redo2, AlertTriangle, Check, Loader2, ChevronLeft, Sparkles } from "lucide-react"
import { AutoSaveTimestamp } from "../ui/AutoSaveTimestamp"
import { useUIStore } from "@/stores"
import { useTranslation } from "@/i18n"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

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
 * TopBar — Access Studio
 *
 * Structure :
 *   GAUCHE  : ← Retour | ✦ Access Studio | ↩ ↪
 *   CENTRE  : Réglages (pro) | Personnages | Ressources | Graphe (pro) | ▶ Aperçu
 *   DROITE  : [Mode Élève toggle] | validation | save | Exporter (pro)
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
  const showProblemsPanel   = useUIStore(s => s.showProblemsPanel);
  const setShowProblemsPanel = useUIStore(s => s.setShowProblemsPanel);
  const editorMode  = useUIStore(s => s.editorMode);
  const setEditorMode = useUIStore(s => s.setEditorMode);
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
      {/* ── GAUCHE : Logo + Undo/Redo ── */}
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
        <span className="topbar-title" aria-label="Access Studio">
          <Sparkles size={15} className="topbar-title-icon" aria-hidden="true" />
          <span className="topbar-title-accent">Access</span>
          <span>Studio</span>
        </span>
        <div className="topbar-sep" aria-hidden="true" />
        {/* Undo / Redo — proches du titre */}
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
      </div>

      {/* ── CENTRE : Navigation ── */}
      <nav className="topbar-center" aria-label="Actions principales">

        {/* Réglages — pro only, en premier */}
        {editorMode === 'pro' && (
          <>
            <button
              className="topbar-nav"
              onClick={handleOpenProject}
              title="Paramètres du projet"
              aria-label="Paramètres du projet"
            >
              <Settings size={14} aria-hidden="true" />
              Réglages
            </button>
            <div className="topbar-divider" aria-hidden="true" />
          </>
        )}

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

        {/* Graphe — pro only */}
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

        {/* Aperçu — toujours visible */}
        <div className="topbar-divider" aria-hidden="true" />
        <button
          className="btn-preview"
          onClick={handleOpenPreview}
          title={`${editorMode === 'kid' ? km.preview : 'Aperçu'} (Ctrl+R)`}
          aria-label={editorMode === 'kid' ? km.preview : 'Prévisualiser le jeu'}
        >
          <Play size={14} aria-hidden="true" />
          {editorMode === 'kid' ? km.preview : 'Aperçu'}
        </button>

      </nav>

      {/* ── DROITE : Toggle Mode + Validation + Save + Export ── */}
      <div className="topbar-right">

        {/* Toggle Mode Élève — label + piste avec curseur glissant */}
        <button
          className={`topbar-mode-toggle${editorMode === 'kid' ? ' active' : ''}`}
          onClick={() => setEditorMode(editorMode === 'kid' ? 'pro' : 'kid')}
          aria-pressed={editorMode === 'kid'}
          title={editorMode === 'kid' ? 'Passer en Mode Avancé' : 'Passer en Mode Élève'}
        >
          <span className="topbar-mode-toggle-label">{km.kidLabel}</span>
          <span className="topbar-mode-toggle-track" aria-hidden="true">
            <span className="topbar-mode-toggle-thumb" />
          </span>
        </button>

        {/* Validation badge — visible si problèmes */}
        {validation?.hasIssues && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="topbar-warn"
                onClick={() => setShowProblemsPanel(!showProblemsPanel)}
                aria-label={`${validation.totalErrors} erreur${validation.totalErrors > 1 ? 's' : ''}, ${validation.totalWarnings} avertissement${validation.totalWarnings > 1 ? 's' : ''} — cliquer pour voir les détails`}
                aria-expanded={showProblemsPanel}
              >
                <AlertTriangle size={13} aria-hidden="true" />
                {validation.totalErrors > 0 && (
                  <span>{validation.totalErrors} err.</span>
                )}
                {validation.totalWarnings > 0 && (
                  <span>{validation.totalWarnings} avert.</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p style={{ fontWeight: 600 }}>
                {validation.totalErrors} erreur{validation.totalErrors > 1 ? 's' : ''} · {validation.totalWarnings} avertissement{validation.totalWarnings > 1 ? 's' : ''}
              </p>
              <p style={{ opacity: 0.7, marginTop: 2 }}>Cliquer pour voir les détails</p>
            </TooltipContent>
          </Tooltip>
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

        {/* Exporter — far right, mode pro uniquement */}
        {editorMode === 'pro' && (
          <button
            className="btn-export"
            onClick={handleOpenExport}
            title="Exporter le projet"
            aria-label="Exporter le projet"
          >
            <Download size={14} aria-hidden="true" />
            Exporter
          </button>
        )}
      </div>
    </header>
  )
}
