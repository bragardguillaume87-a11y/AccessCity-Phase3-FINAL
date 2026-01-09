import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CollapsibleSection } from '../ui/CollapsibleSection.tsx';
import CharacterMoodPicker from './UnifiedPanel/CharacterMoodPicker.jsx';
import CharacterPositioningTools from './UnifiedPanel/CharacterPositioningTools.jsx';
import { Image, Type, Users, Box, BarChart3, Volume2, ImagePlus, Sparkles } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { motion } from 'framer-motion';
import { useAssets } from '@/hooks/useAssets';
import { cn } from '@/lib/utils';
import { useScenesStore, useUIStore } from '../../stores/index.js';
import { logger } from '../../utils/logger.js';

/**
 * UnifiedPanel - Unified menu "Add Objects" style Powtoon (PHASE 8 ENHANCED)
 * Remplace PropertiesPanel avec menu gris unifié (8 sections Accordion)
 *
 * Features:
 * - 8 sections: Backgrounds, Text, Characters, Objets, Charts, Audio, Images, Effects
 * - CharacterMoodPicker avec preview humeurs (hover)
 * - CharacterPositioningTools pour positionnement rapide (PHASE 8)
 * - Mode Simple/Avancé toggle (PHASE 8)
 * - Drag-to-canvas pour tous types d'éléments
 * - Design tokens gaming + WCAG 2.2 AA
 *
 * @param {Object} props
 * @param {Function} props.onOpenModal - Callback to open modals (assets, characters, etc.)
 */
export default function UnifiedPanel({ onOpenModal }) {
  // PHASE 8: View mode state (simple | advanced)
  const [viewMode, setViewMode] = useState('simple');

  // Get selected element from UI store
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const scenes = useScenesStore(state => state.scenes);
  const selectedScene = scenes.find(s => s.id === selectedSceneForEdit);

  // Load backgrounds from assets manifest
  const { assets: backgrounds } = useAssets({ category: 'backgrounds' });

  // PHASE 8: Define which sections show in Simple mode
  const simpleSections = ['Backgrounds', 'Text', 'Characters', 'Objets'];

  // Handler for background drag start
  const handleBackgroundDragStart = (e, backgroundUrl) => {
    const dragData = { type: 'background', backgroundUrl };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handler for prop (emoji object) drag start
  const handlePropDragStart = (e, emoji) => {
    const dragData = { type: 'prop', emoji };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handler for text box drag start
  const handleTextBoxDragStart = (e, textType) => {
    const textConfig = {
      h1: { defaultText: 'Heading', fontSize: 32, fontWeight: 'bold' },
      h2: { defaultText: 'Subheading', fontSize: 24, fontWeight: '600' },
      body: { defaultText: 'Paragraph text', fontSize: 16, fontWeight: 'normal' }
    };

    const config = textConfig[textType] || textConfig.body;
    const dragData = { type: 'textbox', ...config };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // PHASE 8: Helper to check if section should be shown
  const shouldShowSection = (sectionTitle) => {
    if (viewMode === 'advanced') return true;
    return simpleSections.includes(sectionTitle);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-elevated)]" role="complementary" aria-label="Panneau Ajouter éléments">
      {/* Header avec Mode Toggle (PHASE 8) */}
      <div className="flex-shrink-0 p-4 border-b-2 border-[var(--color-border-base)]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide">
            Ajouter éléments
          </h2>

          {/* Mode Toggle (PHASE 8) */}
          <div className="flex gap-1 bg-[var(--color-bg-base)] rounded-lg p-1 border border-[var(--color-border-base)]">
            <button
              onClick={() => setViewMode('simple')}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-all duration-200",
                viewMode === 'simple'
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
              )}
              aria-pressed={viewMode === 'simple'}
              aria-label="Mode Simple"
            >
              Simple
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-all duration-200",
                viewMode === 'advanced'
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
              )}
              aria-pressed={viewMode === 'advanced'}
              aria-label="Mode Avancé"
            >
              Avancé
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-muted)]">
          {viewMode === 'simple'
            ? 'Éléments essentiels uniquement'
            : 'Glisser les éléments vers le canvas'}
        </p>
      </div>

      {/* Sections (Accordion) - Filtered by mode (PHASE 8) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 1. Backgrounds */}
        {shouldShowSection('Backgrounds') && (
        <CollapsibleSection
          title="Backgrounds"
          icon={<Image className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {/* Browse Library Button */}
            <Button
              variant="token-primary"
              size="sm"
              onClick={() => onOpenModal?.('assets', { category: 'backgrounds' })}
              className="w-full justify-start"
              aria-label="Browse backgrounds library"
            >
              <Image className="w-4 h-4" aria-hidden="true" />
              Browse Backgrounds Library
            </Button>

            {/* Backgrounds Gallery (draggable thumbnails) */}
            {backgrounds && backgrounds.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                  Recent Backgrounds
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backgrounds.slice(0, 4).map((bg, idx) => (
                    <motion.div
                      key={bg.path || idx}
                      draggable
                      onDragStart={(e) => handleBackgroundDragStart(e, bg.path)}
                      className="relative aspect-video rounded-lg overflow-hidden border-2 border-[var(--color-border-base)] hover:border-[var(--color-primary)] cursor-grab active:cursor-grabbing transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Drag background ${bg.name} to canvas`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          // Keyboard fallback handled by browse button
                        }
                      }}
                    >
                      <img
                        src={bg.path}
                        alt={bg.name}
                        className="w-full h-full object-cover"
                        draggable="false"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                        <p className="text-white text-xs font-medium truncate w-full">
                          {bg.name}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-[var(--color-text-muted)]">
              Drag backgrounds to canvas or click Browse for more
            </p>
          </div>
        </CollapsibleSection>
        )}

        {shouldShowSection('Text') && (
        <CollapsibleSection
          title="Text"
          icon={<Type className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-2">
            <motion.div
              draggable
              onDragStart={(e) => handleTextBoxDragStart(e, 'h1')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start hover:bg-[var(--color-bg-hover)] cursor-grab active:cursor-grabbing pointer-events-none"
                aria-label="Drag heading text to canvas"
              >
                <span className="text-lg font-bold">H1</span>
                <span className="ml-2 text-xs">Heading</span>
              </Button>
            </motion.div>
            <motion.div
              draggable
              onDragStart={(e) => handleTextBoxDragStart(e, 'h2')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start hover:bg-[var(--color-bg-hover)] cursor-grab active:cursor-grabbing pointer-events-none"
                aria-label="Drag subheading text to canvas"
              >
                <span className="text-base font-semibold">H2</span>
                <span className="ml-2 text-xs">Subheading</span>
              </Button>
            </motion.div>
            <motion.div
              draggable
              onDragStart={(e) => handleTextBoxDragStart(e, 'body')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start hover:bg-[var(--color-bg-hover)] cursor-grab active:cursor-grabbing pointer-events-none"
                aria-label="Drag body text to canvas"
              >
                <span className="text-sm">Body</span>
                <span className="ml-2 text-xs">Paragraph</span>
              </Button>
            </motion.div>
            <p className="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-base)]">
              Drag text boxes to canvas
            </p>
          </div>
        </CollapsibleSection>
        )}

        {shouldShowSection('Characters') && (
        <CollapsibleSection
          title="Characters"
          icon={<Users className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            <CharacterMoodPicker
              onDragStart={(characterId, mood) => {
                logger.debug('Dragging character:', characterId, 'with mood:', mood);
              }}
            />

            {/* PHASE 8: Character Positioning Tools (Advanced mode only) */}
            {viewMode === 'advanced' && (
              <div className="pt-3 border-t border-[var(--color-border-base)]">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                  Positionnement Rapide
                </p>
                <CharacterPositioningTools
                  characterId={null} // TODO: Get from selected element in MainCanvas
                  sceneId={selectedScene?.id}
                />
              </div>
            )}

            <div className="pt-3 border-t border-[var(--color-border-base)]">
              <Button
                variant="token-accent"
                size="sm"
                onClick={() => onOpenModal?.('characters')}
                className="w-full justify-start"
                aria-label="Manage characters library"
              >
                <Users className="w-4 h-4" aria-hidden="true" />
                Manage Characters
              </Button>
            </div>
          </div>
        </CollapsibleSection>
        )}

        {shouldShowSection('Objets') && (
        <CollapsibleSection
          title="Objets"
          icon={<Box className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {['📦', '🚗', '🏠', '🌳', '⭐', '💡'].map((emoji, idx) => (
                <motion.button
                  key={idx}
                  draggable
                  onDragStart={(e) => handlePropDragStart(e, emoji)}
                  className="aspect-square flex items-center justify-center text-2xl bg-[var(--color-bg-base)] border-2 border-[var(--color-border-base)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg cursor-grab active:cursor-grabbing transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Glisser l'objet ${emoji} vers le canvas`}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Glissez des objets vers le canvas
            </p>
          </div>
        </CollapsibleSection>
        )}

        {shouldShowSection('Charts & Shapes') && (
        <CollapsibleSection
          title="Charts & Shapes"
          icon={<BarChart3 className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start hover:bg-[var(--color-bg-hover)]"
              aria-label="Add rectangle shape"
            >
              <div className="w-6 h-4 border-2 border-current rounded" aria-hidden="true" />
              <span className="ml-2 text-xs">Rectangle</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start hover:bg-[var(--color-bg-hover)]"
              aria-label="Add circle shape"
            >
              <div className="w-5 h-5 border-2 border-current rounded-full" aria-hidden="true" />
              <span className="ml-2 text-xs">Circle</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start hover:bg-[var(--color-bg-hover)]"
              aria-label="Add arrow shape"
            >
              <span className="text-lg" aria-hidden="true">→</span>
              <span className="ml-2 text-xs">Arrow</span>
            </Button>
            <p className="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-base)]">
              Click to add shapes to canvas
            </p>
          </div>
        </CollapsibleSection>
        )}

        {shouldShowSection('Audio') && (
        <CollapsibleSection
          title="Audio"
          icon={<Volume2 className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start hover:bg-[var(--color-bg-hover)]"
              aria-label="Add background music"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Background Music
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start hover:bg-[var(--color-bg-hover)]"
              aria-label="Add sound effect"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Sound Effects
            </Button>
            <p className="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-base)]">
              Add audio clips to scenes
            </p>
          </div>
        </CollapsibleSection>
        )}

        {shouldShowSection('Images') && (
        <CollapsibleSection
          title="Images"
          icon={<ImagePlus className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            <Button
              variant="token-primary"
              size="sm"
              onClick={() => onOpenModal?.('assets', { category: 'illustrations' })}
              className="w-full justify-start"
              aria-label="Browse images library"
            >
              <ImagePlus className="w-4 h-4" aria-hidden="true" />
              Browse Images Library
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start hover:bg-[var(--color-bg-hover)]"
              aria-label="Upload custom image"
            >
              <ImagePlus className="w-4 h-4" aria-hidden="true" />
              Upload Custom Image
            </Button>
            <p className="text-xs text-[var(--color-text-muted)]">
              Add images and illustrations to canvas
            </p>
          </div>
        </CollapsibleSection>
        )}

        {shouldShowSection('Animations & Effects') && (
        <CollapsibleSection
          title="Animations & Effects"
          icon={<Sparkles className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Pop', emoji: '💥' },
              { label: 'Fade', emoji: '🌫️' },
              { label: 'Slide', emoji: '📍' },
              { label: 'Bounce', emoji: '⚡' },
            ].map((effect) => (
              <button
                key={effect.label}
                className="flex flex-col items-center gap-1 p-3 bg-[var(--color-bg-base)] border-2 border-[var(--color-border-base)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg cursor-pointer transition-all hover:scale-105"
                aria-label={`Apply ${effect.label} animation`}
              >
                <span className="text-2xl" aria-hidden="true">{effect.emoji}</span>
                <span className="text-xs font-medium text-[var(--color-text-primary)]">{effect.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            Click to apply animations to elements
          </p>
        </CollapsibleSection>
        )}
      </div>

      {/* Footer Help */}
      <div className="flex-shrink-0 p-3 border-t-2 border-[var(--color-border-base)] text-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          💡 Drag elements directly to canvas
        </p>
      </div>
    </div>
  );
}

UnifiedPanel.propTypes = {
  onOpenModal: PropTypes.func
};
