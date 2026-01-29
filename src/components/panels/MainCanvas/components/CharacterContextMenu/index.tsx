import React, { useEffect, useRef, useState } from 'react';
import { Edit2, Smile, Sparkles, Layers, Trash2, X, FlipHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';
import { useMoodPresets } from '@/hooks/useMoodPresets';
import type { Character, SceneCharacter } from '@/types';
import MoodPickerPanel from './MoodPickerPanel';
import AnimationPickerPanel from './AnimationPickerPanel';
import LayerPickerPanel from './LayerPickerPanel';
import ConfirmDeletePanel from './ConfirmDeletePanel';

type PanelType = 'menu' | 'mood' | 'animation' | 'layer' | 'delete';

export interface CharacterContextMenuProps {
  x: number;
  y: number;
  sceneChar: SceneCharacter;
  character: Character;
  onClose: () => void;
  onEdit: (characterId: string) => void;
  onChangeMood: (sceneCharId: string, mood: string) => void;
  onChangeAnimation: (sceneCharId: string, animation: string) => void;
  onChangeLayer: (sceneCharId: string, zIndex: number) => void;
  onFlipHorizontal: (sceneCharId: string) => void;
  onRemove: (sceneCharId: string) => void;
}

/**
 * CharacterContextMenu - Kid-friendly context menu
 *
 * Large touch targets (56px), colorful icons, smooth animations.
 * Designed for children 8+ with clear visual feedback.
 */
export function CharacterContextMenu({
  x,
  y,
  sceneChar,
  character,
  onClose,
  onEdit,
  onChangeMood,
  onChangeAnimation,
  onChangeLayer,
  onFlipHorizontal,
  onRemove
}: CharacterContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [activePanel, setActivePanel] = useState<PanelType>('menu');
  const [isAnimating, setIsAnimating] = useState(true);

  const moodPresets = useMoodPresets();
  const characterName = character.name;

  // Auto-adjust position to stay on screen
  useEffect(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const padding = 16;
    let adjustedX = x;
    let adjustedY = y;

    if (x + rect.width > window.innerWidth - padding) {
      adjustedX = window.innerWidth - rect.width - padding;
    }
    if (y + rect.height > window.innerHeight - padding) {
      adjustedY = window.innerHeight - rect.height - padding;
    }

    adjustedX = Math.max(padding, adjustedX);
    adjustedY = Math.max(padding, adjustedY);

    setPosition({ x: adjustedX, y: adjustedY });

    // Entrance animation
    setTimeout(() => setIsAnimating(false), 50);
  }, [x, y]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add listener immediately (no delay)
    // Small timeout to prevent immediate close from the same click that opened the menu
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePanel !== 'menu') {
          setActivePanel('menu');
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activePanel, onClose]);

  const handleEdit = () => {
    console.log('[CharacterContextMenu] handleEdit called for character:', character.id, character.name);
    onEdit(character.id);
    onClose();
  };

  const handleMoodSelect = (mood: string) => {
    onChangeMood(sceneChar.id, mood);
    onClose();
  };

  const handleAnimationSelect = (animation: string) => {
    onChangeAnimation(sceneChar.id, animation);
    onClose();
  };

  const handleLayerChange = (zIndex: number) => {
    onChangeLayer(sceneChar.id, zIndex);
    onClose();
  };

  const handleFlipHorizontal = () => {
    onFlipHorizontal(sceneChar.id);
    onClose();
  };

  const handleConfirmDelete = () => {
    onRemove(sceneChar.id);
    onClose();
  };

  // Menu item component
  const MenuItem = ({
    icon: Icon,
    emoji,
    label,
    description,
    onClick,
    variant = 'default'
  }: {
    icon?: React.ElementType;
    emoji?: string;
    label: string;
    description: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
        variant === 'danger'
          ? "bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 text-red-400"
          : "bg-card hover:bg-muted border-2 border-border hover:border-primary/50"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
          variant === 'danger'
            ? "bg-red-500/20"
            : "bg-primary/10"
        )}
      >
        {emoji || (Icon && <Icon className="w-6 h-6" />)}
      </div>

      {/* Text */}
      <div className="flex-1 text-left">
        <div className="font-semibold text-base">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>

      {/* Arrow */}
      <div className="text-muted-foreground">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-tooltip-v2 bg-background/95 backdrop-blur-sm border-2 border-border rounded-2xl shadow-2xl p-3",
        "transition-all duration-200",
        isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '320px',
        maxWidth: '380px'
      }}
      role="menu"
      aria-label="Menu personnage"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-3">
          {character.sprites?.[sceneChar.mood || 'neutral'] ? (
            <img
              src={character.sprites[sceneChar.mood || 'neutral']}
              alt={characterName}
              className="w-10 h-10 rounded-lg object-contain bg-muted"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
              {moodPresets.find(p => p.id === (sceneChar.mood || 'neutral'))?.emoji || '😐'}
            </div>
          )}
          <div>
            <h3 className="font-bold text-base">{characterName}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {moodPresets.find(p => p.id === (sceneChar.mood || 'neutral'))?.label || sceneChar.mood || 'Neutre'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content - Panels */}
      {activePanel === 'menu' && (
        <div className="space-y-2 animate-step-slide">
          <MenuItem
            icon={Edit2}
            label={t('contextMenu.editCharacter', { name: characterName })}
            description={t('contextMenu.editCharacter.desc')}
            onClick={handleEdit}
          />
          <MenuItem
            emoji="😊"
            label={t('contextMenu.changeMood')}
            description={t('contextMenu.changeMood.desc')}
            onClick={() => setActivePanel('mood')}
          />
          <MenuItem
            icon={Sparkles}
            label={t('contextMenu.changeAnimation')}
            description={t('contextMenu.changeAnimation.desc')}
            onClick={() => setActivePanel('animation')}
          />
          <MenuItem
            icon={Layers}
            label={t('contextMenu.changeLayer')}
            description={t('contextMenu.changeLayer.desc')}
            onClick={() => setActivePanel('layer')}
          />
          <MenuItem
            icon={FlipHorizontal}
            label={t('contextMenu.flipHorizontal')}
            description={t('contextMenu.flipHorizontal.desc')}
            onClick={handleFlipHorizontal}
          />
          <MenuItem
            icon={Trash2}
            label={t('contextMenu.removeFromScene')}
            description={t('contextMenu.removeFromScene.desc')}
            onClick={() => setActivePanel('delete')}
            variant="danger"
          />
        </div>
      )}

      {activePanel === 'mood' && (
        <MoodPickerPanel
          characterName={characterName}
          currentMood={sceneChar.mood || 'neutral'}
          characterSprites={character.sprites || {}}
          availableMoods={character.moods || ['neutral']}
          onSelect={handleMoodSelect}
          onBack={() => setActivePanel('menu')}
        />
      )}

      {activePanel === 'animation' && (
        <AnimationPickerPanel
          characterName={characterName}
          currentAnimation={sceneChar.entranceAnimation || 'none'}
          onSelect={handleAnimationSelect}
          onBack={() => setActivePanel('menu')}
        />
      )}

      {activePanel === 'layer' && (
        <LayerPickerPanel
          characterName={characterName}
          currentLayer={sceneChar.zIndex || 1}
          onSelect={handleLayerChange}
          onBack={() => setActivePanel('menu')}
        />
      )}

      {activePanel === 'delete' && (
        <ConfirmDeletePanel
          characterName={characterName}
          onConfirm={handleConfirmDelete}
          onCancel={() => setActivePanel('menu')}
        />
      )}
    </div>
  );
}

export default CharacterContextMenu;
