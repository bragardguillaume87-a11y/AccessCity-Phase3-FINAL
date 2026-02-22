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
import { Plus, Copy, Trash2 } from 'lucide-react'
import type { SceneMetadata } from '@/types'

/**
 * SceneCard Props Interface
 */
interface SceneCardProps {
  scene: SceneMetadata
  index: number
  isSelected: boolean
  charactersCount: number
  onSelect: () => void
  onDuplicate: (sceneId: string) => void
  onDelete: (sceneId: string) => void
}

/**
 * SceneCard - Compact Powtoon-style thumbnail card
 *
 * Layout: Scene number overlay on thumbnail, title in tooltip.
 * No inline title, no badges — maximum screen real-estate efficiency.
 *
 * DnD note: PointerSensor uses activationConstraint { distance: 8 } so
 * a simple click fires onClick normally before drag activates.
 */
function SceneCard({ scene, index, isSelected, charactersCount, onSelect, onDuplicate, onDelete }: SceneCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      title={scene.title}
      className={`
        group relative rounded-xl overflow-hidden cursor-pointer transition-all
        ${isSelected
          ? 'ring-2 ring-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.4)]'
          : 'ring-1 ring-[var(--color-border-base)] hover:ring-[var(--color-border-hover)] shadow-sm hover:shadow-md'
        }
        ${isDragging ? 'shadow-xl' : ''}
      `}
      role="button"
      tabIndex={0}
      aria-label={`Scène ${index + 1}: ${scene.title}`}
      aria-pressed={isSelected}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {/* Thumbnail — real background if available, SVG fallback otherwise */}
      {/* Fixed height = compact filmstrip regardless of panel width */}
      <div className="relative w-full h-[72px]">
        {hasBackground ? (
          <img
            src={scene.backgroundUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 160 90"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <rect width="160" height="90" fill="var(--color-bg-base)" />
            <rect width="160" height="90" fill="var(--color-primary)" opacity="0.08" />
            <pattern id={`grid-${scene.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--color-border-base)" strokeWidth="0.5" opacity="0.4" />
            </pattern>
            <rect width="160" height="90" fill={`url(#grid-${scene.id})`} />
            {/* Character silhouettes — from sceneElementsStore (never scene.characters which is always []) */}
            {charactersCount > 0 && (
              <>
                <ellipse cx="45" cy="72" rx="14" ry="5" fill="var(--color-primary)" opacity="0.2" />
                <rect x="36" y="45" width="18" height="28" rx="4" fill="var(--color-accent)" opacity="0.6" />
                <circle cx="45" cy="40" r="9" fill="var(--color-accent)" opacity="0.7" />
                {charactersCount > 1 && (
                  <>
                    <ellipse cx="110" cy="72" rx="14" ry="5" fill="var(--color-primary)" opacity="0.2" />
                    <rect x="101" y="45" width="18" height="28" rx="4" fill="var(--color-secondary)" opacity="0.6" />
                    <circle cx="110" cy="40" r="9" fill="var(--color-secondary)" opacity="0.7" />
                  </>
                )}
              </>
            )}
          </svg>
        )}

        {/* Scene number — top-left overlay */}
        <span className="absolute top-1 left-1 text-xs font-bold leading-none px-1 py-0.5 rounded bg-black/60 text-white tabular-nums">
          {index + 1}
        </span>

        {/* Hover actions — top-right overlay */}
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="w-5 h-5 rounded bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
            title="Dupliquer"
            aria-label="Dupliquer la scène"
            onClick={(e) => { e.stopPropagation(); onDuplicate(scene.id) }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            className="w-5 h-5 rounded bg-black/60 hover:bg-red-600/90 text-white flex items-center justify-center"
            title="Supprimer"
            aria-label="Supprimer la scène"
            onClick={(e) => { e.stopPropagation(); onDelete(scene.id) }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Selected indicator — left cyan bar */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-400 rounded-l" />
        )}
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

  // Real character counts come from sceneElementsStore (not scene.characters which is always [])
  const elementsByScene = useSceneElementsStore(state => state.elementsByScene)

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

  const handleAddScene = () => {
    const newId = addScene()
    onSceneSelect(newId)
  }

  const handleDuplicateScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return

    const dialogues = useDialoguesStore.getState().getDialoguesByScene(sceneId)
    const elements = useSceneElementsStore.getState().getElementsForScene(sceneId)
    const newId = addScene()

    // Copier les métadonnées via scenesStore
    updateScene(newId, {
      title: `${scene.title} (copie)`,
      description: scene.description,
      backgroundUrl: scene.backgroundUrl,
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
      {/* Header compact */}
      <div className="flex-shrink-0 p-2 border-b border-[var(--color-border-base)]">
        <Button
          variant="token-primary"
          size="sm"
          onClick={handleAddScene}
          className="w-full h-9 text-[13px] font-semibold justify-center focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          aria-label="Ajouter une scène"
        >
          <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Scène
        </Button>
      </div>

      {/* Filmstrip — compact thumbnails, proportions Powtoon */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5" role="list" aria-label={`${scenes.length} scènes`}>
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
                  onSelect={() => onSceneSelect(scene.id)}
                  onDuplicate={handleDuplicateScene}
                  onDelete={handleDeleteScene}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
