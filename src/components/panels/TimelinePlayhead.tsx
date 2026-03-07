import * as React from "react"
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react'
import { getDialogueCumulativeTimes } from '@/utils/dialogueDuration'
import { useIsKidMode } from '@/hooks/useIsKidMode'
import type { Dialogue } from '@/types'

/**
 * TimelinePlayhead — Design premium "Midnight Bloom" (studio.css classes)
 *
 * Features:
 * - Scrub preview (drag playhead) avec magnetic snap sur les marqueurs
 * - Snap ripple haptics (framer-motion AnimatePresence)
 * - Scrubber animé au survol (spring whileHover)
 * - Markers dialogue (normal) et choice (rose)
 * - Zoom canvas
 */

const SNAP_RADIUS = 4 // % de tolérance pour l'aimantation

interface Ripple { id: number; pct: number; isChoice: boolean }

export interface TimelinePlayheadProps {
  currentTime?: number
  duration?: number
  dialogues?: Dialogue[]
  onSeek?: (time: number) => void
  onPlayPause?: () => void
  isPlaying?: boolean
  canvasZoom?: number
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetZoom?: () => void
}

export default function TimelinePlayhead({
  currentTime = 0,
  duration = 60,
  dialogues = [],
  onSeek = () => {},
  onPlayPause = () => {},
  isPlaying = false,
  canvasZoom = 1.0,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: TimelinePlayheadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const trackRef = useRef<HTMLDivElement | null>(null)
  const isKid = useIsKidMode()

  // Format time MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Position scrubber (0-100%)
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0

  // Marqueurs positionnés par durée cumulée réelle
  const dialogueMarkers = useMemo(() => {
    if (dialogues.length === 0 || duration <= 0) return []
    const times = getDialogueCumulativeTimes(dialogues)
    return dialogues.map((dialogue, idx) => {
      const t = times[idx] ?? 0
      return {
        id: dialogue.id || idx,
        idx,
        time: t,
        pct: Math.min(99, (t / duration) * 100),
        isChoice: (dialogue.choices?.length ?? 0) > 0,
        preview: dialogue.text?.substring(0, 60) || 'Dialogue',
      }
    })
  }, [dialogues, duration])

  // Snap ripple
  const fireRipple = useCallback((pct: number, isChoice: boolean) => {
    const id = Date.now()
    setRipples((prev) => [...prev, { id, pct, isChoice }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 520)
  }, [])

  // Récupère le % brut depuis un clientX
  const getPct = useCallback((clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  }, [])

  // Convertit un % → secondes et appelle onSeek
  const seekToPct = useCallback((pct: number) => {
    onSeek((pct / 100) * duration)
  }, [duration, onSeek])

  // Après release : tente de snapper au marqueur le plus proche
  const trySnap = useCallback((rawPct: number) => {
    const nearest = dialogueMarkers.reduce<typeof dialogueMarkers[0] | null>((acc, m) => {
      const d = Math.abs(rawPct - m.pct)
      if (d > SNAP_RADIUS) return acc
      if (!acc || d < Math.abs(rawPct - acc.pct)) return m
      return acc
    }, null)

    if (nearest) {
      seekToPct(nearest.pct)
      fireRipple(nearest.pct, nearest.isChoice)
    } else {
      seekToPct(rawPct)
    }
  }, [dialogueMarkers, seekToPct, fireRipple])

  // Handlers drag
  // Prev / Next dialogue marker
  const handlePrevDialogue = useCallback(() => {
    if (dialogueMarkers.length === 0) { onSeek(0); return; }
    const prev = [...dialogueMarkers].reverse().find(m => m.time < currentTime - 0.1);
    onSeek(prev ? prev.time : 0);
  }, [dialogueMarkers, currentTime, onSeek]);

  const handleNextDialogue = useCallback(() => {
    if (dialogueMarkers.length === 0) { onSeek(duration); return; }
    const next = dialogueMarkers.find(m => m.time > currentTime + 0.1);
    onSeek(next ? next.time : duration);
  }, [dialogueMarkers, currentTime, duration, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    seekToPct(getPct(e.clientX))
  }, [getPct, seekToPct])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    seekToPct(getPct(e.clientX))
  }, [getPct, seekToPct])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    setIsDragging(false)
    trySnap(getPct(e.clientX))
  }, [getPct, trySnap])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      className="timeline"
      role="region"
      aria-label="Timeline controls"
    >
      {/* ── Transport ── */}
      <div className="tl-ctrl">
        <button
          className="tl-btn"
          onClick={handlePrevDialogue}
          title="Dialogue précédent"
          aria-label="Dialogue précédent"
        >
          <SkipBack size={11} aria-hidden="true" />
        </button>
        <button
          className={`tl-btn play`}
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying
            ? <Pause size={12} aria-hidden="true" />
            : <Play size={12} aria-hidden="true" />
          }
        </button>
        <button
          className="tl-btn"
          onClick={handleNextDialogue}
          title="Dialogue suivant"
          aria-label="Dialogue suivant"
        >
          <SkipForward size={11} aria-hidden="true" />
        </button>
      </div>

      {/* ── Timecode ── */}
      <span className="tl-time" aria-label={`${formatTime(currentTime)} sur ${formatTime(duration)}`}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* ── Track ── */}
      <div
        className="tl-track-wrap"
        onMouseDown={handleMouseDown}
        role="slider"
        aria-label="Timeline scrubber"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} sur ${formatTime(duration)}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 1))
          if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 1))
          if (e.key === 'Home') onSeek(0)
          if (e.key === 'End') onSeek(duration)
        }}
      >
        <div className="tl-track" ref={trackRef}>
          {/* Barre de progression */}
          <div className="tl-progress" style={{ width: `${playheadPct}%` }} aria-hidden="true" />

          {/* Marqueurs dialogue/choix */}
          {dialogueMarkers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              className={[
                'tl-marker',
                marker.isChoice ? 'choice' : '',
                Math.abs(marker.pct - playheadPct) < 0.5 ? 'active' : '',
              ].filter(Boolean).join(' ')}
              style={{ left: `${marker.pct}%` }}
              title={`${marker.isChoice ? '⇌ Choix' : '◆ Dialogue'} #${marker.idx + 1} — ${formatTime(marker.time)}`}
              aria-label={`Dialogue ${marker.idx + 1} à ${formatTime(marker.time)}`}
              onClick={(e) => {
                e.stopPropagation()
                onSeek(marker.time)
                fireRipple(marker.pct, marker.isChoice)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                onSeek(marker.time)
                fireRipple(marker.pct, marker.isChoice)
                if (!isPlaying) onPlayPause()
              }}
            />
          ))}

          {/* Scrubber animé (framer-motion spring) */}
          <motion.div
            className="tl-scrubber"
            style={{ left: `${playheadPct}%` }}
            whileHover={{ scale: 1.3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            aria-hidden="true"
          />

          {/* Snap ripples — feedback haptique visuel */}
          <AnimatePresence>
            {ripples.map((r) => (
              <motion.div
                key={r.id}
                className="tl-ripple"
                style={{
                  left: `${r.pct}%`,
                  background: r.isChoice ? 'var(--color-pink)' : 'var(--color-primary)',
                }}
                initial={{ width: 0, height: 0, opacity: 0.55, x: '-50%', y: '-50%' }}
                animate={{ width: 32, height: 32, opacity: 0,  x: '-50%', y: '-50%' }}
                exit={{}}
                transition={{ duration: 0.48, ease: 'easeOut' }}
                aria-hidden="true"
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Méta ── */}
      <span className="tl-meta">
        {dialogues.length} dial.{isKid ? '' : ''}
      </span>

      {/* ── Zoom canvas ── */}
      <div className="tl-zoom">
        <button
          className="tl-btn"
          onClick={onZoomOut}
          aria-label="Zoom arrière canvas"
        >
          <ZoomOut size={12} aria-hidden="true" />
        </button>
        <button
          className="tl-zoom-val"
          onClick={onResetZoom}
          title="Réinitialiser le zoom"
          aria-label={`Zoom ${Math.round(canvasZoom * 100)}%, cliquer pour réinitialiser`}
        >
          {Math.round(canvasZoom * 100)}%
        </button>
        <button
          className="tl-btn"
          onClick={onZoomIn}
          aria-label="Zoom avant canvas"
        >
          <ZoomIn size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
