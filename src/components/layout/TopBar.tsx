import { useState, useEffect, useRef } from 'react';
import {
  Users,
  Image,
  Settings,
  Download,
  Play,
  Network,
  Undo2,
  Redo2,
  AlertTriangle,
  Check,
  Loader2,
  ChevronLeft,
  Sparkles,
  ChevronDown,
  Monitor,
} from 'lucide-react';
import { AutoSaveTimestamp } from '../ui/AutoSaveTimestamp';
import { useUIStore } from '@/stores';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTranslation } from '@/i18n';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DIALOGUE_COMPOSER_THEMES } from '@/config/dialogueComposerThemes';
import type { DialogueComposerTheme } from '@/config/dialogueComposerThemes';

export interface TopBarValidation {
  hasIssues: boolean;
  totalErrors: number;
  totalWarnings: number;
}

export interface TopBarProps {
  onBack?: (() => void) | null;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  validation?: TopBarValidation;
  isSaving: boolean;
  lastSaved: string | null;
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
  lastSaved,
}: TopBarProps) {
  const showProblemsPanel = useUIStore((s) => s.showProblemsPanel);
  const setShowProblemsPanel = useUIStore((s) => s.setShowProblemsPanel);
  const editorMode = useUIStore((s) => s.editorMode);
  const setEditorMode = useUIStore((s) => s.setEditorMode);
  const { kidMode: km } = useTranslation();
  const dialogueComposerTheme = useSettingsStore((s) => s.dialogueComposerTheme);
  const setDialogueComposerTheme = useSettingsStore((s) => s.setDialogueComposerTheme);

  // ── Dropdown thème ────────────────────────────────────────────────────────
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!themeOpen) return;
    const handler = (e: MouseEvent) => {
      if (!themeRef.current?.contains(e.target as Node)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [themeOpen]);

  const handleOpenCharacters = () => useUIStore.getState().setActiveModal('characters');
  const handleOpenAssets = () => useUIStore.getState().setActiveModal('assets');
  const handleOpenProject = () => useUIStore.getState().setActiveModal('project');
  const handleOpenExport = () => useUIStore.getState().setActiveModal('export');
  const handleOpenPreview = () => useUIStore.getState().setActiveModal('preview');
  const handleOpenEffects = () => useUIStore.getState().setActiveModal('visual-filters');
  const handleOpenGraph = () => {
    const store = useUIStore.getState();
    if (store.selectedSceneForEdit) {
      store.setDialogueGraphSelectedScene(store.selectedSceneForEdit);
      store.setDialogueGraphModalOpen(true);
    }
  };

  return (
    <header className="topbar" role="banner" aria-label="Application header">
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
        <div
          role="group"
          aria-label="Historique"
          style={{ display: 'flex', alignItems: 'center', gap: 2 }}
        >
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

        {/* Graphe + Effets — pro only */}
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
            <button
              className="topbar-nav"
              onClick={handleOpenEffects}
              title="Filtres visuels — CRT, scanlines, grain, dithering"
              aria-label="Filtres visuels"
            >
              <Monitor size={14} aria-hidden="true" />
              Effets
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
        {/* ── Sélecteur de thème — dropdown ── */}
        <div ref={themeRef} style={{ position: 'relative' }}>
          {/* Trigger */}
          <button
            type="button"
            title="Changer le thème de l'éditeur"
            aria-haspopup="listbox"
            aria-expanded={themeOpen}
            onClick={() => setThemeOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              height: 28,
              padding: '0 8px',
              borderRadius: 7,
              border: `1.5px solid ${themeOpen ? DIALOGUE_COMPOSER_THEMES[dialogueComposerTheme].dotColor : 'rgba(255,255,255,0.15)'}`,
              background: themeOpen
                ? `${DIALOGUE_COMPOSER_THEMES[dialogueComposerTheme].dotColor}22`
                : 'rgba(255,255,255,0.06)',
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
              fontSize: 12,
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
          >
            {/* Dot couleur active */}
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                flexShrink: 0,
                background: DIALOGUE_COMPOSER_THEMES[dialogueComposerTheme].dotColor,
                boxShadow: `0 0 5px ${DIALOGUE_COMPOSER_THEMES[dialogueComposerTheme].dotColor}`,
              }}
            />
            <span style={{ opacity: 0.85 }}>
              {DIALOGUE_COMPOSER_THEMES[dialogueComposerTheme].emoji}{' '}
              {DIALOGUE_COMPOSER_THEMES[dialogueComposerTheme].label}
            </span>
            <ChevronDown
              size={10}
              style={{
                opacity: 0.55,
                transform: themeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}
              aria-hidden="true"
            />
          </button>

          {/* Dropdown panel */}
          {themeOpen && (
            <div
              role="listbox"
              aria-label="Thème de l'éditeur"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 5px)',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-base)',
                borderRadius: 10,
                padding: 4,
                zIndex: 'var(--z-dropdown)',
                minWidth: 160,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {(Object.keys(DIALOGUE_COMPOSER_THEMES) as DialogueComposerTheme[]).map((themeId) => {
                const def = DIALOGUE_COMPOSER_THEMES[themeId];
                const isActive = dialogueComposerTheme === themeId;
                return (
                  <button
                    key={themeId}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => {
                      setDialogueComposerTheme(themeId);
                      setThemeOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 7,
                      border: 'none',
                      background: isActive ? `${def.dotColor}20` : 'transparent',
                      cursor: 'pointer',
                      color: 'var(--color-text-primary)',
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      textAlign: 'left',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    {/* Dot couleur */}
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: def.dotColor,
                        boxShadow: isActive ? `0 0 6px ${def.dotColor}` : 'none',
                      }}
                    />
                    <span>
                      {def.emoji} {def.label}
                    </span>
                    {/* Badge "Clair" pour les thèmes light */}
                    {def.isLight && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.15)',
                          color: 'var(--color-text-muted)',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                        }}
                      >
                        CLAIR
                      </span>
                    )}
                    {isActive && !def.isLight && (
                      <Check
                        size={10}
                        style={{ marginLeft: 'auto', color: def.dotColor }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
                {validation.totalErrors > 0 && <span>{validation.totalErrors} err.</span>}
                {validation.totalWarnings > 0 && <span>{validation.totalWarnings} avert.</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p style={{ fontWeight: 600 }}>
                {validation.totalErrors} erreur{validation.totalErrors > 1 ? 's' : ''} ·{' '}
                {validation.totalWarnings} avertissement{validation.totalWarnings > 1 ? 's' : ''}
              </p>
              <p style={{ opacity: 0.7, marginTop: 2 }}>Cliquer pour voir les détails</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Indicateur sauvegarde */}
        <div className="topbar-unsaved" role="status" aria-live="polite" aria-atomic="true">
          {isSaving ? (
            <>
              <Loader2
                size={12}
                className="topbar-dot"
                style={{ animation: 'spin 1s linear infinite' }}
                aria-hidden="true"
              />
              <span>Sauvegarde…</span>
            </>
          ) : lastSaved ? (
            <>
              <Check size={12} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
              <span>
                Sauvegardé <AutoSaveTimestamp />
              </span>
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
  );
}
