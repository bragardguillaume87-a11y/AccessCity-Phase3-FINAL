import * as React from "react"
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { BookOpen, MessageSquare, Plus } from 'lucide-react'
import type { Scene } from '@/types'

/**
 * TimelineHeader - Fil narratif horizontal pour AccessCity Studio
 *
 * Affiche toutes les scènes dans une timeline horizontale scrollable
 * avec états visuels (passé/présent/futur) et progression narrative.
 *
 * Features:
 * - Scroll horizontal pour 10-20+ scènes
 * - États visuels: active (cyan), past (opacity 70%), future (opacity 60%)
 * - Gaming UX: gradients, hover scale-105, badges numérotés
 * - Tooltips avec title + description
 * - Badge count dialogues par scène
 * - Bouton "Nouvelle scène" intégré
 * - WCAG 2.2 AA: focus ring 2px, keyboard navigation
 */

export interface TimelineHeaderProps {
  /** Array de scènes avec id, title, description, dialogues */
  scenes?: Scene[]
  /** ID de la scène actuellement sélectionnée */
  selectedSceneId?: string | null
  /** Callback quand une scène est cliquée */
  onSceneSelect?: (sceneId: string) => void
  /** Callback pour créer une nouvelle scène */
  onAddScene?: () => void
}

function TimelineHeader({
  scenes = [],
  selectedSceneId = null,
  onSceneSelect = () => {},
  onAddScene = () => {}
}: TimelineHeaderProps) {
  const currentSceneIndex = scenes.findIndex(s => s.id === selectedSceneId)

  return (
    <div
      className="h-20 border-b-2 border-slate-700
                 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800
                 flex items-center px-4 gap-3"
      role="navigation"
      aria-label="Chronologie narrative des scènes"
    >
      {/* Label "Fil narratif" */}
      <div
        className="flex-shrink-0 flex items-center gap-2
                   px-3 py-2 bg-purple-500/20 rounded-lg border border-purple-500/30"
        aria-hidden="true"
      >
        <BookOpen className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
          Fil narratif
        </span>
      </div>

      {/* Horizontal scroll area pour les scènes */}
      <ScrollArea className="flex-1">
        <div className="flex items-center gap-3 pb-2" role="list">
          {scenes.map((scene, idx) => {
            const isActive = scene.id === selectedSceneId
            const isPast = idx < currentSceneIndex
            const isFuture = idx > currentSceneIndex
            const dialogueCount = scene.dialogues?.length || 0

            return (
              <Tooltip key={scene.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSceneSelect(scene.id)}
                    className={cn(
                      "flex-shrink-0 w-56 h-14 rounded-xl border-2 transition-all",
                      "flex items-center gap-3 px-3 py-2 relative",
                      "hover:scale-105 hover:shadow-lg",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                      isActive && "border-cyan-400 bg-cyan-400/20 scale-105 shadow-xl shadow-cyan-400/20",
                      isPast && "border-slate-600 bg-slate-700/50 opacity-70 hover:opacity-90",
                      isFuture && "border-slate-600 bg-slate-800/50 opacity-60 hover:opacity-80",
                      !isActive && !isPast && !isFuture && "border-slate-600 bg-slate-800"
                    )}
                    aria-label={`Scène ${idx + 1}: ${scene.title || `Scène ${idx + 1}`}, ${dialogueCount} dialogues`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {/* Step badge - numéro de scène */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors",
                        isActive && "bg-cyan-400 text-slate-900",
                        !isActive && "bg-slate-600 text-slate-300"
                      )}
                      aria-hidden="true"
                    >
                      {idx + 1}
                    </div>

                    {/* Content - titre + badge dialogues */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate text-white">
                        {scene.title || `Scène ${idx + 1}`}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" aria-hidden="true" />
                        <span>{dialogueCount} dialogue{dialogueCount > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Active indicator - barre cyan en bas */}
                    {isActive && (
                      <div
                        className="absolute -bottom-1 left-0 right-0 h-1
                                   bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">{scene.title || `Scène ${idx + 1}`}</p>
                  {scene.description && (
                    <p className="text-xs text-slate-400 mt-1">{scene.description}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}

          {/* Bouton "Nouvelle scène" */}
          <Button
            variant="outline"
            size="sm"
            onClick={onAddScene}
            className="flex-shrink-0 h-14 border-dashed border-slate-600
                       hover:border-purple-500 hover:bg-purple-500/10
                       transition-colors"
            aria-label="Créer une nouvelle scène"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-2">Nouvelle scène</span>
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

export default TimelineHeader
