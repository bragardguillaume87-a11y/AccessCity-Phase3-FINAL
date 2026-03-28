import type { CSSProperties } from 'react';
import type { DialogueBoxStyle } from '@/types';

export type DialogueBoxPosition = NonNullable<DialogueBoxStyle['position']>;

/**
 * Retourne les styles CSS du wrapper externe (absolute-positioned) de la DialogueBox,
 * en fonction de la position choisie.
 *
 * Partagé entre DialoguePreviewOverlay (éditeur) et PreviewPanel (compositeur V2)
 * pour garantir un rendu identique.
 */
export function getDialogueBoxWrapperStyle(
  position: DialogueBoxPosition,
  positionX = 50,
  positionY = 75
): CSSProperties {
  if (position === 'custom') {
    return {
      position: 'absolute',
      left: `${positionX}%`,
      top: `${positionY}%`,
      transform: 'translate(-50%, -50%)',
      width: '76%',
      zIndex: 2,
    };
  }

  const isTop = position.startsWith('top');
  const isCenter = position === 'center';
  const isLeft = position.endsWith('-left');
  const isRight = position.endsWith('-right');

  if (isCenter) {
    return {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    };
  }

  return {
    position: 'absolute',
    left: 0,
    right: 0,
    ...(isTop ? { top: 0 } : { bottom: 0 }),
    display: 'flex',
    justifyContent: isLeft ? 'flex-start' : isRight ? 'flex-end' : 'center',
    zIndex: 2,
  };
}

/**
 * Retourne les styles du gradient de vignette adaptatif selon la position.
 * Retourne null pour les positions 'center' et 'custom' (pas de gradient).
 */
export function getDialogueBoxGradientStyle(position: DialogueBoxPosition): CSSProperties | null {
  if (position === 'center' || position === 'custom') return null;

  const isTop = position.startsWith('top');
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    pointerEvents: 'none',
    ...(isTop
      ? {
          top: 0,
          height: '55%',
          background:
            'linear-gradient(to bottom, rgba(3,7,18,0.80) 0%, rgba(3,7,18,0.35) 50%, transparent 100%)',
        }
      : {
          bottom: 0,
          height: '55%',
          background:
            'linear-gradient(to top, rgba(3,7,18,0.80) 0%, rgba(3,7,18,0.35) 50%, transparent 100%)',
        }),
  };
}

/**
 * Retourne le padding interne du conteneur de la DialogueBox selon la position.
 * Pour les modes left/right, réduit le max-width pour ne pas déborder.
 */
export function getDialogueBoxInnerStyle(
  position: DialogueBoxPosition,
  isLeft: boolean,
  isRight: boolean
): CSSProperties {
  const isTop = position.startsWith('top');
  const isCenter = position === 'center';

  const verticalPadding = isTop
    ? { paddingTop: 12, paddingBottom: 0 }
    : isCenter
      ? { paddingTop: 8, paddingBottom: 8 }
      : position === 'custom'
        ? { padding: 0 }
        : { paddingTop: 0, paddingBottom: 10 };

  return {
    position: 'relative',
    maxWidth: isLeft || isRight ? '55%' : '76%',
    width: '100%',
    ...(isLeft ? { marginLeft: 12 } : isRight ? { marginRight: 12 } : { margin: '0 auto' }),
    ...verticalPadding,
  };
}
