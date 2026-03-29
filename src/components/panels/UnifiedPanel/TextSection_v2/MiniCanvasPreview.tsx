/**
 * TextSection_v2/MiniCanvasPreview.tsx
 * Miniature 16:9 du canvas montrant la position de la boîte en temps réel.
 * Bret Victor §7 : connexion immédiate créateur/création.
 */

import type { DialogueBoxPosition } from '@/utils/dialogueBoxPosition';

interface MiniCanvasPreviewProps {
  position: DialogueBoxPosition;
  positionX: number;
  positionY: number;
  boxWidth: number;
  bgColor: string;
  boxOpacity: number;
  borderColor: string;
  borderStyle: 'none' | 'subtle' | 'prominent';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const RADIUS_MAP: Record<string, string> = {
  none: '0px',
  sm: '3px',
  md: '5px',
  lg: '7px',
  xl: '9px',
};

const POSITION_LABELS: Record<DialogueBoxPosition, string> = {
  'top-left': 'Haut gauche',
  top: 'Haut centre',
  'top-right': 'Haut droite',
  center: 'Centre',
  'bottom-left': 'Bas gauche',
  bottom: 'Bas centre',
  'bottom-right': 'Bas droite',
  custom: 'Libre',
};

/**
 * Calcule le style du rectangle de boîte dans la miniature.
 * Le canvas miniature fait 100% × 56% (ratio 16:9 via padding-top).
 * On place un rectangle proportionnel à boxWidth et à la position.
 */
function getBoxStyle(
  position: DialogueBoxPosition,
  positionX: number,
  positionY: number,
  boxWidth: number,
  bgColor: string,
  boxOpacity: number,
  borderColor: string,
  borderStyle: string,
  borderRadius: string
): React.CSSProperties {
  const opacityHex = Math.round(boxOpacity * 255)
    .toString(16)
    .padStart(2, '0');
  const background = `${bgColor}${opacityHex}`;
  const border =
    borderStyle === 'none'
      ? 'none'
      : borderStyle === 'prominent'
        ? `1.5px solid ${borderColor}73`
        : `1px solid ${borderColor}2e`;
  const radius = RADIUS_MAP[borderRadius] ?? '0px';

  // Hauteur de la boîte dans la miniature ≈ 22% du canvas (représentatif)
  const BOX_H = 22;
  const BOX_W = boxWidth;

  const base: React.CSSProperties = {
    position: 'absolute',
    width: `${BOX_W}%`,
    height: `${BOX_H}%`,
    background,
    border,
    borderRadius: radius,
    transition: 'all 0.2s ease',
  };

  if (position === 'custom') {
    return {
      ...base,
      left: `${positionX}%`,
      top: `${positionY}%`,
      transform: 'translate(-50%, -50%)',
    };
  }

  const isTop = position.startsWith('top');
  const isCenter = position === 'center';
  const isLeft = position.endsWith('-left');
  const isRight = position.endsWith('-right');

  return {
    ...base,
    ...(isTop
      ? { top: '4%' }
      : isCenter
        ? { top: '50%', transform: 'translateY(-50%)' }
        : { bottom: '4%' }),
    ...(isLeft
      ? { left: '3%' }
      : isRight
        ? { right: '3%' }
        : { left: '50%', transform: isCenter ? 'translate(-50%, -50%)' : 'translateX(-50%)' }),
  };
}

export function MiniCanvasPreview({
  position,
  positionX,
  positionY,
  boxWidth,
  bgColor,
  boxOpacity,
  borderColor,
  borderStyle,
  borderRadius,
}: MiniCanvasPreviewProps) {
  const boxStyle = getBoxStyle(
    position,
    positionX,
    positionY,
    boxWidth,
    bgColor,
    boxOpacity,
    borderColor,
    borderStyle,
    borderRadius
  );

  return (
    <div aria-hidden="true" className="mt-2 mb-1">
      {/* Conteneur 16:9 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: 'rgba(30,36,56,0.6)',
          borderRadius: 5,
          border: '1px solid var(--color-border-base)',
          overflow: 'hidden',
        }}
      >
        {/* Grille légère pour simuler le canvas */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20% 25%',
          }}
        />

        {/* Rectangle boîte de dialogue */}
        <div style={boxStyle}>
          {/* Ligne de texte simulée */}
          <div
            style={{
              position: 'absolute',
              inset: '20% 10%',
              display: 'flex',
              flexDirection: 'column',
              gap: '15%',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                height: 2,
                background: 'rgba(255,255,255,0.35)',
                borderRadius: 1,
                width: '75%',
              }}
            />
            <div
              style={{
                height: 2,
                background: 'rgba(255,255,255,0.22)',
                borderRadius: 1,
                width: '55%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Badge position */}
      <p
        style={{
          fontSize: 9,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginTop: 3,
          fontFamily: 'var(--font-family-mono)',
          letterSpacing: '0.03em',
        }}
      >
        📍 {POSITION_LABELS[position]} · {boxWidth}%
      </p>
    </div>
  );
}
