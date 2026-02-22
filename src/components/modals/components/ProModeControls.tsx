import { useState } from 'react';
import { ChevronDown, Check, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * ProModeControls - Bouton "Pro" pour le mode arbre professionnel
 *
 * Mutuellement exclusif avec le mode Serpent.
 * Active le layout Dagre standard (comme Twine, Yarn Spinner, Unreal).
 * Popover pour choisir la direction : Vertical (TB) ou Horizontal (LR).
 */
export function ProModeControls() {
  const proModeEnabled = useUIStore((state) => state.proModeEnabled);
  const proModeDirection = useUIStore((state) => state.proModeDirection);
  const proCollapseEnabled = useUIStore((state) => state.proCollapseEnabled);
  const proPaginationEnabled = useUIStore((state) => state.proPaginationEnabled);
  const proPageSize = useUIStore((state) => state.proPageSize);
  const setProModeEnabled = useUIStore((state) => state.setProModeEnabled);
  const setProModeDirection = useUIStore((state) => state.setProModeDirection);
  const setProCollapseEnabled = useUIStore((state) => state.setProCollapseEnabled);
  const setProPaginationEnabled = useUIStore((state) => state.setProPaginationEnabled);
  const setProPageSize = useUIStore((state) => state.setProPageSize);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleToggle = () => {
    setProModeEnabled(!proModeEnabled);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Toggle Button */}
      <Button
        variant={proModeEnabled ? 'default' : 'ghost'}
        size="sm"
        onClick={handleToggle}
        title={proModeEnabled ? 'Désactiver le mode pro' : 'Activer le mode pro (arbre)'}
        aria-label={proModeEnabled ? 'Désactiver le mode professionnel' : 'Activer le mode professionnel (arbre Dagre)'}
        className={
          proModeEnabled
            ? 'bg-blue-600 hover:bg-blue-700 text-white transition-colors'
            : 'hover:bg-accent transition-colors'
        }
      >
        <GitBranch className="w-4 h-4" aria-hidden="true" />
        <span className="ml-2 text-xs font-medium">Pro</span>
      </Button>

      {/* Configuration Popover (only visible when enabled) */}
      {proModeEnabled && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              title="Configurer le mode pro"
              aria-label="Configurer les options du mode professionnel"
              className="hover:bg-accent transition-colors"
            >
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="space-y-4">
              {/* Header */}
              <div className="font-semibold text-sm">
                <GitBranch className="w-4 h-4 inline mr-2" />
                Mode Pro
              </div>

              {/* Direction Selection */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Direction de l'arbre
                </div>
                <div className="space-y-2">
                  {/* Vertical (TB) */}
                  <button
                    onClick={() => setProModeDirection('TB')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      proModeDirection === 'TB'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                        {proModeDirection === 'TB' && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">Vertical</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          De haut en bas (standard Twine / Yarn Spinner)
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Horizontal (LR) */}
                  <button
                    onClick={() => setProModeDirection('LR')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      proModeDirection === 'LR'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                        {proModeDirection === 'LR' && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">Horizontal</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          De gauche à droite (style Unreal Engine)
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Collapse toggle */}
              <div className="pt-2 border-t">
                <button
                  onClick={() => setProCollapseEnabled(!proCollapseEnabled)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="text-sm">
                    <span className="font-medium">Regrouper les choix</span>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Replie les choix + réponses en un seul bloc
                    </div>
                  </div>
                  <div className={`w-8 h-5 rounded-full transition-colors flex items-center ${
                    proCollapseEnabled ? 'bg-blue-600 justify-end' : 'bg-muted justify-start'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm mx-0.5" />
                  </div>
                </button>
              </div>

              {/* Pagination toggle */}
              <div>
                <button
                  onClick={() => setProPaginationEnabled(!proPaginationEnabled)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="text-sm">
                    <span className="font-medium">Pagination</span>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Affiche les dialogues par pages
                    </div>
                  </div>
                  <div className={`w-8 h-5 rounded-full transition-colors flex items-center ${
                    proPaginationEnabled ? 'bg-blue-600 justify-end' : 'bg-muted justify-start'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm mx-0.5" />
                  </div>
                </button>
                {proPaginationEnabled && (
                  <div className="px-2 pt-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Dialogues par page : {proPageSize}
                    </div>
                    <div className="flex gap-1">
                      {[6, 8, 10, 12].map(size => (
                        <button
                          key={size}
                          onClick={() => setProPageSize(size)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            proPageSize === size
                              ? 'bg-blue-600 text-white'
                              : 'bg-muted hover:bg-accent'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Help text */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                L'arbre Dagre organise les dialogues comme dans les vrais outils professionnels.
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
