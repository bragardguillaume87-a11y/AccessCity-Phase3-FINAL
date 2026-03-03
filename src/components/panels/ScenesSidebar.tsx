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
import { useState, useRef, useEffect } from 'react'

/** Cycle de backgrounds pour les scènes sans image (correspond aux classes scene-bg-* de studio.css) */
const BG_CYCLE = ['scene-bg-city', 'scene-bg-interior', 'scene-bg-night', 'scene-bg-forest'] as const

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
  onDuplicate: (sceneId: string) => void
  onDelete: (sceneId: string) => void
  onOpenCinematic?: (sceneId: string) => void
}

/**
 * SceneCard — Template "Midnight Bloom" design
 *
 * Thumbnail 96px avec gradient par type, badges overlay,
 * compteur de dialogues, actions au survol.
 *
 * DnD note: PointerSensor uses activationConstraint { distance: 8 } so
 * a simple click fires onClick normally before drag activates.
 */
function SceneCard({ scene, index, isSelected, charactersCount, dialogueCount, onSelect, onDuplicate, onDelete, onOpenCinematic }: SceneCardProps) {
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
      {/* Thumbnail 96px */}
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

        {/* Overlay gradient bas→transparent */}
        <div className="scene-overlay" aria-hidden="true" />

        {/* Numéro de scène — top-left */}
        <span className="scene-num">{index + 1}</span>

        {/* Indicateur actif — top-right (pulse violet) */}
        {isSelected && <div className="scene-pulse" aria-hidden="true" />}

        {/* Badge cinématique — top-right (non-sélectionné, masqué au hover) */}
        {isCinematic && !isSelected && (
          <span
            className="scene-badge"
            title="Double-cliquer pour ouvrir l'éditeur cinématique"
            aria-hidden="true"
          >
            <Film size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
            CIN
          </span>
        )}

        {/* Silhouettes personnages */}
        {charactersCount > 0 && (
          <div className="scene-chars" aria-hidden="true">
            <div className="scene-char sc1" />
            {charactersCount > 1 && <div className="scene-char sc2" />}
          </div>
        )}

        {/* Compteur de dialogues — bas droite */}
        <span className="scene-dial-count">{dialogueCount} dial.</span>

        {/* Actions au survol */}
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

      {/* Footer — pastille couleur + titre */}
      <div className="scene-footer">
        <div className="scene-color-label" style={{ background: 'var(--color-primary)' }} />
        <span className="scene-name">{scene.title}</span>
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
 * ScenesSidebar - Compact Powtoon-style scene filmstrip
 *
 * Ultra-compact column of scene thumbnails.
 * Scene title visible on hover via native tooltip.
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

  // Dialogue counts per scene
  const dialoguesByScene = useDialoguesStore(state => state.dialoguesByScene)

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

      {/* Filmstrip — thumbnails premium 96px */}
      <div className="flex-1 overflow-y-auto p-2" role="list" aria-label={`${scenes.length} scènes`}>
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
              <div key={scene.id} role="listitem">
                <SceneCard
                  scene={scene}
                  index={index}
                  isSelected={selectedSceneId === scene.id}
                  charactersCount={elementsByScene[scene.id]?.characters?.length ?? 0}
                  dialogueCount={dialoguesByScene[scene.id]?.length ?? 0}
                  onSelect={() => onSceneSelect(scene.id)}
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
