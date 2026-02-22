
import { AlignLeft, AlignCenter, AlignRight, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';

/**
 * CharacterPositioningTools - Outils de positionnement rapide (PHASE 8)
 * Permet de positionner rapidement un personnage (gauche/centre/droite)
 * et ajuster sa taille (petit/moyen/grand)
 *
 * Features:
 * - 3 positions prédéfinies: gauche (15%), centre (50%), droite (85%)
 * - 3 tailles prédéfinies: petit (0.7), moyen (1.0), grand (1.3)
 * - Feedback visuel hover
 * - WCAG 2.2 AA compliant
 */

export interface CharacterPositioningToolsProps {
  characterId?: string;
  sceneId?: string;
}

interface PositionPreset {
  x: number;
  label: string;
}

interface SizePreset {
  scale: number;
  label: string;
}

type PositionKey = 'left' | 'center' | 'right';
type SizeKey = 'small' | 'medium' | 'large';

export function CharacterPositioningTools({ characterId, sceneId }: CharacterPositioningToolsProps) {
  const updateCharacterPosition = useSceneElementsStore(state => state.updateCharacterPosition);

  // Positions prédéfinies (% de la largeur du canvas)
  const POSITIONS: Record<PositionKey, PositionPreset> = {
    left: { x: 15, label: 'Gauche' },
    center: { x: 50, label: 'Centre' },
    right: { x: 85, label: 'Droite' }
  };

  // Tailles prédéfinies (scale factor)
  const SIZES: Record<SizeKey, SizePreset> = {
    small: { scale: 0.7, label: 'Petit' },
    medium: { scale: 1.0, label: 'Moyen' },
    large: { scale: 1.3, label: 'Grand' }
  };

  const handlePositionChange = (positionKey: PositionKey) => {
    if (!characterId || !sceneId) return;
    const pos = POSITIONS[positionKey];
    updateCharacterPosition(sceneId, characterId, { position: { x: pos.x, y: 50 } }); // y=50 = verticalement centré
  };

  const handleSizeChange = (sizeKey: SizeKey) => {
    if (!characterId || !sceneId) return;
    const size = SIZES[sizeKey];
    updateCharacterPosition(sceneId, characterId, { scale: size.scale });
  };

  if (!characterId) {
    return (
      <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-lg">
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Sélectionnez un personnage sur le canvas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-lg">
      {/* Position rapide */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
          Position
        </p>
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePositionChange('left')}
            className="flex flex-col items-center gap-1 h-auto py-2"
            title="Positionner à gauche"
          >
            <AlignLeft className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs">Gauche</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePositionChange('center')}
            className="flex flex-col items-center gap-1 h-auto py-2"
            title="Positionner au centre"
          >
            <AlignCenter className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs">Centre</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePositionChange('right')}
            className="flex flex-col items-center gap-1 h-auto py-2"
            title="Positionner à droite"
          >
            <AlignRight className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs">Droite</span>
          </Button>
        </div>
      </div>

      {/* Taille rapide */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
          Taille
        </p>
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSizeChange('small')}
            className="flex flex-col items-center gap-1 h-auto py-2"
            title="Taille petite"
          >
            <Minimize2 className="w-3 h-3" aria-hidden="true" />
            <span className="text-xs">Petit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSizeChange('medium')}
            className="flex flex-col items-center gap-1 h-auto py-2"
            title="Taille moyenne"
          >
            <div className="w-4 h-4 border-2 border-current rounded" aria-hidden="true" />
            <span className="text-xs">Moyen</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSizeChange('large')}
            className="flex flex-col items-center gap-1 h-auto py-2"
            title="Taille grande"
          >
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs">Grand</span>
          </Button>
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-base)]">
        💡 Cliquez pour appliquer rapidement
      </p>
    </div>
  );
}

export default CharacterPositioningTools;
