import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useScenesStore } from '../../stores/index'
import { useDialoguesStore } from '@/stores/dialoguesStore'
import { useSceneElementsStore } from '@/stores/sceneElementsStore'
import { Button } from '@/components/ui/button'
import { Plus, Copy, Trash2, Film } from 'lucide-react'
import type { SceneMetadata } from '@/types'
import { useUIStore } from '@/stores/uiStore'
import { useState, useRef, useEffect, useMemo } from 'react'
import { NarrativeThreads } from './NarrativeThreads'

/** Cycle de backgrounds pour les scènes sans image (correspond aux classes scene-bg-* de studio.css) */
const BG_CYCLE = ['scene-bg-city', 'scene-bg-interior', 'scene-bg-night', 'scene-bg-forest'] as const

/** Palette couleurs pour la pastille de scène */
const COLOR_PALETTE = [
  '#6b5ce7', '#fa6d9a', '#4ade80', '#fbbf24',
  '#f87171', '#67e8f9', '#a78bfa', '#fb923c',
  '#e879f9', 'rgba(255,255,255,0.3)',
]

/**
 * SceneCard Props Interface
 */
interface SceneCardProps {
  scene: SceneMetadata
  index: number
  isSelected: boolean
  charactersCount: number
  dialogueCount: number
  onSelect: () => void
  onHover: (id: string | null) => void
  onUpdateColor: (sceneId: string, color: string) => void
  onDuplicate: (sceneId: string) => void
  onDelete: (sceneId: string) => void
  onOpenCinematic?: (sceneId: string) => void
}

/**
 * SceneCard — Template "Midnight Bloom" design
 *
 * Thumbnail 96px avec gradient par type, badges overlay,
 * compteur de dialogues, color picker, actions au survol.
 *
 * DnD note: PointerSensor uses activationConstraint { distance: 8 } so
 * a simple click fires onClick normally before drag activates.
 */
function SceneCard({
  scene, index, isSelected, charactersCount, dialogueCount,
  onSelect, onHover, onUpdateColor, onDuplicate, onDelete, onOpenCinematic
}: SceneCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const hasBackground = !!scene.backgroundUrl
  const isCinematic = scene.sceneType === 'cinematic'
  const bgClass = BG_CYCLE[index % BG_CYCLE.length]
  const sceneColor = scene.color ?? 'var(--color-primary)'

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-scene-id={scene.id}
      className={`scene-item${isSelected ? ' active' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Scène ${index + 1}: ${scene.title}`}
      aria-pressed={isSelected}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      onMouseEnter={() => onHover(scene.id)}
      onMouseLeave={() => onHover(null)}
      onDoubleClick={() => {
        if (isCinematic && onOpenCinematic) onOpenCinematic(scene.id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {/* ── Zone image principale ── */}
      <div className="scene-thumb">
        {hasBackground ? (
          <img
            src={scene.backgroundUrl}
            alt=""
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className={bgClass} />
        )}

        {/* Gradient overlay */}
        <div className="scene-overlay" aria-hidden="true" />

        {/* Numéro — badge prominent top-left */}
        <span className="scene-num" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Pulse actif — top-right */}
        {isSelected && <div className="scene-pulse" aria-hidden="true" />}

        {/* Badge cinématique OU color dot */}
        {isCinematic ? (
          <span
            className="scene-badge"
            title="Double-cliquer pour ouvrir l'éditeur cinématique"
            aria-hidden="true"
          >
            <Film size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
            CIN
          </span>
        ) : (
          <>
            <button
              className="scene-color-dot"
              style={{ background: sceneColor }}
              onClick={(e) => { e.stopPropagation(); setPickerOpen(o => !o) }}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="Changer la couleur de la scène"
            />
            {pickerOpen && (
              <div
                ref={pickerRef}
                className="scene-color-picker"
                onClick={(e) => e.stopPropagation()}
              >
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    className="scene-color-swatch"
                    style={{ background: c }}
                    onClick={() => { onUpdateColor(scene.id, c); setPickerOpen(false) }}
                    aria-label={`Couleur ${c}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions au survol — top-right */}
        <div className="scene-actions">
          {isCinematic && onOpenCinematic && (
            <button
              className="scene-action"
              title="Éditer la cinématique"
              aria-label="Ouvrir l'éditeur cinématique"
              onClick={(e) => { e.stopPropagation(); onOpenCinematic(scene.id) }}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Film size={10} />
            </button>
          )}
          <button
            className="scene-action"
            title="Dupliquer"
            aria-label="Dupliquer la scène"
            onClick={(e) => { e.stopPropagation(); onDuplicate(scene.id) }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Copy size={10} />
          </button>
          <button
            className="scene-action danger"
            title="Supprimer"
            aria-label="Supprimer la scène"
            onClick={(e) => { e.stopPropagation(); onDelete(scene.id) }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* ── Footer : couleur + nom + infos ── */}
      <div className="scene-footer">
        <div className="scene-color-label" style={{ background: sceneColor }} />
        <span className="scene-name">{scene.title}</span>
        <span className="scene-meta">{dialogueCount} dial.</span>
        {charactersCount > 0 && <span className="scene-meta">· {charactersCount} perso.</span>}
      </div>
    </div>
  )
}

/**
 * ScenesSidebar Props Interface
 */
export interface ScenesSidebarProps {
  scenes: SceneMetadata[]
  selectedSceneId?: string | null
  onSceneSelect: (sceneId: string) => void
}

/**
 * ScenesSidebar - Filmstrip premium avec NarrativeThreads SVG
 */
export default function ScenesSidebar({
  scenes,
  selectedSceneId,
  onSceneSelect
}: ScenesSidebarProps) {
  const addScene = useScenesStore(state => state.addScene)
  const deleteScene = useScenesStore(state => state.deleteScene)
  const updateScene = useScenesStore(state => state.updateScene)
  const reorderScenes = useScenesStore(state => state.reorderScenes)
  const setCinematicEditorOpen = useUIStore(state => state.setCinematicEditorOpen)

  // Real character counts come from sceneElementsStore (not scene.characters which is always [])
  const elementsByScene = useSceneElementsStore(state => state.elementsByScene)

  // Dialogue counts per scene + detection des scènes avec choix (pour NarrativeThreads)
  const dialoguesByScene = useDialoguesStore(state => state.dialoguesByScene)

  const scenesWithChoices = useMemo<Set<string>>(() => {
    const result = new Set<string>()
    Object.entries(dialoguesByScene).forEach(([sceneId, dialogues]) => {
      if (dialogues.some(d => d.choices && d.choices.length > 0)) {
        result.add(sceneId)
      }
    })
    return result
  }, [dialoguesByScene])

  // Hover tracking pour NarrativeThreads
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null)

  // Ref sur le container filmstrip (NarrativeThreads l'utilise pour les calculs DOM)
  const filmstripRef = useRef<HTMLDivElement>(null)

  // Add scene dropdown
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!addMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [addMenuOpen])

  // activationConstraint: drag only starts after 8px movement, so simple clicks still fire
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = scenes.findIndex(s => s.id === active.id)
      const newIndex = scenes.findIndex(s => s.id === over.id)
      reorderScenes(arrayMove(scenes, oldIndex, newIndex))
    }
  }

  const handleAddScene = (sceneType?: 'standard' | 'cinematic') => {
    const newId = addScene(sceneType)
    onSceneSelect(newId)
    setAddMenuOpen(false)
    if (sceneType === 'cinematic') {
      setCinematicEditorOpen(true, newId)
    }
  }

  const handleOpenCinematic = (sceneId: string) => {
    setCinematicEditorOpen(true, sceneId)
  }

  const handleUpdateColor = (sceneId: string, color: string) => {
    updateScene(sceneId, { color })
  }

  const handleDuplicateScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return

    const dialogues = useDialoguesStore.getState().getDialoguesByScene(sceneId)
    const elements = useSceneElementsStore.getState().getElementsForScene(sceneId)
    const newId = addScene(scene.sceneType)

    // Copier les métadonnées via scenesStore
    updateScene(newId, {
      title: `${scene.title} (copie)`,
      description: scene.description,
      backgroundUrl: scene.backgroundUrl,
      color: scene.color,
      cinematicEvents: scene.cinematicEvents ? [...scene.cinematicEvents] : undefined,
    })

    // Copier les dialogues via dialoguesStore (Post-Phase 3)
    if (dialogues.length > 0) {
      useDialoguesStore.getState().addDialogues(newId, dialogues)
    }

    // Copier les personnages via sceneElementsStore (Post-Phase 3)
    elements.characters.forEach(char => {
      useSceneElementsStore.getState().addCharacterToScene(newId, char.characterId, char.mood, char.position)
    })

    onSceneSelect(newId)
  }

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length === 1) return
    if (window.confirm('Supprimer cette scène ?')) {
      deleteScene(sceneId)
      if (selectedSceneId === sceneId) {
        const next = scenes.find(s => s.id !== sceneId)
        if (next) onSceneSelect(next.id)
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-elevated)]" role="complementary" aria-label="Filmstrip des scènes">
      {/* Header compact — bouton + menu déroulant type de scène */}
      <div className="flex-shrink-0 p-2 border-b border-[var(--color-border-base)] relative" ref={addMenuRef}>
        <Button
          variant="token-primary"
          size="sm"
          onClick={() => setAddMenuOpen(prev => !prev)}
          className="w-full h-9 text-[13px] font-semibold justify-center focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          aria-label="Ajouter une scène"
          aria-expanded={addMenuOpen}
          aria-haspopup="menu"
        >
          <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Scène
        </Button>

        {/* Dropdown menu */}
        {addMenuOpen && (
          <div
            className="absolute left-2 right-2 top-full mt-1 z-50 rounded-lg border border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] shadow-xl overflow-hidden"
            role="menu"
          >
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-[var(--color-bg-base)] text-[var(--color-text-primary)] transition-colors"
              onClick={() => handleAddScene('standard')}
              role="menuitem"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Scène normale</span>
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-[var(--color-bg-base)] text-[var(--color-text-primary)] transition-colors border-t border-[var(--color-border-base)]"
              onClick={() => handleAddScene('cinematic')}
              role="menuitem"
            >
              <Film className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <span>Cinématique</span>
            </button>
          </div>
        )}
      </div>

      {/* Filmstrip — position:relative pour le SVG NarrativeThreads en absolu */}
      <div
        ref={filmstripRef}
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{ position: 'relative' }}
        role="list"
        aria-label={`${scenes.length} scènes`}
      >
        {/* Fils narratifs SVG — derrière les scènes (z-index:0) */}
        {scenes.length > 1 && (
          <NarrativeThreads
            scenes={scenes}
            scenesWithChoices={scenesWithChoices}
            hoveredSceneId={hoveredSceneId}
            containerRef={filmstripRef}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={scenes.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {scenes.map((scene, index) => (
              <div key={scene.id} role="listitem" style={{ position: 'relative', zIndex: 1 }}>
                <SceneCard
                  scene={scene}
                  index={index}
                  isSelected={selectedSceneId === scene.id}
                  charactersCount={elementsByScene[scene.id]?.characters?.length ?? 0}
                  dialogueCount={dialoguesByScene[scene.id]?.length ?? 0}
                  onSelect={() => onSceneSelect(scene.id)}
                  onHover={setHoveredSceneId}
                  onUpdateColor={handleUpdateColor}
                  onDuplicate={handleDuplicateScene}
                  onDelete={handleDeleteScene}
                  onOpenCinematic={handleOpenCinematic}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>

    </div>
  )
}
