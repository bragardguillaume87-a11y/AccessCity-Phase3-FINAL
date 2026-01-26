import * as React from "react"
import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Plus, Copy, Trash2, GripVertical, Film } from 'lucide-react'
import type { Scene } from '@/types'

/**
 * SceneCard Props Interface
 */
interface SceneCardProps {
  scene: Scene
  isSelected: boolean
  onSelect: () => void
  onDuplicate: (sceneId: string) => void
  onDelete: (sceneId: string) => void
}

/**
 * SceneCard - Individual scene card (PowerPoint-style) with drag handle
 */
function SceneCard({ scene, isSelected, onSelect, onDuplicate, onDelete }: SceneCardProps) {
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
    opacity: isDragging ? 0.5 : 1,
  }

  const dialoguesCount = scene.dialogues?.length || 0
  const charactersCount = scene.characters?.length || 0

  // Simplified SVG thumbnail (rectangle + character/dialogue icons)
  const SceneThumbnail = () => (
    <svg
      className="w-full h-20 rounded-md bg-[var(--color-bg-base)] border border-[var(--color-border-base)]"
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Background pattern */}
      <rect width="160" height="90" fill="var(--color-bg-base)" />
      <rect width="160" height="90" fill="var(--color-primary)" opacity="0.1" />

      {/* Grid pattern */}
      <pattern id={`grid-${scene.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--color-border-base)" strokeWidth="0.5" opacity="0.3" />
      </pattern>
      <rect width="160" height="90" fill={`url(#grid-${scene.id})`} />

      {/* Characters (simple circles) */}
      {charactersCount > 0 && (
        <>
          <circle cx="40" cy="60" r="12" fill="var(--color-accent)" opacity="0.8" />
          {charactersCount > 1 && <circle cx="70" cy="60" r="12" fill="var(--color-secondary)" opacity="0.8" />}
          {charactersCount > 2 && <circle cx="100" cy="60" r="12" fill="var(--color-pink)" opacity="0.8" />}
        </>
      )}

      {/* Film icon for dialogues */}
      {dialoguesCount > 0 && (
        <g transform="translate(130, 70)">
          <rect width="20" height="15" rx="2" fill="var(--color-primary)" opacity="0.6" />
          <text x="10" y="11" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
            {dialoguesCount}
          </text>
        </g>
      )}
    </svg>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative rounded-lg border-2 transition-all
        ${isSelected
          ? 'border-t-4 border-t-cyan-500 border-x-cyan-500/50 border-b-cyan-500/50 bg-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
          : 'border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-hover)]'
        }
        ${isDragging ? 'shadow-lg cursor-grabbing' : 'cursor-pointer'}
      `}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Scene: ${scene.title}, ${dialoguesCount} dialogues, ${charactersCount} characters`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--color-bg-base)]/80"
        aria-label="Drag to reorder scene"
        tabIndex={-1}
      >
        <GripVertical className="w-4 h-4 text-[var(--color-text-muted)]" />
      </div>

      <div className="p-3 space-y-2">
        {/* Thumbnail */}
        <SceneThumbnail />

        {/* Title (editable inline) */}
        <input
          type="text"
          value={scene.title}
          onChange={(e) => {
            e.stopPropagation()
            useScenesStore.getState().updateScene(scene.id, { title: e.target.value })
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-transparent text-[var(--color-text-primary)] text-sm font-semibold border border-transparent rounded focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)] focus:outline-none transition-colors"
          aria-label="Scene title"
        />

        {/* Badges (dialogues + characters count) */}
        <div className="flex gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-bg-base)]">
            <Film className="w-3 h-3" aria-hidden="true" />
            {dialoguesCount} {dialoguesCount === 1 ? 'dialogue' : 'dialogues'}
          </span>
          {charactersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--color-bg-base)]">
              {charactersCount} {charactersCount === 1 ? 'char' : 'chars'}
            </span>
          )}
        </div>

        {/* Action Buttons (hover reveal) */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate(scene.id)
            }}
            className="h-7 px-2 text-xs hover:bg-[var(--color-bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            aria-label="Duplicate scene"
          >
            <Copy className="w-3 h-3 mr-1" aria-hidden="true" />
            Duplicate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(scene.id)
            }}
            className="h-7 px-2 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]"
            aria-label="Delete scene"
          >
            <Trash2 className="w-3 h-3 mr-1" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * ScenesSidebar Props Interface
 */
export interface ScenesSidebarProps {
  scenes: Scene[]
  selectedSceneId?: string | null
  onSceneSelect: (sceneId: string) => void
}

/**
 * ScenesSidebar - Left sidebar with PowerPoint-style scene cards + drag & drop
 * Replaces ExplorerPanel for Powtoon-inspired UX
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

  // Drag & drop sensors (keyboard + pointer)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = scenes.findIndex(s => s.id === active.id)
      const newIndex = scenes.findIndex(s => s.id === over.id)

      const reorderedScenes = arrayMove(scenes, oldIndex, newIndex)
      reorderScenes(reorderedScenes)
    }
  }

  const handleAddScene = () => {
    const newId = addScene()
    onSceneSelect(newId)
  }

  const handleDuplicateScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return

    const newId = addScene()
    updateScene(newId, {
      title: `${scene.title} (copy)`,
      description: scene.description,
      backgroundUrl: scene.backgroundUrl,
      dialogues: [...(scene.dialogues || [])],
      characters: [...(scene.characters || [])],
    })
    onSceneSelect(newId)
  }

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length === 1) {
      alert('Cannot delete the last scene')
      return
    }
    if (window.confirm('Delete this scene? This action cannot be undone.')) {
      deleteScene(sceneId)
      // Select first remaining scene
      if (selectedSceneId === sceneId && scenes.length > 0) {
        const nextScene = scenes.find(s => s.id !== sceneId)
        if (nextScene) onSceneSelect(nextScene.id)
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-elevated)]" role="complementary" aria-label="Scenes sidebar">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--color-border-base)]">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide mb-3">
          Scenes ({scenes.length})
        </h2>
        <Button
          variant="token-primary"
          size="sm"
          onClick={handleAddScene}
          className="w-full justify-start focus-visible:ring-4 focus-visible:ring-[var(--color-border-focus)]"
          aria-label="Add new scene"
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          New Scene
        </Button>
      </div>

      {/* Scene Cards (Sortable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={scenes.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                isSelected={selectedSceneId === scene.id}
                onSelect={() => onSceneSelect(scene.id)}
                onDuplicate={handleDuplicateScene}
                onDelete={handleDeleteScene}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Footer (optional) */}
      <div className="flex-shrink-0 p-3 border-t border-[var(--color-border-base)] text-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          Drag cards to reorder
        </p>
      </div>
    </div>
  )
}
