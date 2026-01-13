import * as React from 'react'
import { useState, useEffect } from 'react'
import { useUIStore } from '../../stores/index'
import { TIMING } from '@/config/timing'

/**
 * AutoSaveTimestamp - Displays elapsed time since last save
 *
 * Performance optimization: Isolates the 1-second interval timer to prevent
 * re-rendering the entire EditorShell component tree.
 *
 * Before: ~60 re-renders/minute of entire app
 * After: <1 re-render/minute of entire app
 *
 * @returns Time elapsed display or null
 */
export const AutoSaveTimestamp = React.memo(() => {
  const lastSaved = useUIStore(state => state.lastSaved)
  const [elapsed, setElapsed] = useState(Date.now())

  // Isolated timer - only re-renders this component
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now())
    }, TIMING.UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  const getTimeSinceLastSave = (timestamp: Date | string | null | undefined): string | null => {
    if (!timestamp) return null

    const seconds = Math.floor((elapsed - new Date(timestamp).getTime()) / 1000)

    if (seconds < 60) {
      return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    return `${minutes}min`
  }

  const timeSince = getTimeSinceLastSave(lastSaved)

  if (!timeSince) {
    return null
  }

  return (
    <span className="text-slate-400 text-xs">
      {timeSince}
    </span>
  )
})

AutoSaveTimestamp.displayName = 'AutoSaveTimestamp'
