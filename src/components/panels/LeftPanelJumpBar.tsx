import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react'
import { useScenesStore } from '@/stores'
import { useUIStore } from '@/stores/uiStore'
import { useDialoguesStore } from '@/stores/dialoguesStore'
import { useSelectionStore } from '@/stores/selectionStore'
import type { DialogueSelection } from '@/stores/selectionStore.types'
import type { Dialogue } from '@/types'

const EMPTY_DIALOGUES: Dialogue[] = []

export interface LeftPanelJumpBarProps {
  activeTab: 'scenes' | 'dialogues'
  onSceneSelect: (sceneId: string) => void
  onDialogueSelect?: (sceneId: string, index: number) => void
}

function getTypeClass(d: Dialogue): string {
  if (d.choices?.some(c => c.diceCheck)) return 'type-dice'
  if (d.choices && d.choices.length > 0) return 'type-choice'
  return 'type-simple'
}

const SceneIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/>
    <path d="M3.5 3L7 5L3.5 7V3Z" fill="currentColor"/>
  </svg>
)

const DialogueIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M1 2C1 1.45 1.45 1 2 1H8C8.55 1 9 1.45 9 2V6C9 6.55 8.55 7 8 7H6L5 9L4 7H2C1.45 7 1 6.55 1 6V2Z" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
)

/**
 * LeftPanelJumpBar — HUD Compact 110px sous les onglets Scènes/Dialogues.
 *
 * Rangée nav  (haut) : [SceneIcon SCÈNES] [◄] [01/04 ▾] [►]  |  [DialogIcon DIALOGUES] [◄] [05/14 ▾] [►]
 * Rangée info (bas)  : [● Nom scène ████░]  |  [▌▌▌▌▌▌ mini-barres type + progress]
 *
 * Toujours visible — ne pas envelopper dans un TabsContent.
 */
export function LeftPanelJumpBar({ activeTab, onSceneSelect, onDialogueSelect }: LeftPanelJumpBarProps) {
  // ── Données scènes ───────────────────────────────────────────
  const scenes = useScenesStore(s => s.scenes)
  const selectedSceneId = useUIStore(s => s.selectedSceneForEdit)
  const selectedSceneIndex = scenes.findIndex(s => s.id === selectedSceneId)
  const currentSceneNum = selectedSceneIndex >= 0 ? selectedSceneIndex + 1 : 1
  const selectedScene = selectedSceneIndex >= 0 ? scenes[selectedSceneIndex] : null

  // ── Données dialogues ────────────────────────────────────────
  const dialoguesByScene = useDialoguesStore(s => s.dialoguesByScene)
  const dialogues = selectedSceneId
    ? (dialoguesByScene[selectedSceneId] ?? EMPTY_DIALOGUES)
    : EMPTY_DIALOGUES

  const selectedElement = useSelectionStore(s => s.selectedElement)
  const selectedDialogueIdx = (() => {
    if (!selectedElement || selectedElement.type !== 'dialogue') return -1
    const sel = selectedElement as DialogueSelection
    if (sel.sceneId !== selectedSceneId) return -1
    return sel.index
  })()
  const currentDialogueNum = selectedDialogueIdx >= 0 ? selectedDialogueIdx + 1 : 0

  // ── Dropdowns ────────────────────────────────────────────────
  const [sceneOpen, setSceneOpen] = useState(false)
  const [dialogueOpen, setDialogueOpen] = useState(false)
  const sceneRef = useRef<HTMLDivElement>(null)
  const dialogueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sceneOpen && !dialogueOpen) return
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (sceneRef.current && !sceneRef.current.contains(t)) setSceneOpen(false)
      if (dialogueRef.current && !dialogueRef.current.contains(t)) setDialogueOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [sceneOpen, dialogueOpen])

  // ── Navigation scènes ────────────────────────────────────────
  const scrollToScene = useCallback((sceneId: string) => {
    setTimeout(() => {
      document.querySelector(`[data-scene-id="${sceneId}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 50)
  }, [])

  const handleSceneJumpTo = useCallback((sceneId: string) => {
    onSceneSelect(sceneId)
    setSceneOpen(false)
    scrollToScene(sceneId)
  }, [onSceneSelect, scrollToScene])

  const handleScenePrev = useCallback(() => {
    if (selectedSceneIndex <= 0) return
    handleSceneJumpTo(scenes[selectedSceneIndex - 1].id)
  }, [selectedSceneIndex, scenes, handleSceneJumpTo])

  const handleSceneNext = useCallback(() => {
    if (selectedSceneIndex < 0 || selectedSceneIndex >= scenes.length - 1) return
    handleSceneJumpTo(scenes[selectedSceneIndex + 1].id)
  }, [selectedSceneIndex, scenes, handleSceneJumpTo])

  // ── Navigation dialogues ─────────────────────────────────────
  const scrollToDialogue = useCallback((idx: number) => {
    if (!selectedSceneId) return
    setTimeout(() => {
      document.querySelector(`[data-dialogue-id="${selectedSceneId}-${idx}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 50)
  }, [selectedSceneId])

  const handleDialogueJumpTo = useCallback((idx: number) => {
    if (!selectedSceneId) return
    onDialogueSelect?.(selectedSceneId, idx)
    setDialogueOpen(false)
    scrollToDialogue(idx)
  }, [selectedSceneId, onDialogueSelect, scrollToDialogue])

  const handleDialoguePrev = useCallback(() => {
    if (selectedDialogueIdx <= 0) return
    handleDialogueJumpTo(selectedDialogueIdx - 1)
  }, [selectedDialogueIdx, handleDialogueJumpTo])

  const handleDialogueNext = useCallback(() => {
    if (selectedDialogueIdx < 0 || selectedDialogueIdx >= dialogues.length - 1) return
    handleDialogueJumpTo(selectedDialogueIdx + 1)
  }, [selectedDialogueIdx, dialogues.length, handleDialogueJumpTo])

  // ── Calculs progression ──────────────────────────────────────
  const sceneProgress = scenes.length > 1 ? (currentSceneNum / scenes.length) * 100 : 100
  const dialogueProgress = dialogues.length > 1 && currentDialogueNum > 0
    ? (currentDialogueNum / dialogues.length) * 100
    : 0

  // Mini-barres : max 8 affichées
  const minibarDialogues = dialogues.slice(0, 8)

  return (
    <div className="jump-hud" role="navigation" aria-label="Navigation rapide">

      {/* ── Rangée navigation (haut) — pleine largeur selon l'onglet actif ── */}
      <div className="jump-hud-nav">

        {activeTab === 'scenes' ? (
          /* Section Scènes — pleine largeur */
          <div className="jump-hud-section" ref={sceneRef}>
            {sceneOpen && (
              <div className="jump-bar-dropdown" role="listbox" aria-label="Liste des scènes">
                <div className="jump-bar-list">
                  {scenes.map((scene, idx) => {
                    const isActive = idx === selectedSceneIndex
                    const sceneColor = scene.color ?? 'var(--color-primary)'
                    return (
                      <button
                        key={scene.id}
                        className={`jump-bar-list-item${isActive ? ' active' : ''}`}
                        onClick={() => handleSceneJumpTo(scene.id)}
                        role="option"
                        aria-selected={isActive}
                      >
                        <span className="jump-bar-list-num">{String(idx + 1).padStart(2, '0')}</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: sceneColor, flexShrink: 0 }} />
                        <span className="jump-bar-list-label">{scene.title}</span>
                        {isActive && <Check size={11} className="jump-bar-list-check" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <span className="jump-hud-label scenes">
              <span className="jump-hud-label-icon"><SceneIcon /></span>
              SCÈNES
            </span>

            <div className="jump-hud-controls">
              <button
                className="jump-hud-btn"
                onClick={handleScenePrev}
                disabled={selectedSceneIndex <= 0}
                aria-label="Scène précédente"
                title="Scène précédente"
              >
                <ChevronLeft size={11} />
              </button>
              <button
                className={`jump-hud-trigger scenes${sceneOpen ? ' open' : ''}`}
                onClick={() => setSceneOpen(o => !o)}
                aria-expanded={sceneOpen}
                aria-haspopup="listbox"
                aria-label="Aller à une scène"
              >
                <span>{String(currentSceneNum).padStart(2, '0')}/{String(scenes.length).padStart(2, '0')}</span>
                <ChevronDown size={8} />
              </button>
              <button
                className="jump-hud-btn"
                onClick={handleSceneNext}
                disabled={selectedSceneIndex < 0 || selectedSceneIndex >= scenes.length - 1}
                aria-label="Scène suivante"
                title="Scène suivante"
              >
                <ChevronRight size={11} />
              </button>
            </div>
          </div>
        ) : (
          /* Section Dialogues — pleine largeur */
          <div className="jump-hud-section" ref={dialogueRef}>
            {dialogueOpen && dialogues.length > 0 && (
              <div className="jump-bar-dropdown" role="listbox" aria-label="Liste des dialogues">
                <div className="jump-bar-grid-wrap">
                  <div className="jump-bar-grid">
                    {dialogues.map((dialogue, idx) => (
                      <button
                        key={idx}
                        className={`jump-bar-cell ${getTypeClass(dialogue)}${idx === selectedDialogueIdx ? ' active' : ''}`}
                        onClick={() => handleDialogueJumpTo(idx)}
                        role="option"
                        aria-selected={idx === selectedDialogueIdx}
                        title={`Dialogue ${idx + 1}`}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="jump-bar-legend">
                  <span className="jump-bar-legend-item" style={{ color: 'rgba(74,222,128,0.8)' }}>
                    <span className="jump-bar-legend-dot" style={{ background: 'rgba(74,222,128,0.6)' }} />Simple
                  </span>
                  <span className="jump-bar-legend-item" style={{ color: 'rgba(167,139,250,0.8)' }}>
                    <span className="jump-bar-legend-dot" style={{ background: 'rgba(167,139,250,0.6)' }} />Choix
                  </span>
                  <span className="jump-bar-legend-item" style={{ color: 'rgba(251,191,36,0.8)' }}>
                    <span className="jump-bar-legend-dot" style={{ background: 'rgba(251,191,36,0.6)' }} />Dé
                  </span>
                </div>
              </div>
            )}

            <span className="jump-hud-label dialogues">
              <span className="jump-hud-label-icon"><DialogueIcon /></span>
              DIALOGUES
            </span>

            <div className="jump-hud-controls">
              <button
                className="jump-hud-btn"
                onClick={handleDialoguePrev}
                disabled={dialogues.length === 0 || selectedDialogueIdx <= 0}
                aria-label="Dialogue précédent"
                title="Dialogue précédent"
              >
                <ChevronLeft size={11} />
              </button>
              <button
                className={`jump-hud-trigger dialogues${dialogueOpen ? ' open' : ''}`}
                onClick={() => dialogues.length > 0 && setDialogueOpen(o => !o)}
                aria-expanded={dialogueOpen}
                aria-haspopup="listbox"
                aria-label="Aller à un dialogue"
                style={{ cursor: dialogues.length === 0 ? 'default' : 'pointer' }}
              >
                <span>
                  {currentDialogueNum > 0
                    ? `${String(currentDialogueNum).padStart(2, '0')}/${String(dialogues.length).padStart(2, '0')}`
                    : `—/${String(dialogues.length).padStart(2, '0')}`}
                </span>
                {dialogues.length > 0 && <ChevronDown size={8} />}
              </button>
              <button
                className="jump-hud-btn"
                onClick={handleDialogueNext}
                disabled={dialogues.length === 0 || selectedDialogueIdx < 0 || selectedDialogueIdx >= dialogues.length - 1}
                aria-label="Dialogue suivant"
                title="Dialogue suivant"
              >
                <ChevronRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Rangée info (bas) — contenu selon l'onglet actif ────── */}
      <div className="jump-hud-info">
        {activeTab === 'scenes' ? (
          /* Info scène : nom + barre de progression */
          <div className="jump-hud-info-section">
            <div className="jump-hud-scene-name">
              <span
                className="jump-hud-scene-dot"
                style={{ background: selectedScene?.color ?? 'rgba(0,212,255,0.7)' }}
              />
              <span>{selectedScene?.title ?? 'Aucune scène'}</span>
            </div>
            <div className="jump-hud-progress-track">
              <div
                className="jump-hud-progress-fill"
                style={{ width: `${sceneProgress}%` }}
              />
            </div>
          </div>
        ) : (
          /* Info dialogues : mini-barres + barre de progression */
          <div className="jump-hud-info-section">
            {dialogues.length === 0 ? (
              <span className="jump-hud-minibar-empty">Aucun dialogue</span>
            ) : (
              <>
                <div className="jump-hud-minibars">
                  {minibarDialogues.map((d, idx) => (
                    <div
                      key={idx}
                      className={`jump-hud-minibar ${getTypeClass(d)}${idx === selectedDialogueIdx ? ' active' : ''}`}
                      title={`Dialogue ${idx + 1}`}
                    />
                  ))}
                  {dialogues.length > 8 && (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginLeft: 2 }}>
                      +{dialogues.length - 8}
                    </span>
                  )}
                </div>
                <div className="jump-hud-progress-track">
                  <div
                    className="jump-hud-progress-fill"
                    style={{
                      width: `${dialogueProgress}%`,
                      background: 'linear-gradient(90deg, rgba(167,139,250,0.7), rgba(98,70,234,0.9))'
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
