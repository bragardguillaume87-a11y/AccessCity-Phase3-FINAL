import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { TIMING } from '@/config/timing'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface StateConfig {
  icon: string
  text: string
  color: string
  bgColor: string
  animate?: boolean
}

/**
 * AutoSaveIndicator - Visual feedback for auto-save status
 *
 * Inspiration: Google Docs, Notion, Figma
 *
 * States:
 * - idle: No recent changes
 * - saving: Currently saving
 * - saved: Successfully saved (shows time since)
 * - error: Save failed
 *
 * Features:
 * - Smooth transitions between states
 * - Relative time display (2s ago, 1min ago)
 * - Error state with retry button
 * - Accessible (ARIA live region)
 *
 * Usage:
 * const { lastSaved, isSaving } = useUIStore();
 * <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
 */
export interface AutoSaveIndicatorProps {
  lastSaved?: Date | null
  isSaving?: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}

export function AutoSaveIndicator({
  lastSaved,
  isSaving = false,
  error = null,
  onRetry,
  className,
}: AutoSaveIndicatorProps) {
  const [, forceUpdate] = useState(0)

  // Update every second for relative time
  useEffect(() => {
    if (!lastSaved) return

    const interval = setInterval(() => {
      forceUpdate(n => n + 1)
    }, TIMING.UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [lastSaved])

  const timeSince = lastSaved
    ? formatDistanceToNow(new Date(lastSaved), { addSuffix: true, locale: fr })
    : null

  // Determine current state
  let state: SaveState = 'idle'
  if (error) state = 'error'
  else if (isSaving) state = 'saving'
  else if (lastSaved) state = 'saved'

  // State configurations
  const states: Record<SaveState, StateConfig> = {
    idle: {
      icon: '⚪',
      text: 'No changes',
      color: 'text-muted-foreground',
      bgColor: 'bg-card/50',
    },
    saving: {
      icon: '💾',
      text: 'Saving...',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      animate: true,
    },
    saved: {
      icon: '✓',
      text: `Saved ${timeSince}`,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
    },
    error: {
      icon: '⚠️',
      text: error || 'Save failed',
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
    },
  }

  const config = states[state]

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
        config.bgColor,
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Icon */}
      <span
        className={cn(
          "flex-shrink-0 text-sm transition-transform",
          config.animate && "animate-pulse"
        )}
        aria-hidden="true"
      >
        {config.icon}
      </span>

      {/* Text */}
      <span className={cn("flex-1 text-xs font-medium", config.color)}>
        {config.text}
      </span>

      {/* Retry button (error state only) */}
      {state === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 px-2 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
          aria-label="Retry save"
        >
          Retry
        </button>
      )}
    </div>
  )
}

/**
 * SaveStatusBadge - Compact version for toolbars/headers
 */
export interface SaveStatusBadgeProps {
  lastSaved?: Date | null
  isSaving?: boolean
  className?: string
}

export function SaveStatusBadge({ lastSaved, isSaving, className }: SaveStatusBadgeProps) {
  if (isSaving) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-400 text-xs font-medium rounded-full animate-pulse",
          className
        )}
        role="status"
        aria-label="Saving"
      >
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
        Saving
      </span>
    )
  }

  if (lastSaved) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded-full",
          className
        )}
        role="status"
        aria-label="All changes saved"
      >
        ✓ Saved
      </span>
    )
  }

  return null
}
