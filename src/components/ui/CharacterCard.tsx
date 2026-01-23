import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Character } from '@/types'

/**
 * CharacterCard - Carte de personnage style Nintendo
 *
 * Inspirations:
 * - Pokemon Card (avatar circulaire, badges)
 * - Smash Bros Character Select (hover effects)
 * - Animal Crossing Villager Card
 *
 * Features:
 * - Avatar circulaire avec border mood
 * - Badges d'humeurs visuels
 * - Hover scale + shadow
 * - Click bounce
 * - Drag & drop support
 * - Quick actions au hover
 * - Selection visuelle
 */

const MOOD_COLORS: Record<string, string> = {
  neutral: 'border-border',
  happy: 'border-yellow-400',
  sad: 'border-blue-400',
  angry: 'border-red-400',
  surprised: 'border-purple-400',
  confident: 'border-green-400',
  worried: 'border-orange-400',
}

const MOOD_ICONS: Record<string, string> = {
  neutral: '😐',
  happy: '😊',
  sad: '😢',
  angry: '😠',
  surprised: '😮',
  confident: '😎',
  worried: '😰',
}

export interface CharacterCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'onDrag'> {
  character: Character & { currentMood?: string }
  selected?: boolean
  onSelect?: () => void
  onEdit?: (character: Character & { currentMood?: string }) => void
  onDelete?: (character: Character & { currentMood?: string }) => void
  onDrag?: (character: Character & { currentMood?: string }) => void
  showQuickActions?: boolean
}

export function CharacterCard({
  character,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onDrag,
  showQuickActions = true,
  className,
  ...props
}: CharacterCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const moodColor = MOOD_COLORS[character.currentMood || 'neutral']
  const hasSprite = character.sprites && Object.keys(character.sprites).length > 0
  const currentSprite = character.sprites?.[character.currentMood || 'neutral'] || ''

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true)
    if (onDrag) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('character-id', character.id)
      onDrag(character)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      className={cn(
        "relative group bg-white rounded-xl p-4 transition-all duration-200 cursor-pointer",
        "border-2",
        selected
          ? "border-blue-500 shadow-lg shadow-blue-200"
          : "border-border shadow-md",
        !isDragging && "hover:scale-105 hover:shadow-xl",
        "active:scale-95",
        isDragging && "opacity-50 scale-95 cursor-grabbing",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        className
      )}
      onClick={onSelect}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      draggable={!!onDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      tabIndex={0}
      role="button"
      aria-label={`${character.name}, ${character.moods?.length || 0} humeurs`}
      aria-pressed={selected}
      {...props}
    >
      {/* Avatar circulaire */}
      <div className="flex flex-col items-center gap-3 mb-3">
        <div
          className={cn(
            "relative w-20 h-20 rounded-full border-4 overflow-hidden transition-all",
            moodColor,
            selected && "ring-4 ring-blue-300"
          )}
        >
          {hasSprite && currentSprite ? (
            <img
              src={currentSprite}
              alt={character.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted flex items-center justify-center text-3xl">
              👤
            </div>
          )}

          {/* Badge mood */}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm shadow-md border-2 border-border">
            {MOOD_ICONS[character.currentMood || 'neutral']}
          </div>
        </div>

        <h4 className="font-bold text-foreground text-center text-sm">
          {character.name || 'Sans nom'}
        </h4>
      </div>

      {/* Badges humeurs */}
      {character.moods && character.moods.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mb-2">
          {character.moods.slice(0, 4).map((mood) => (
            <span
              key={mood}
              className="px-2 py-0.5 bg-muted text-foreground text-xs rounded-full font-medium"
              title={mood}
            >
              {MOOD_ICONS[mood] || '😐'}
            </span>
          ))}
          {character.moods.length > 4 && (
            <span className="px-2 py-0.5 bg-muted text-foreground text-xs rounded-full font-medium">
              +{character.moods.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && isHovering && !isDragging && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 animate-fadeIn">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(character)
              }}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
              title="Modifier"
              aria-label="Modifier"
            >
              ✏️
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(character)
              }}
              className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
              title="Supprimer"
              aria-label="Supprimer"
            >
              🗑️
            </button>
          )}
        </div>
      )}

      {/* Badge drag */}
      {onDrag && !isDragging && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-background/80 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          ✋ Glisser vers la scene
        </div>
      )}

      {/* Selection */}
      {selected && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
          ✓
        </div>
      )}
    </div>
  )
}

export interface CharacterGridProps {
  children: React.ReactNode
  cols?: 2 | 3 | 4 | 5
  className?: string
}

export function CharacterGrid({ children, cols = 4, className }: CharacterGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 2 && "grid-cols-2",
        cols === 3 && "grid-cols-3",
        cols === 4 && "grid-cols-4",
        cols === 5 && "grid-cols-5",
        className
      )}
    >
      {children}
    </div>
  )
}

export interface EmptyCharacterStateProps {
  onCreateNew?: () => void
}

export function EmptyCharacterState({ onCreateNew }: EmptyCharacterStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-card text-center">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-5xl mb-4">
        👤
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        Aucun personnage
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Creez votre premier personnage pour commencer a construire votre histoire
      </p>
      {onCreateNew && (
        <button
          onClick={onCreateNew}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          ✨ Creer un personnage
        </button>
      )}
    </div>
  )
}
