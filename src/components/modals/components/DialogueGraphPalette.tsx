import { useState } from 'react';
import { Plus, MessageSquare, GitBranch, Dices, Network, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * DialogueGraphPalette - Palette de création de dialogues (rétractable)
 *
 * Position: En haut à gauche du graphe, flottante
 * Par défaut: Rétractée (bouton + uniquement)
 * Au clic: S'ouvre pour afficher les 4 types de dialogues
 *
 * Types de dialogues:
 * - Simples: Dialogue sans choix (texte simple)
 * - À choisir: Dialogue avec 2 choix simples
 * - Dés magiques: Dialogue avec résolution par dés (1-2 tests)
 * - Expert (multi-choix): Dialogue avec choix multiples + effets (2-4 choix)
 */

export interface DialogueGraphPaletteProps {
  /** Callback pour créer un nouveau dialogue via le wizard */
  onCreate: (complexity: 'linear' | 'binary' | 'magic-dice' | 'expert') => void;
}

export function DialogueGraphPalette({ onCreate }: DialogueGraphPaletteProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCreate = (complexity: 'linear' | 'binary' | 'magic-dice' | 'expert') => {
    onCreate(complexity);
    setIsExpanded(false);
  };

  // Collapsed state: compact button with label
  if (!isExpanded) {
    return (
      <div className="absolute top-4 left-4 z-10">
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-card/90 backdrop-blur-sm border-2 border-border shadow-xl hover:bg-accent hover:border-primary/50 transition-all rounded-xl h-11 px-4 gap-2"
          variant="ghost"
          aria-label="Ouvrir la palette de création de dialogues"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-semibold">Créer</span>
        </Button>
      </div>
    );
  }

  // Expanded state: full palette
  return (
    <div
      className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border-2 border-border rounded-xl p-3 z-10 shadow-xl animate-in slide-in-from-left-2 duration-200"
      role="complementary"
      aria-label="Palette de création de dialogues"
    >
      {/* Header with collapse button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 cosmos-palette-header">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Créer un dialogue
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="h-7 w-7 p-0 hover:bg-accent"
          aria-label="Réduire la palette"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Boutons de création */}
      <div className="space-y-2" role="group" aria-label="Types de dialogues disponibles">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreate('linear')}
          className="cosmos-create-button w-full justify-start gap-3 hover:bg-blue-900/20 hover:border-blue-500 transition-all"
          aria-label="Créer un dialogue simple sans choix"
        >
          <MessageSquare className="cosmos-button-icon text-blue-400" aria-hidden="true" />
          <span className="text-sm font-semibold">Simples</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreate('binary')}
          className="cosmos-create-button w-full justify-start gap-3 hover:bg-green-900/20 hover:border-green-500 transition-all"
          aria-label="Créer un dialogue avec 2 choix simples"
        >
          <GitBranch className="cosmos-button-icon text-green-400" aria-hidden="true" />
          <span className="text-sm font-semibold">À choisir</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreate('magic-dice')}
          className="cosmos-create-button w-full justify-start gap-3 hover:bg-purple-900/20 hover:border-purple-500 transition-all"
          aria-label="Créer un dialogue avec tests de dés magiques"
        >
          <Dices className="cosmos-button-icon text-purple-400" aria-hidden="true" />
          <span className="text-sm font-semibold">Dés magiques</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreate('expert')}
          className="cosmos-create-button w-full justify-start gap-3 hover:bg-orange-900/20 hover:border-orange-500 transition-all"
          aria-label="Créer un dialogue expert avec choix multiples et effets"
        >
          <Network className="cosmos-button-icon text-orange-400" aria-hidden="true" />
          <span className="text-sm font-semibold">Expert</span>
        </Button>
      </div>
    </div>
  );
}
