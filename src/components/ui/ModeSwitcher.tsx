import { useUIStore } from '@/stores';
import { useTranslation } from '@/i18n';

/**
 * ModeSwitcher — Bascule entre mode Élève (kid) et mode Avancé (pro).
 * Placé dans la TopBar, côté droit, avant Undo/Redo.
 *
 * Le mode est global (persist localStorage 'accesscity-editor-mode').
 */
export function ModeSwitcher() {
  const editorMode    = useUIStore(s => s.editorMode);
  const setEditorMode = useUIStore(s => s.setEditorMode);
  const { kidMode: km } = useTranslation();

  return (
    <div
      className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5"
      role="group"
      aria-label="Mode de l'éditeur"
    >
      <button
        onClick={() => setEditorMode('kid')}
        aria-pressed={editorMode === 'kid'}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          editorMode === 'kid'
            ? 'bg-[var(--color-primary)] text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Mode Élève — interface simplifiée"
      >
        🎒 {km.kidLabel}
      </button>
      <button
        onClick={() => setEditorMode('pro')}
        aria-pressed={editorMode === 'pro'}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          editorMode === 'pro'
            ? 'bg-[var(--color-primary)] text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Mode Avancé — toutes les fonctionnalités"
      >
        ⚙ {km.proLabel}
      </button>
    </div>
  );
}

export default ModeSwitcher;
