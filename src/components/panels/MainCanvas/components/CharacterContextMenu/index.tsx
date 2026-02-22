import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Sparkles, Layers, Trash2, X, FlipHorizontal, ChevronRight } from 'lucide-react';
import { t } from '@/lib/translations';
import { useMoodPresets } from '@/hooks/useMoodPresets';
import type { Character, SceneCharacter } from '@/types';
import { logger } from '@/utils/logger';
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

interface MenuItemData {
  id: string;
  icon?: React.ElementType;
  emoji?: string;
  label: string;
  desc: string;
  onClick: () => void;
  danger?: boolean;
  hasSubPanel?: boolean;
}

/**
 * CharacterContextMenu — Menu contextuel compact, cohérent avec le design system de l'éditeur.
 *
 * Design : 260px, CSS variables, semi-compact (44px/item)
 * Animations : spring open, stagger items, slide panels, hover highlight glissant
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
  onRemove,
}: CharacterContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [activePanel, setActivePanel] = useState<PanelType>('menu');
  const [panelDirection, setPanelDirection] = useState(1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const moodPresets = useMoodPresets();
  const characterName = character.name;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const goToPanel = (panel: PanelType) => { setPanelDirection(1); setActivePanel(panel); };
  const goBack    = ()                  => { setPanelDirection(-1); setActivePanel('menu'); };

  const handleEdit = () => {
    logger.debug('[CharacterContextMenu] edit:', character.id, character.name);
    onEdit(character.id);
    onClose();
  };
  const handleMoodSelect      = (mood: string)      => { onChangeMood(sceneChar.id, mood); onClose(); };
  const handleAnimationSelect = (anim: string)      => { onChangeAnimation(sceneChar.id, anim); onClose(); };
  const handleLayerChange     = (zIndex: number)    => { onChangeLayer(sceneChar.id, zIndex); onClose(); };
  const handleFlipHorizontal  = ()                  => { onFlipHorizontal(sceneChar.id); onClose(); };
  const handleConfirmDelete   = ()                  => { onRemove(sceneChar.id); onClose(); };

  // ── Menu items data ───────────────────────────────────────────────────────
  const menuItems: MenuItemData[] = [
    { id: 'edit',   icon: Edit2,          label: t('contextMenu.editCharacter', { name: characterName }), desc: t('contextMenu.editCharacter.desc'),  onClick: handleEdit },
    { id: 'mood',   emoji: '😊',           label: t('contextMenu.changeMood'),                             desc: t('contextMenu.changeMood.desc'),       onClick: () => goToPanel('mood'),      hasSubPanel: true },
    { id: 'anim',   icon: Sparkles,        label: t('contextMenu.changeAnimation'),                        desc: t('contextMenu.changeAnimation.desc'),  onClick: () => goToPanel('animation'), hasSubPanel: true },
    { id: 'layer',  icon: Layers,          label: t('contextMenu.changeLayer'),                            desc: t('contextMenu.changeLayer.desc'),      onClick: () => goToPanel('layer'),     hasSubPanel: true },
    { id: 'flip',   icon: FlipHorizontal,  label: t('contextMenu.flipHorizontal'),                         desc: t('contextMenu.flipHorizontal.desc'),   onClick: handleFlipHorizontal },
    { id: 'delete', icon: Trash2,          label: t('contextMenu.removeFromScene'),                        desc: t('contextMenu.removeFromScene.desc'),  onClick: () => goToPanel('delete'),    danger: true },
  ];

  // ── Auto-position to stay on screen ──────────────────────────────────────
  useEffect(() => {
    if (!menuRef.current) return;
    const rect    = menuRef.current.getBoundingClientRect();
    const padding = 16;
    let ax = x;
    let ay = y;
    if (x + rect.width  > window.innerWidth  - padding) ax = window.innerWidth  - rect.width  - padding;
    if (y + rect.height > window.innerHeight - padding) ay = window.innerHeight - rect.height - padding;
    setPosition({ x: Math.max(padding, ax), y: Math.max(padding, ay) });
  }, [x, y]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 10);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { activePanel !== 'menu' ? goBack() : onClose(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activePanel, onClose]);

  const currentMoodLabel = moodPresets.find(p => p.id === (sceneChar.mood || 'neutral'))?.label
    ?? sceneChar.mood ?? 'Neutre';
  const portraitSrc = character.sprites?.[sceneChar.mood || 'neutral'];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -2 }}
      transition={{ type: 'spring', damping: 20, stiffness: 320 }}
      className="fixed border rounded-xl shadow-2xl overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '316px',
        zIndex: 9999,
        background: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border-base)',
      }}
      role="menu"
      aria-label="Menu personnage"
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--color-border-base)' }}
      >
        {portraitSrc ? (
          <img
            src={portraitSrc}
            alt={characterName}
            className="w-10 h-10 rounded-md object-contain flex-shrink-0"
            style={{ background: 'var(--color-bg-hover)' }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'var(--color-bg-hover)' }}
          >
            {moodPresets.find(p => p.id === (sceneChar.mood || 'neutral'))?.emoji ?? '😐'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold leading-tight truncate"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            {characterName}
          </h3>
          <p
            className="text-xs leading-tight capitalize truncate"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            {currentMoodLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md transition-colors flex-shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Panels ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activePanel}
          initial={{ opacity: 0, x: panelDirection * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: panelDirection * -24 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >

          {/* ── Menu principal ── */}
          {activePanel === 'menu' && (
            <div className="p-1.5 space-y-0.5">
              {menuItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.12 }}
                >
                  <button
                    type="button"
                    onClick={item.onClick}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="relative w-full flex items-center text-left rounded-lg"
                    style={{ padding: '9px 10px' }}
                    role="menuitem"
                  >
                    {/* Hover highlight glissant */}
                    {hoveredIdx === idx && (
                      <motion.div
                        layoutId="ctx-hover"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: item.danger
                            ? 'rgba(239,68,68,0.08)'
                            : 'var(--color-bg-hover)',
                        }}
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
                      />
                    )}

                    {/* Contenu */}
                    <div className="relative z-10 flex items-center gap-2.5 w-full">
                      {/* Icône */}
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${item.danger ? 'bg-red-500/10' : 'bg-primary/10'}`}
                      >
                        {item.emoji
                          ? <span className="text-base leading-none">{item.emoji}</span>
                          : item.icon && (
                            <item.icon
                              className={`w-4 h-4 ${item.danger ? 'text-red-400' : 'text-primary'}`}
                            />
                          )
                        }
                      </div>

                      {/* Texte */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium leading-tight truncate"
                          style={{ color: item.danger ? 'rgb(248 113 113)' : 'rgba(255,255,255,0.9)' }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="text-xs leading-tight truncate"
                          style={{ color: 'rgba(255,255,255,0.45)' }}
                        >
                          {item.desc}
                        </div>
                      </div>

                      {/* Chevron si sous-panel */}
                      {item.hasSubPanel && (
                        <ChevronRight
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: 'rgba(255,255,255,0.35)' }}
                        />
                      )}
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Sous-panels ── */}
          {activePanel === 'mood' && (
            <div className="p-2">
              <MoodPickerPanel
                characterName={characterName}
                currentMood={sceneChar.mood || 'neutral'}
                characterSprites={character.sprites || {}}
                availableMoods={character.moods || ['neutral']}
                onSelect={handleMoodSelect}
                onBack={goBack}
              />
            </div>
          )}

          {activePanel === 'animation' && (
            <div className="p-2">
              <AnimationPickerPanel
                characterName={characterName}
                currentAnimation={sceneChar.entranceAnimation || 'none'}
                onSelect={handleAnimationSelect}
                onBack={goBack}
              />
            </div>
          )}

          {activePanel === 'layer' && (
            <div className="p-2">
              <LayerPickerPanel
                characterName={characterName}
                currentLayer={sceneChar.zIndex || 1}
                onSelect={handleLayerChange}
                onBack={goBack}
              />
            </div>
          )}

          {activePanel === 'delete' && (
            <div className="p-2">
              <ConfirmDeletePanel
                characterName={characterName}
                onConfirm={handleConfirmDelete}
                onCancel={goBack}
              />
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default CharacterContextMenu;
