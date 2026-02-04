import React from 'react';
import { Keyboard, List, Sun, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

/**
 * AccessibilityToolbar - Toolbar for accessibility mode toggles
 *
 * PHASE 5.3 - Modes d'interaction alternatifs:
 * - Mode Clavier Only (Ctrl+K): Disables drag & drop, full keyboard nav
 * - Mode Liste Structuree (Ctrl+L): Text-based tree view for screen readers
 * - Mode Contraste Eleve (Ctrl+H): High contrast colors, thick borders
 */

export type AccessibilityMode = 'visual' | 'keyboard' | 'list' | 'highContrast';

interface AccessibilityToolbarProps {
  currentMode: AccessibilityMode;
  onModeChange: (mode: AccessibilityMode) => void;
}

export function AccessibilityToolbar({
  currentMode,
  onModeChange
}: AccessibilityToolbarProps) {
  // Keyboard shortcuts effect is handled in parent component (DialogueGraphModal)

  return (
    <TooltipProvider>
      <div
        className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border-2 border-border rounded-xl p-2 z-10 shadow-xl"
        role="toolbar"
        aria-label="Options d'accessibilite"
      >
        <div className="flex items-center gap-1">
          {/* Visual Mode (default) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentMode === 'visual' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange('visual')}
                aria-pressed={currentMode === 'visual'}
                aria-label="Mode visuel standard"
                className="h-8 w-8 p-0"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Mode Visuel (standard)</p>
            </TooltipContent>
          </Tooltip>

          {/* Keyboard Only Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentMode === 'keyboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange('keyboard')}
                aria-pressed={currentMode === 'keyboard'}
                aria-label="Mode clavier uniquement (Ctrl+K)"
                className="h-8 w-8 p-0"
              >
                <Keyboard className="w-4 h-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Mode Clavier (Ctrl+K)</p>
              <p className="text-xs text-muted-foreground">Navigation sans souris</p>
            </TooltipContent>
          </Tooltip>

          {/* List View Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange('list')}
                aria-pressed={currentMode === 'list'}
                aria-label="Mode liste structuree (Ctrl+L)"
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Mode Liste (Ctrl+L)</p>
              <p className="text-xs text-muted-foreground">Pour lecteurs d'ecran</p>
            </TooltipContent>
          </Tooltip>

          {/* High Contrast Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentMode === 'highContrast' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange('highContrast')}
                aria-pressed={currentMode === 'highContrast'}
                aria-label="Mode contraste eleve (Ctrl+H)"
                className="h-8 w-8 p-0"
              >
                <Sun className="w-4 h-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Contraste Eleve (Ctrl+H)</p>
              <p className="text-xs text-muted-foreground">Couleurs plus visibles</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Screen reader only: current mode announcement */}
        <div className="sr-only" role="status" aria-live="polite">
          Mode actuel: {getModeLabel(currentMode)}
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Get human-readable label for accessibility mode
 */
function getModeLabel(mode: AccessibilityMode): string {
  switch (mode) {
    case 'visual':
      return 'Visuel standard';
    case 'keyboard':
      return 'Clavier uniquement';
    case 'list':
      return 'Liste structuree';
    case 'highContrast':
      return 'Contraste eleve';
    default:
      return 'Inconnu';
  }
}

/**
 * Hook for accessibility mode keyboard shortcuts
 */
export function useAccessibilityShortcuts(
  onModeChange: (mode: AccessibilityMode) => void,
  isEnabled: boolean = true
) {
  React.useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+K: Keyboard mode
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onModeChange('keyboard');
      }

      // Ctrl+L: List mode
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        onModeChange('list');
      }

      // Ctrl+H: High contrast mode
      if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault();
        onModeChange('highContrast');
      }

      // Ctrl+0: Back to visual mode (reset)
      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        onModeChange('visual');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, onModeChange]);
}
