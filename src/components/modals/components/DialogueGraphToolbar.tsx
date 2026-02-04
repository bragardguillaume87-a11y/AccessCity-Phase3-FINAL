import { Trash2, Copy, Workflow, X, ArrowDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * DialogueGraphToolbar - Barre d'outils flottante pour l'éditeur nodal
 *
 * Position: En haut à droite de la modal, au-dessus du graphe
 *
 * Actions:
 * - Delete: Supprimer le dialogue sélectionné (visible seulement si node sélectionné)
 * - Duplicate: Dupliquer le dialogue sélectionné (visible seulement si node sélectionné)
 * - Auto-layout: Réorganiser le graphe automatiquement (Dagre)
 * - Close: Fermer l'éditeur nodal
 *
 * Accessibilité:
 * - ARIA labels sur tous les boutons
 * - Tooltips indiquant les raccourcis clavier
 * - Séparateurs visuels (dividers) entre les groupes d'actions
 */

export interface DialogueGraphToolbarProps {
  /** ID du node sélectionné (null si aucun) */
  selectedNodeId: string | null;
  /** Callback pour supprimer le node sélectionné */
  onDelete: () => void;
  /** Callback pour dupliquer le node sélectionné */
  onDuplicate: () => void;
  /** Callback pour réorganiser le graphe (auto-layout Dagre) */
  onAutoLayout: () => void;
  /** Callback pour basculer la direction du layout (TB/LR) */
  onToggleLayout: () => void;
  /** Direction actuelle du layout ('TB' = vertical, 'LR' = horizontal) */
  layoutDirection: 'TB' | 'LR';
  /** Callback pour fermer l'éditeur nodal */
  onClose: () => void;
  /** Is the properties panel currently open? Adjusts toolbar position */
  isPanelOpen?: boolean;
}

export function DialogueGraphToolbar({
  selectedNodeId,
  onDelete,
  onDuplicate,
  onAutoLayout,
  onToggleLayout,
  layoutDirection,
  onClose,
  isPanelOpen = false,
}: DialogueGraphToolbarProps) {
  return (
    <div
      className="absolute top-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm border-2 border-border rounded-xl px-3 py-2 z-10 shadow-xl transition-all duration-300"
      style={{
        // When panel is open (30% width), position toolbar to the left of the panel
        right: isPanelOpen ? 'calc(30% + 1rem)' : '1rem',
      }}
      role="toolbar"
      aria-label="Actions de l'éditeur nodal"
    >
      {/* Delete + Duplicate (visible seulement si node sélectionné) */}
      {selectedNodeId && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Supprimer le dialogue (Del)"
            aria-label="Supprimer le dialogue sélectionné"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span className="ml-2 text-xs font-medium">Supprimer</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            title="Dupliquer le dialogue (Ctrl+D)"
            aria-label="Dupliquer le dialogue sélectionné"
            className="hover:bg-accent transition-colors"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            <span className="ml-2 text-xs font-medium">Dupliquer</span>
          </Button>

          {/* Séparateur visuel */}
          <div className="h-6 w-px bg-border" aria-hidden="true" />
        </>
      )}

      {/* Toggle Layout Direction (PHASE 3.5) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleLayout}
        title={`Basculer en mode ${layoutDirection === 'TB' ? 'horizontal (LR)' : 'vertical (TB)'}`}
        aria-label="Basculer l'orientation du graphe (vertical/horizontal)"
        className="hover:bg-accent transition-colors"
      >
        {layoutDirection === 'TB' ? (
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        ) : (
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="ml-2 text-xs font-medium">
          {layoutDirection === 'TB' ? 'Horizontal' : 'Vertical'}
        </span>
      </Button>

      {/* Séparateur visuel */}
      <div className="h-6 w-px bg-border" aria-hidden="true" />

      {/* Auto-layout */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAutoLayout}
        title="Réorganiser le graphe automatiquement"
        aria-label="Réorganiser le graphe automatiquement avec l'algorithme Dagre"
        className="hover:bg-accent transition-colors"
      >
        <Workflow className="w-4 h-4" aria-hidden="true" />
        <span className="ml-2 text-xs font-medium">Auto-layout</span>
      </Button>

      {/* Séparateur visuel */}
      <div className="h-6 w-px bg-border" aria-hidden="true" />

      {/* Close */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        title="Fermer l'éditeur (Esc)"
        aria-label="Fermer l'éditeur nodal et retourner à la vue dialogues"
        className="hover:bg-accent transition-colors"
      >
        <X className="w-4 h-4" aria-hidden="true" />
        <span className="ml-2 text-xs font-medium">Fermer</span>
      </Button>
    </div>
  );
}
