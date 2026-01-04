import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Keyboard } from 'lucide-react';

/**
 * ShortcutsSection - Keyboard shortcuts reference
 * Display-only section showing available keyboard shortcuts
 * No props needed as this is a static reference list
 */
export function ShortcutsSection() {
  // Keyboard shortcuts configuration
  const shortcuts = [
    {
      id: 'save',
      label: 'Sauvegarder le projet',
      description: 'Enregistrer tous les changements',
      keys: 'Ctrl+S'
    },
    {
      id: 'new-scene',
      label: 'Nouvelle scène',
      description: 'Créer une nouvelle scène',
      keys: 'Ctrl+N'
    },
    {
      id: 'delete',
      label: 'Supprimer la sélection',
      description: 'Supprimer l\'élément sélectionné',
      keys: 'Delete'
    }
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Section Header */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Keyboard className="h-5 w-5 text-primary" />
          Raccourcis Clavier
        </h3>
      </div>

      {/* Shortcuts List */}
      <div className="space-y-3">
        {shortcuts.map(shortcut => (
          <Card
            key={shortcut.id}
            className="transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:scale-102"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{shortcut.label}</p>
                  <p className="text-sm text-muted-foreground">{shortcut.description}</p>
                </div>
                <code className="px-3 py-1 bg-muted rounded text-sm font-mono transition-all duration-200 hover:bg-primary/10 hover:text-primary">
                  {shortcut.keys}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Info Message */}
        <p className="text-sm text-muted-foreground mt-4 px-2">
          Les raccourcis clavier sont actuellement en lecture seule. Personnalisation bientôt disponible.
        </p>
      </div>
    </div>
  );
}

ShortcutsSection.propTypes = {};
