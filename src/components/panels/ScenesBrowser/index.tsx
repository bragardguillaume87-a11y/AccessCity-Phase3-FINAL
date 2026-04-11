/**
 * ScenesBrowser — Film strip horizontal en bas de l'écran.
 * Remplace l'overlay fullscreen par une bande style timeline vidéo.
 *
 * Design : cartes 16:9 compactes (~110px large) · badge numéro · strip couleur ·
 *          hover actions (couleur/copier/supprimer) · DnD horizontal · spring physics ·
 *          slide depuis le bas (y: 0 → close)
 *
 * Conseillers : Will Wright §4.2 (densité info) · Nijman §8 (game feel) ·
 *               Norman §9.1 (affordances) · Muratori §13 (pas d'over-abstract)
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Plus, Copy, Trash2, Check, GripVertical } from 'lucide-react';
import type { SceneMetadata } from '@/types';
import { useScenesStore } from '@/stores/index';
import { useUIStore } from '@/stores/uiStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { useSelectionStore } from '@/stores/selectionStore';

// ── Gradients procéduraux pour les scènes sans background (Quilez §14.3) ─────
const BG_GRADIENTS = [
  'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
  'linear-gradient(135deg, #0a0a0a 0%, #2d1b69 100%)',
  'linear-gradient(135deg, #0f2417 0%, #0d4a2a 100%)',
  'linear-gradient(135deg, #1a0a0a 0%, #4a1a1a 100%)',
  'linear-gradient(135deg, #0a1a2a 0%, #1a4a6a 100%)',
] as const;

// ── Palette couleurs ──────────────────────────────────────────────────────────
const COLOR_PALETTE = [
  '#6b5ce7',
  '#fa6d9a',
  '#4ade80',
  '#fbbf24',
  '#f87171',
  '#67e8f9',
  '#a78bfa',
  '#fb923c',
  '#e879f9',
  'rgba(255,255,255,0.3)',
];

// Dimensions de la carte dans le filmstrip
const CARD_W = 112;
const THUMB_H = 63; // 16:9

// ── EMPTY_* module-level (Acton §15.4) ───────────────────────────────────────
const EMPTY_CHARS: never[] = [];

// ── FilmCard ──────────────────────────────────────────────────────────────────

interface FilmCardProps {
  scene: SceneMetadata;
  index: number;
  isSelected: boolean;
  isLastScene: boolean;
  dialogueCount: number;
  charactersCount: number;
  onSelect: (id: string) => void;
  onDuplicate: (sceneId: string) => void;
  onDelete: (sceneId: string) => void;
  onUpdateColor: (sceneId: string, color: string) => void;
}

function FilmCard({
  scene,
  index,
  isSelected,
  isLastScene,
  dialogueCount,
  charactersCount,
  onSelect,
  onDuplicate,
  onDelete,
  onUpdateColor,
}: FilmCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  });

  const sceneColor = scene.color ?? 'var(--color-primary)';
  const bgGradient = BG_GRADIENTS[index % BG_GRADIENTS.length];
  const isCinematic = scene.sceneType === 'cinematic';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        flexShrink: 0,
        width: CARD_W,
      }}
      {...attributes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPickerOpen(false);
        setConfirmingDelete(false);
      }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: isDragging ? 0.35 : 1, scale: 1 }}
        transition={{
          layout: { type: 'spring', stiffness: 380, damping: 28 },
          opacity: { duration: 0.18, delay: index * 0.03 },
          scale: { type: 'spring', stiffness: 300, damping: 28, delay: index * 0.03 },
        }}
        whileHover={
          isDragging
            ? {}
            : { y: -4, scale: 1.04, transition: { type: 'spring', stiffness: 400, damping: 22 } }
        }
        whileTap={isDragging ? {} : { scale: 0.96, y: 0 }}
        onClick={() => onSelect(scene.id)}
        role="button"
        tabIndex={0}
        aria-label={`Scène ${index + 1}: ${scene.title}${isSelected ? ' (active)' : ''}`}
        aria-pressed={isSelected}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(scene.id);
          }
        }}
        style={{
          borderRadius: 7,
          overflow: 'visible',
          cursor: isDragging ? 'grabbing' : 'pointer',
          outline: 'none',
          position: 'relative',
        }}
      >
        {/* ── Drag handle (GripVertical) — seul élément avec {...listeners} ── */}
        <div
          {...listeners}
          title="Glisser pour réordonner"
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            zIndex: 10,
            opacity: isHovered ? 0.7 : 0,
            transition: 'opacity 0.15s ease',
            cursor: isDragging ? 'grabbing' : 'grab',
            color: 'var(--color-text-primary)',
            lineHeight: 0,
            padding: 2,
            borderRadius: 3,
          }}
        >
          <GripVertical size={12} />
        </div>

        {/* ── Active glow ring ── */}
        {isSelected && (
          <motion.div
            layoutId={`film-active-ring-${scene.id}`}
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: 9,
              border: '2px solid var(--color-primary)',
              boxShadow: '0 0 12px var(--color-primary-glow)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}

        {/* ── Thumbnail ── */}
        <div
          style={{
            position: 'relative',
            width: CARD_W,
            height: THUMB_H,
            borderRadius: 7,
            overflow: 'hidden',
            borderLeft: `3px solid ${sceneColor}`,
          }}
        >
          {/* Background */}
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

          {/* Vignette */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
            }}
          />

          {/* Scene number badge */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 4,
              left: 5,
              fontFamily: 'var(--font-family-mono)',
              fontSize: 11,
              fontWeight: 700,
              color: 'white',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              lineHeight: 1,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* Cinematic badge */}
          {isCinematic && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: 3,
                right: 4,
                background: 'rgba(0,0,0,0.75)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 7,
                fontWeight: 700,
                padding: '1px 4px',
                borderRadius: 2,
                letterSpacing: '0.05em',
              }}
            >
              CIN
            </span>
          )}

          {/* ── Hover actions overlay ── */}
          <AnimatePresence>
            {isHovered && !isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  padding: 4,
                  gap: 3,
                  background: 'rgba(0,0,0,0.32)',
                }}
              >
                {/* Color dot */}
                {!isCinematic && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerOpen((o) => !o);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      aria-label="Couleur"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: sceneColor,
                        border: '1.5px solid rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        padding: 0,
                      }}
                    />
                    {/* Color palette — portée vers le haut */}
                    {pickerOpen && (
                      <div
                        role="presentation"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          bottom: 20,
                          right: 0,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: 4,
                          padding: 7,
                          background: 'rgba(16,19,30,0.98)',
                          borderRadius: 7,
                          border: '1px solid rgba(255,255,255,0.12)',
                          boxShadow: '0 -8px 24px rgba(0,0,0,0.7)',
                          zIndex: 20,
                        }}
                      >
                        {COLOR_PALETTE.map((c) => (
                          <button
                            key={c}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateColor(scene.id, c);
                              setPickerOpen(false);
                            }}
                            aria-label={`Couleur ${c}`}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 3,
                              background: c,
                              border:
                                c === sceneColor
                                  ? '2px solid white'
                                  : '1px solid rgba(255,255,255,0.2)',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Copy */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(scene.id);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  title="Dupliquer"
                  aria-label="Dupliquer la scène"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    padding: 0,
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: 'white',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Copy size={9} />
                </button>

                {/* Delete — normal ou confirmation inline */}
                {!isLastScene && (
                  <AnimatePresence mode="wait" initial={false}>
                    {!confirmingDelete ? (
                      <motion.button
                        key="trash"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingDelete(true);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        title="Supprimer"
                        aria-label="Supprimer la scène"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          padding: 0,
                          background: 'rgba(239,68,68,0.2)',
                          border: '1px solid rgba(239,68,68,0.45)',
                          color: 'var(--color-danger)',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={9} />
                      </motion.button>
                    ) : (
                      <motion.div
                        key="confirm"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.1 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', gap: 2, flexShrink: 0 }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(scene.id);
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                          title="Confirmer la suppression"
                          aria-label="Confirmer la suppression"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            padding: 0,
                            background: 'rgba(239,68,68,0.5)',
                            border: '1px solid rgba(239,68,68,0.8)',
                            color: 'white',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={9} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingDelete(false);
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                          title="Annuler"
                          aria-label="Annuler la suppression"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            padding: 0,
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            color: 'white',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <X size={9} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Title row ── */}
        <div
          style={{
            padding: '4px 4px 0',
            width: CARD_W,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            {scene.title}
          </div>
          <div
            style={{ fontSize: 9, color: 'var(--color-text-disabled)', display: 'flex', gap: 5 }}
          >
            <span>💬 {dialogueCount}</span>
            {charactersCount > 0 && <span>👤 {charactersCount}</span>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add scene button (filmstrip) ─────────────────────────────────────────────

function AddSceneButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{
        scale: 1.04,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 22 },
      }}
      whileTap={{ scale: 0.94, y: 0 }}
      aria-label="Ajouter une nouvelle scène"
      style={{
        flexShrink: 0,
        width: CARD_W,
        height: THUMB_H,
        borderRadius: 7,
        border: '1.5px dashed var(--color-primary-40)',
        background: 'var(--color-primary-subtle)',
        color: 'var(--color-primary)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        alignSelf: 'flex-start',
      }}
    >
      <Plus size={18} />
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.03em' }}>Nouvelle scène</span>
    </motion.button>
  );
}

// ── ScenesBrowser ─────────────────────────────────────────────────────────────

const STRIP_HEIGHT = 110;

export function ScenesBrowser() {
  const scenesBrowserOpen = useUIStore((s) => s.scenesBrowserOpen);
  const setScenesBrowserOpen = useUIStore((s) => s.setScenesBrowserOpen);
  const scenes = useScenesStore((s) => s.scenes);
  const addScene = useScenesStore((s) => s.addScene);
  const deleteScene = useScenesStore((s) => s.deleteScene);
  const updateScene = useScenesStore((s) => s.updateScene);
  const reorderScenes = useScenesStore((s) => s.reorderScenes);
  const selectedSceneId = useUIStore((s) => s.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore((s) => s.setSelectedSceneForEdit);
  const elementsByScene = useSceneElementsStore((s) => s.elementsByScene);
  const dialoguesByScene = useDialoguesStore((s) => s.dialoguesByScene);

  // MouseSensor + TouchSensor au lieu de PointerSensor :
  // PointerSensor appelle preventDefault() sur pointerdown → bloque les clics sur les cartes.
  // MouseSensor et TouchSensor ne bloquent pas les clics natifs.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
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
      useSelectionStore.getState().selectScene(sceneId);
    },
    [setSelectedSceneForEdit]
  );

  const handleAddScene = useCallback(() => {
    const id = addScene('standard');
    if (id) setSelectedSceneForEdit(id);
    setScenesBrowserOpen(false);
  }, [addScene, setSelectedSceneForEdit, setScenesBrowserOpen]);

  const handleUpdateColor = useCallback(
    (sceneId: string, color: string) => updateScene(sceneId, { color }),
    [updateScene]
  );

  const handleDuplicate = useCallback(
    (sceneId: string) => {
      const scene = useScenesStore.getState().scenes.find((s) => s.id === sceneId);
      if (!scene) return;
      const dialogues = useDialoguesStore.getState().getDialoguesByScene(sceneId);
      const elements = useSceneElementsStore.getState().getElementsForScene(sceneId);
      const newId = addScene(scene.sceneType);
      updateScene(newId, {
        title: `${scene.title} (copie)`,
        description: scene.description,
        backgroundUrl: scene.backgroundUrl,
        color: scene.color,
        cinematicEvents: scene.cinematicEvents ? [...scene.cinematicEvents] : undefined,
      });
      if (dialogues.length > 0) useDialoguesStore.getState().addDialogues(newId, dialogues);
      elements.characters.forEach((char) => {
        useSceneElementsStore
          .getState()
          .addCharacterToScene(newId, char.characterId, char.mood, char.position);
      });
      setSelectedSceneForEdit(newId);
    },
    [addScene, updateScene, setSelectedSceneForEdit]
  );

  const handleDelete = useCallback(
    (sceneId: string) => {
      const currentScenes = useScenesStore.getState().scenes;
      if (currentScenes.length === 1) return;
      deleteScene(sceneId);
      if (selectedSceneId === sceneId) {
        const next = currentScenes.find((s) => s.id !== sceneId);
        if (next) setSelectedSceneForEdit(next.id);
      }
    },
    [deleteScene, selectedSceneId, setSelectedSceneForEdit]
  );

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
          key="film-strip"
          initial={{ y: STRIP_HEIGHT + 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: STRIP_HEIGHT + 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1400,
            background: 'rgba(8, 10, 20, 0.97)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--color-primary-40)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
          }}
          role="region"
          aria-label="Film strip — navigation entre les scènes"
        >
          {/* ── Top bar ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px 4px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Label */}
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
              }}
            >
              STORYBOARD
            </span>
            <span style={{ fontSize: 9, color: 'var(--color-text-disabled)' }}>
              {scenes.length} scène{scenes.length !== 1 ? 's' : ''} · Glisser pour réorganiser ·
              Échap
            </span>
            <div style={{ flex: 1 }} />

            <motion.button
              onClick={() => setScenesBrowserOpen(false)}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: 5,
                padding: 0,
                background: 'rgba(185,28,28,0.18)',
                border: '1px solid rgba(220,60,60,0.35)',
                color: 'rgba(248,113,113,0.9)',
                cursor: 'pointer',
              }}
              aria-label="Fermer (Échap)"
            >
              <X size={12} />
            </motion.button>
          </div>

          {/* ── Film strip scroll area ── */}
          <div
            style={{
              overflowX: 'auto',
              overflowY: 'visible',
              padding: '8px 14px 10px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(139,92,246,0.3) transparent',
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={scenes.map((s) => s.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    minWidth: 'max-content',
                  }}
                >
                  {scenes.map((scene, index) => (
                    <FilmCard
                      key={scene.id}
                      scene={scene}
                      index={index}
                      isSelected={scene.id === selectedSceneId}
                      isLastScene={scenes.length === 1}
                      dialogueCount={dialoguesByScene[scene.id]?.length ?? 0}
                      charactersCount={
                        elementsByScene[scene.id]?.characters?.length ?? EMPTY_CHARS.length
                      }
                      onSelect={handleSceneClick}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                      onUpdateColor={handleUpdateColor}
                    />
                  ))}

                  {/* Séparateur vertical */}
                  <div
                    style={{
                      width: 1,
                      height: THUMB_H,
                      background: 'rgba(255,255,255,0.06)',
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                    }}
                  />

                  <AddSceneButton onClick={handleAddScene} />
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
