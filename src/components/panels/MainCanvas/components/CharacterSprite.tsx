import React from 'react';
import { Rnd } from 'react-rnd';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { AnimatedCharacterSprite } from '@/components/ui/AnimatedCharacterSprite';
import { useSettingsStore } from '@/stores/settingsStore';
import { AlignLeft, AlignCenter, AlignRight, Minus, Plus, FlipHorizontal, Trash2 } from 'lucide-react';
import { percentToPixels, pixelsToPercent } from '@/utils/canvasPositioning';
import { Z_INDEX } from '@/utils/zIndexLayers';
import { CHARACTER_ANIMATION_VARIANTS } from '@/constants/animations';
import { CANVAS_CONFIG, ELEMENT_SIZES, REFERENCE_CANVAS_WIDTH } from '@/config/canvas';
import type { SceneCharacter, Character, Size } from '@/types';

// Extended SceneCharacter with optional zIndex for runtime
interface SceneCharacterWithZIndex extends SceneCharacter {
  zIndex?: number;
}

// ── Handles & sélection ───────────────────────────────────────────────────────

/** Active tous les coins pour le redimensionnement (aspect ratio lock = diagonal uniquement) */
const CORNER_RESIZE = {
  top: false, right: false, bottom: false, left: false,
  topLeft: true, topRight: true, bottomLeft: true, bottomRight: true,
};

const NO_RESIZE = {
  top: false, right: false, bottom: false, left: false,
  topLeft: false, topRight: false, bottomLeft: false, bottomRight: false,
};

/** Cercles violets visibles aux 4 coins — design game-like */
const HANDLE_STYLES = {
  topLeft:     { width: 14, height: 14, left: -7,  top: -7,    borderRadius: '50%', background: 'rgb(168,85,247)', border: '2px solid #fff', cursor: 'nw-resize', zIndex: 104 },
  topRight:    { width: 14, height: 14, right: -7, top: -7,    borderRadius: '50%', background: 'rgb(168,85,247)', border: '2px solid #fff', cursor: 'ne-resize', zIndex: 104 },
  bottomLeft:  { width: 14, height: 14, left: -7,  bottom: -7, borderRadius: '50%', background: 'rgb(168,85,247)', border: '2px solid #fff', cursor: 'sw-resize', zIndex: 104 },
  bottomRight: { width: 14, height: 14, right: -7, bottom: -7, borderRadius: '50%', background: 'rgb(168,85,247)', border: '2px solid #fff', cursor: 'se-resize', zIndex: 104 },
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CharacterSpriteProps {
  sceneChar: SceneCharacterWithZIndex;
  character: Character;
  canvasDimensions: Size;
  gridEnabled: boolean;
  selectedCharacterId?: string;
  /** Mood override from the currently selected dialogue's characterMoods field */
  activeMoodOverride?: string;
  /** Le personnage parle dans le dialogue actuellement sélectionné */
  isSpeaking?: boolean;
  onCharacterClick: (sceneChar: SceneCharacterWithZIndex) => void;
  onContextMenu: (e: React.MouseEvent, sceneChar: SceneCharacterWithZIndex) => void;
  onUpdatePosition: (id: string, updates: Partial<SceneCharacterWithZIndex>) => void;
  /** Boutons de contrôle rapide (barre sous le sprite sélectionné) */
  onFlipHorizontal?: () => void;
  onRemove?: () => void;
  onPositionChange?: (x: number, y: number) => void;
  onScaleChange?: (scale: number) => void;
}

// ── Composant ─────────────────────────────────────────────────────────────────

/**
 * CharacterSprite - Draggable/resizable character sprite on canvas.
 *
 * Design game-like (8+ ans) :
 *   - Zoom hover   : Framer Motion whileHover (fonctionne pour TOUS les persos)
 *   - Sélection    : coins violets + lueur (remplace border bleue animate-pulse)
 *   - Handles      : cercles violets 14px aux 4 coins (avec lockAspectRatio)
 *   - Contrôles    : mini-barre SOUS le sprite (sibling dans Rnd, pas child)
 *
 * ⚠️ Positionnement barre de contrôle :
 *   La barre est un sibling du motion.div à l'intérieur du Rnd (top: 100%).
 *   Le Rnd a overflow: visible — la barre n'est clippée que par le canvas outer.
 *   Ne PAS la mettre dans motion.div (overflow clippé côté canvas).
 */
export const CharacterSprite = React.memo(function CharacterSprite({
  sceneChar,
  character,
  canvasDimensions,
  gridEnabled,
  selectedCharacterId,
  activeMoodOverride,
  isSpeaking = false,
  onCharacterClick,
  onContextMenu,
  onUpdatePosition,
  onFlipHorizontal,
  onRemove,
  onPositionChange,
  onScaleChange,
}: CharacterSpriteProps) {
  const isSelected = selectedCharacterId === sceneChar.id;
  const characterFx = useSettingsStore(s => s.characterFx);

  const effectiveMood = activeMoodOverride || sceneChar.mood || 'neutral';
  const sprite = character.sprites?.[effectiveMood];
  const position = sceneChar.position || { x: 50, y: 50 };
  const scale = sceneChar.scale || 1.0;
  const zIndex = Math.max(Z_INDEX.CANVAS_CHARACTER_MIN, Math.min(Z_INDEX.CANVAS_CHARACTER_MAX, sceneChar.zIndex || 1));

  const canvasScaleFactor = canvasDimensions.width > 0
    ? canvasDimensions.width / REFERENCE_CANVAS_WIDTH
    : 1;

  const baseWidth  = ELEMENT_SIZES.CHARACTER.width;   // 128
  const baseHeight = ELEMENT_SIZES.CHARACTER.height;  // 128
  const scaledWidth  = baseWidth  * scale * canvasScaleFactor;
  const scaledHeight = baseHeight * scale * canvasScaleFactor;

  const pixelX = percentToPixels(position.x, canvasDimensions.width)  - (scaledWidth  / 2);
  const pixelY = percentToPixels(position.y, canvasDimensions.height) - (scaledHeight / 2);

  const gridSize = CANVAS_CONFIG.GRID_SIZE;
  const dragGrid = gridEnabled ? [gridSize, gridSize] : [1, 1];

  const entranceAnimation = (sceneChar.entranceAnimation || 'none') as keyof typeof CHARACTER_ANIMATION_VARIANTS;
  const animationVariant  = (CHARACTER_ANIMATION_VARIANTS[entranceAnimation] || CHARACTER_ANIMATION_VARIANTS.none) as unknown as Variants;

  // ── Handlers contrôles rapides ───────────────────────────────────────────
  const stopAndCall = (e: React.MouseEvent, fn?: () => void) => {
    e.stopPropagation();
    fn?.();
  };

  const handleScaleStep = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    const next = Math.max(0.3, Math.min(3.0, scale + delta));
    onScaleChange?.(Math.round(next * 10) / 10);
  };

  const handlePosition = (e: React.MouseEvent, x: number) => {
    e.stopPropagation();
    onPositionChange?.(x, position.y);
  };

  // Affiche la barre au-dessus si le personnage est dans la moitié basse du canvas
  const showToolbarAbove = position.y > 50;

  return (
    <Rnd
      key={sceneChar.id}
      size={{ width: scaledWidth, height: scaledHeight }}
      position={{ x: pixelX, y: pixelY }}
      onDragStop={(_e, d) => {
        const centerX = d.x + (scaledWidth  / 2);
        const centerY = d.y + (scaledHeight / 2);
        onUpdatePosition(sceneChar.id, {
          position: {
            x: pixelsToPercent(centerX, canvasDimensions.width),
            y: pixelsToPercent(centerY, canvasDimensions.height),
          }
        });
      }}
      onResizeStop={(_e, _direction, ref, _delta, pos) => {
        const newWidth = parseInt(ref.style.width);
        const newScale = newWidth / (baseWidth * canvasScaleFactor);
        const centerX  = pos.x + (newWidth / 2);
        const centerY  = pos.y + (parseInt(ref.style.height) / 2);
        onUpdatePosition(sceneChar.id, {
          position: {
            x: pixelsToPercent(centerX, canvasDimensions.width),
            y: pixelsToPercent(centerY, canvasDimensions.height),
          },
          scale: newScale,
        });
      }}
      dragGrid={dragGrid as [number, number]}
      resizeGrid={dragGrid as [number, number]}
      lockAspectRatio={true}
      style={{ zIndex, overflow: 'visible' }}
      className="group"
      enableResizing={isSelected ? CORNER_RESIZE : NO_RESIZE}
      handleStyles={isSelected ? HANDLE_STYLES : {}}
    >
      {/* ── Sprite + interaction layer ─────────────────────────────────── */}
      <motion.div
        className="w-full h-full cursor-move relative"
        onClick={() => onCharacterClick(sceneChar)}
        onContextMenu={(e) => onContextMenu(e, sceneChar)}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={animationVariant}
        // whileHover via Framer Motion : fiable pour TOUS les personnages
        // (plus fiable que group-hover Tailwind qui conflicte avec inline transforms)
        whileHover={{ scale: 1.06 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      >
        {/* Sprite avec animations */}
        <AnimatedCharacterSprite
          spriteUrl={sprite}
          alt={character.name}
          isSpeaking={isSpeaking}
          flipped={sceneChar.flipped}
          fxConfig={characterFx}
          className="drop-shadow-lg"
        />

        {/* Nom (hover) */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-black/80 text-white text-xs font-semibold rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {character.name}
        </div>

        {/* ── Indicateur de sélection game-like ── */}
        {isSelected && (
          <div className="absolute pointer-events-none" style={{ inset: -4, zIndex: 100 }}>
            {/* Lueur violette */}
            <div className="absolute inset-0 rounded-lg" style={{
              boxShadow: '0 0 0 2px rgb(168,85,247), 0 0 18px 3px rgba(168,85,247,0.40)',
            }} />
            {/* Coin supérieur gauche */}
            <div className="absolute top-0 left-0 w-4 h-4" style={{ borderTop: '3px solid rgb(168,85,247)', borderLeft: '3px solid rgb(168,85,247)', borderRadius: '3px 0 0 0' }} />
            {/* Coin supérieur droit */}
            <div className="absolute top-0 right-0 w-4 h-4" style={{ borderTop: '3px solid rgb(168,85,247)', borderRight: '3px solid rgb(168,85,247)', borderRadius: '0 3px 0 0' }} />
            {/* Coin inférieur gauche */}
            <div className="absolute bottom-0 left-0 w-4 h-4" style={{ borderBottom: '3px solid rgb(168,85,247)', borderLeft: '3px solid rgb(168,85,247)', borderRadius: '0 0 0 3px' }} />
            {/* Coin inférieur droit */}
            <div className="absolute bottom-0 right-0 w-4 h-4" style={{ borderBottom: '3px solid rgb(168,85,247)', borderRight: '3px solid rgb(168,85,247)', borderRadius: '0 0 3px 0' }} />
          </div>
        )}
      </motion.div>

      {/* ── Barre de contrôles rapides ──────────────────────────────────────
          SIBLING du motion.div dans Rnd (PAS un child) :
          - Auto-positionnée AU-DESSUS si le personnage est dans la moitié basse du canvas
          - visible grâce à overflow:visible sur le Rnd
      ─────────────────────────────────────────────────────────────────── */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            ...(showToolbarAbove
              ? { bottom: '100%', marginBottom: 10 }
              : { top:    '100%', marginTop:    10 }),
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 105,
            whiteSpace: 'nowrap',
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <div
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-xl"
            style={{
              background: 'rgba(8,8,18,0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(168,85,247,0.55)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.2)',
            }}
          >
            {/* ── Groupe Taille ── */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-500/30 text-white/70 hover:text-white transition-colors"
              title="Réduire (−20%)"
              onClick={e => handleScaleStep(e, -0.2)}
            >
              <Minus className="w-4 h-4" />
            </button>

            <span
              className="min-w-[40px] text-center text-[11px] font-mono font-semibold text-purple-300 select-none"
              title="Taille actuelle"
            >
              {scale.toFixed(1)}×
            </span>

            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-500/30 text-white/70 hover:text-white transition-colors"
              title="Agrandir (+20%)"
              onClick={e => handleScaleStep(e, +0.2)}
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Séparateur */}
            <div className="w-px h-5 bg-white/15 mx-0.5" />

            {/* ── Groupe Position ── */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-500/30 text-white/70 hover:text-white transition-colors"
              title="Positionner à gauche"
              onClick={e => handlePosition(e, 15)}
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-500/30 text-white/70 hover:text-white transition-colors"
              title="Centrer horizontalement"
              onClick={e => handlePosition(e, 50)}
            >
              <AlignCenter className="w-4 h-4" />
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-500/30 text-white/70 hover:text-white transition-colors"
              title="Positionner à droite"
              onClick={e => handlePosition(e, 85)}
            >
              <AlignRight className="w-4 h-4" />
            </button>

            {/* Séparateur */}
            <div className="w-px h-5 bg-white/15 mx-0.5" />

            {/* ── Groupe Actions ── */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-500/30 text-white/70 hover:text-white transition-colors"
              title="Retourner horizontalement"
              onClick={e => stopAndCall(e, onFlipHorizontal)}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {/* Séparateur danger */}
            <div className="w-px h-5 bg-white/15 mx-0.5" />

            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/25 text-white/40 hover:text-red-400 transition-colors"
              title="Retirer de la scène"
              onClick={e => stopAndCall(e, onRemove)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Rnd>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.sceneChar.id              === nextProps.sceneChar.id              &&
    prevProps.sceneChar.mood            === nextProps.sceneChar.mood            &&
    prevProps.sceneChar.position?.x     === nextProps.sceneChar.position?.x     &&
    prevProps.sceneChar.position?.y     === nextProps.sceneChar.position?.y     &&
    prevProps.sceneChar.scale           === nextProps.sceneChar.scale           &&
    prevProps.sceneChar.flipped         === nextProps.sceneChar.flipped         &&
    prevProps.sceneChar.entranceAnimation === nextProps.sceneChar.entranceAnimation &&
    prevProps.character.id              === nextProps.character.id              &&
    prevProps.character.sprites         === nextProps.character.sprites         &&
    prevProps.canvasDimensions.width    === nextProps.canvasDimensions.width    &&
    prevProps.canvasDimensions.height   === nextProps.canvasDimensions.height   &&
    prevProps.gridEnabled               === nextProps.gridEnabled               &&
    prevProps.selectedCharacterId       === nextProps.selectedCharacterId       &&
    prevProps.activeMoodOverride        === nextProps.activeMoodOverride        &&
    prevProps.isSpeaking                === nextProps.isSpeaking
  );
});
