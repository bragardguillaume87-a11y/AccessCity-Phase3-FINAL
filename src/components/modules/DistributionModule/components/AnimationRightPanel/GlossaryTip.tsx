/**
 * GlossaryTip — terme technique + icône ℹ déclenchant un tooltip Radix.
 *
 * Réutilise Tooltip/TooltipTrigger/TooltipContent déjà disponibles.
 * TooltipProvider est à la racine App.tsx (delayDuration=300) — aucun wrapper requis.
 *
 * Usage :
 *   <GlossaryTip definition="FPS = images par seconde…">
 *     {selectedClip.fps}&thinsp;fps
 *   </GlossaryTip>
 */

import type { ReactNode } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface GlossaryTipProps {
  /** Contenu visible (terme, valeur…) */
  children: ReactNode;
  /** Définition simple — 1-2 phrases max */
  definition: string;
  /** Exemple concret facultatif */
  example?: string;
}

export function GlossaryTip({ children, definition, example }: GlossaryTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            cursor: 'help',
          }}
        >
          {children}
          <span
            style={{
              fontSize: 8,
              color: 'var(--color-text-muted)',
              opacity: 0.7,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            ℹ
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" style={{ maxWidth: 220, lineHeight: 1.5 }}>
        <p style={{ margin: 0 }}>{definition}</p>
        {example && (
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontStyle: 'italic' }}>{example}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
