import { Plus, MessageSquare, GitBranch, Dices, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * DialogueGraphPalette - Palette de création de dialogues
 *
 * Position: En haut à gauche du graphe, flottante
 *
 * Approche Hybride:
 * - Boutons cliquables (PAS de drag & drop)
 * - Cliquer un bouton → Ouvre DialogueWizard en mode création
 * - Le wizard guide l'utilisateur à travers toutes les étapes
 *
 * Types de dialogues:
 * - Simple: Dialogue sans choix (linéaire)
 * - Avec Choix (2): Dialogue avec 2 choix binaires
 * - Dés Magiques: Dialogue avec résolution par dés (2 branches: succès/échec)
 * - Expert (Multi-choix): Dialogue avec nombre variable de choix (mode avancé)
 *
 * Accessibilité:
 * - ARIA labels descriptifs
 * - Focus visible
 * - Hover effects avec couleurs sémantiques
 */

export interface DialogueGraphPaletteProps {
  /** Callback pour créer un nouveau dialogue via le wizard */
  onCreate: (complexity: 'simple' | 'choice' | 'magic-dice' | 'expert') => void;
}

export function DialogueGraphPalette({ onCreate }: DialogueGraphPaletteProps) {
  return (
    <div
      className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border-2 border-border rounded-xl p-3 z-10 shadow-xl"
      role="complementary"
      aria-label="Palette de création de dialogues"
    >
      {/* Header */}
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Plus className="w-4 h-4" aria-hidden="true" />
        Créer un dialogue
      </h3>

      {/* Boutons de création */}
      <div className="space-y-2" role="group" aria-label="Types de dialogues disponibles">
        {/* Dialogue Simple */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreate('simple')}
          className="w-full justify-start gap-2 hover:bg-blue-900/20 hover:border-blue-500 transition-all"
          aria-label="Créer un dialogue simple sans choix"
        >
          <MessageSquare className="w-4 h-4 text-blue-400" aria-hidden="true" />
          <span className="text-xs font-medium">Simple</span>
        </Button>

        {/* Dialogue avec Choix (2) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreate('choice')}
          className="w-full justify-start gap-2 hover:bg-purple-900/20 hover:border-purple-500 transition-all"
          aria-label="Créer un dialogue avec 2 choix binaires"
        >
          <GitBranch className="w-4 h-4 text-purple-400" aria-hidden="true" />
          <span className="text-xs font-medium">Avec Choix (2)</span>
        </Button>

        {/* Dialogue Dés Magiques */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreate('magic-dice')}
          className="w-full justify-start gap-2 hover:bg-pink-900/20 hover:border-pink-500 transition-all"
          aria-label="Créer un dialogue avec résolution par dés magiques"
        >
          <Dices className="w-4 h-4 text-pink-400" aria-hidden="true" />
          <span className="text-xs font-medium">Dés Magiques</span>
        </Button>

        {/* Dialogue Expert (Multi-choix) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreate('expert')}
          className="w-full justify-start gap-2 hover:bg-cyan-900/20 hover:border-cyan-500 transition-all"
          aria-label="Créer un dialogue expert avec nombre variable de choix"
        >
          <Network className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <span className="text-xs font-medium">Expert (Multi-choix)</span>
        </Button>
      </div>
    </div>
  );
}
