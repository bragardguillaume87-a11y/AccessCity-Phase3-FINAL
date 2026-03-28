import type { MouseEvent, ReactNode } from 'react';
import {
  getDialogueBoxWrapperStyle,
  getDialogueBoxGradientStyle,
  getDialogueBoxInnerStyle,
  type DialogueBoxPosition,
} from '@/utils/dialogueBoxPosition';

interface DialogueBoxPositionedProps {
  position: DialogueBoxPosition;
  positionX?: number;
  positionY?: number;
  /**
   * z-index de l'enveloppe absolue.
   * Défaut : 2 (valeur native de getDialogueBoxWrapperStyle).
   */
  zIndex?: number;
  /** Classes CSS sur l'enveloppe externe (ex: "absolute pointer-events-none"). */
  outerClassName?: string;
  /** Classes CSS sur le conteneur interne (ex: "pointer-events-auto"). */
  innerClassName?: string;
  /** Handler mouseDown sur l'enveloppe (ex: drag en mode custom). */
  onMouseDown?: (e: MouseEvent) => void;
  /**
   * Slot pour des enfants positionnés absolument à l'intérieur de l'enveloppe,
   * rendus avant le gradient (ex: badge "Glisser" en mode custom).
   */
  outerSlot?: ReactNode;
  children: ReactNode;
}

/**
 * Enveloppe partagée pour le positionnement de la DialogueBox.
 *
 * Encapsule les 3 fonctions utilitaires (wrapper, gradient, inner) pour éviter
 * la répétition et les désynchronisations entre consumers.
 *
 * Consumers : DialoguePreviewOverlay · PreviewPlayer · PreviewPanel
 */
export function DialogueBoxPositioned({
  position,
  positionX,
  positionY,
  zIndex = 2,
  outerClassName,
  innerClassName,
  onMouseDown,
  outerSlot,
  children,
}: DialogueBoxPositionedProps) {
  const gradientStyle = getDialogueBoxGradientStyle(position);

  return (
    <div
      className={outerClassName}
      style={{ ...getDialogueBoxWrapperStyle(position, positionX, positionY), zIndex }}
      onMouseDown={onMouseDown}
    >
      {outerSlot}
      {gradientStyle && <div aria-hidden="true" style={gradientStyle} />}
      <div className={innerClassName} style={getDialogueBoxInnerStyle(position)}>
        {children}
      </div>
    </div>
  );
}
