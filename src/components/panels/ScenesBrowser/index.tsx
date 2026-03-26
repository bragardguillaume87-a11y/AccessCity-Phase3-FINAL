/**
 * ScenesBrowser — Overlay fullscreen "Storyboard" pour naviguer entre les scènes.
 * Remplace l'onglet Scènes dans le LeftPanel.
 *
 * Design : cartes 16:9 (storyboard) · vignette gradient · badge monospace · strip couleur ·
 *          corner fold · stagger entry · drag-to-reorder (dnd-kit rectSortingStrategy) ·
 *          framer-motion layout spring pour la réorganisation.
 *
 * Conseillers : Will Wright §4.2 (taux utilisation) · Nijman §8 (game feel) ·
 *               Quilez §14 (badge monospace) · Norman §9 (affordances)
 */
import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Plus } from 'lucide-react';
import type { SceneMetadata } from '@/types';
import { useScenesStore } from '@/stores/index';
import { useUIStore } from '@/stores/uiStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';

// ── Gradients procéduraux pour les scènes sans background (Quilez §14.3) ─────
const BG_GRADIENTS = [
  'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0a0a0a 0%, #1a1a3e 50%, #2d1b69 100%)',
  'linear-gradient(135deg, #0f2417 0%, #1a3a2a 50%, #0d4a2a 100%)',
] as const;

// ── EMPTY_* module-level pour fallbacks stables (Acton §15.4) ─────────────────
const EMPTY_CHARS: never[] = [];

// ── BrowserSceneCard ──────────────────────────────────────────────────────────

interface BrowserSceneCardProps {
  scene: SceneMetadata;
  index: number;
  isSelected: boolean;
  dialogueCount: number;
  charactersCount: number;
  onSelect: () => void;
}

function BrowserSceneCard({
  scene,
  index,
  isSelected,
  dialogueCount,
  charactersCount,
  onSelect,
}: BrowserSceneCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  });

  const sceneColor = scene.color ?? 'var(--color-primary)';
  const bgGradient = BG_GRADIENTS[index % BG_GRADIENTS.length];
  const isCinematic = scene.sceneType === 'cinematic';

  return (
    // Outer div — dnd-kit positioning (transform + transition)
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      {/* Inner motion.div — visual card (framer-motion layout + hover/tap) */}
      <motion.div
        layout
        layoutId={`browser-scene-${scene.id}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
        transition={{
          layout: { type: 'spring', stiffness: 380, damping: 28 },
          opacity: { duration: 0.22, delay: index * 0.04 },
          y: { type: 'spring', stiffness: 300, damping: 28, delay: index * 0.04 },
        }}
        whileHover={
          isDragging
            ? {}
            : { y: -6, scale: 1.02, transition: { type: 'spring', stiffness: 380, damping: 22 } }
        }
        whileTap={isDragging ? {} : { scale: 0.97, y: 0, transition: { duration: 0.1 } }}
        onClick={onSelect}
        role="button"
        tabIndex={-1}
        aria-label={`Scène ${index + 1}: ${scene.title}${isSelected ? ' (active)' : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        style={{
          borderRadius: 10,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'pointer',
          // Left color strip — index card metaphor (Highland 2 style)
          borderLeft: `3px solid ${sceneColor}`,
          border: isSelected
            ? `2px solid var(--color-primary)`
            : `2px solid rgba(255,255,255,0.07)`,
          borderLeftColor: sceneColor,
          borderLeftWidth: 3,
          boxShadow: isSelected
            ? '0 0 0 1px var(--color-primary-40), 0 8px 24px rgba(139,92,246,0.25)'
            : '0 4px 16px rgba(0,0,0,0.45)',
          background: 'var(--color-bg-elevated)',
        }}
      >
        {/* ── Thumbnail 16:9 ── */}
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
          {scene.backgroundUrl ? (
            <img
              src={scene.backgroundUrl}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{ position: 'absolute', inset: 0, background: bgGradient }}
              aria-hidden="true"
            />
          )}

          {/* Vignette — standard poster/still (Will Wright §4.4) */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 50%, transparent 80%)',
            }}
          />

          {/* Scene number — clapperboard badge (font monospace, Quilez §14) */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 8,
              left: 10,
              fontFamily: 'var(--font-family-mono)',
              fontSize: 18,
              fontWeight: 700,
              color: 'white',
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* Active indicator */}
          {isSelected && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 8,
                right: 10,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                boxShadow: '0 0 8px var(--color-primary)',
              }}
            />
          )}

          {/* Cinematic badge */}
          {isCinematic && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                background: 'rgba(0,0,0,0.72)',
                color: 'rgba(255,255,255,0.88)',
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 3,
                letterSpacing: '0.06em',
              }}
            >
              CIN
            </span>
          )}
        </div>

        {/* ── Paper footer ── */}
        <div
          style={{
            padding: '10px 12px 10px',
            position: 'relative',
            background: 'rgba(238,240,248,0.025)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {scene.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: 10 }}>
            <span>💬 {dialogueCount}</span>
            {charactersCount > 0 && <span>👤 {charactersCount}</span>}
          </div>

          {/* Corner fold — index card metaphor (CSS triangle) */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 0 14px 14px',
              borderColor: 'transparent transparent rgba(255,255,255,0.07) transparent',
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// ── ScenesBrowser ─────────────────────────────────────────────────────────────

export function ScenesBrowser() {
  const scenesBrowserOpen = useUIStore((s) => s.scenesBrowserOpen);
  const setScenesBrowserOpen = useUIStore((s) => s.setScenesBrowserOpen);
  const scenes = useScenesStore((s) => s.scenes);
  const addScene = useScenesStore((s) => s.addScene);
  const reorderScenes = useScenesStore((s) => s.reorderScenes);
  const selectedSceneId = useUIStore((s) => s.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore((s) => s.setSelectedSceneForEdit);
  const elementsByScene = useSceneElementsStore((s) => s.elementsByScene);
  const dialoguesByScene = useDialoguesStore((s) => s.dialoguesByScene);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Handlers (getState() dans callbacks uniquement — invariant Phase 3) ────
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const currentScenes = useScenesStore.getState().scenes;
        const oldIndex = currentScenes.findIndex((s) => s.id === active.id);
        const newIndex = currentScenes.findIndex((s) => s.id === over.id);
        reorderScenes(arrayMove(currentScenes, oldIndex, newIndex));
      }
    },
    [reorderScenes]
  );

  const handleSceneClick = useCallback(
    (sceneId: string) => {
      setSelectedSceneForEdit(sceneId);
      setScenesBrowserOpen(false);
    },
    [setSelectedSceneForEdit, setScenesBrowserOpen]
  );

  const handleAddScene = useCallback(() => {
    const id = addScene('standard');
    if (id) setSelectedSceneForEdit(id);
    setScenesBrowserOpen(false);
  }, [addScene, setSelectedSceneForEdit, setScenesBrowserOpen]);

  // ESC pour fermer
  useEffect(() => {
    if (!scenesBrowserOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setScenesBrowserOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [scenesBrowserOpen, setScenesBrowserOpen]);

  return (
    <AnimatePresence>
      {scenesBrowserOpen && (
        <motion.div
          key="scenes-browser"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            background: 'rgba(3, 7, 18, 0.97)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          aria-modal="true"
          role="dialog"
          aria-label="Navigateur de scènes — Storyboard"
        >
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, delay: 0.06 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '20px 28px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              gap: 14,
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                📽 Storyboard
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                {scenes.length} scène{scenes.length !== 1 ? 's' : ''} · Glisser pour réorganiser ·
                Échap pour fermer
              </p>
            </div>

            <motion.button
              onClick={handleAddScene}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
              aria-label="Ajouter une nouvelle scène"
            >
              <Plus size={14} /> Nouvelle scène
            </motion.button>

            <motion.button
              onClick={() => setScenesBrowserOpen(false)}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.07)',
                color: 'var(--color-text-muted)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
              }}
              aria-label="Fermer le navigateur (Échap)"
            >
              <X size={16} />
            </motion.button>
          </motion.div>

          {/* ── Grid 2 colonnes ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 32px' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={scenes.map((s) => s.id)} strategy={rectSortingStrategy}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 20,
                  }}
                >
                  {scenes.map((scene, index) => (
                    <BrowserSceneCard
                      key={scene.id}
                      scene={scene}
                      index={index}
                      isSelected={scene.id === selectedSceneId}
                      dialogueCount={dialoguesByScene[scene.id]?.length ?? 0}
                      charactersCount={
                        elementsByScene[scene.id]?.characters?.length ?? EMPTY_CHARS.length
                      }
                      onSelect={() => handleSceneClick(scene.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
