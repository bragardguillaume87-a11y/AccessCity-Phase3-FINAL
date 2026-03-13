import { useEffect, useRef } from 'react'
import type { SceneMetadata } from '@/types'

/**
 * NarrativeThreads — Fils narratifs SVG dans la sidebar des scènes
 *
 * Dessine des courbes de Bézier entre les scènes consécutives pour
 * visualiser la structure narrative.
 *
 * - Connexion linéaire (violette) : scène normale sans embranchement
 * - Connexion choice (rose) : scène source ayant au moins 1 dialogue avec choix
 *
 * Adapté du template design (NarrativeThreads.tsx) pour :
 * - String UUIDs (au lieu de integer IDs)
 * - hasChoices passé en props (calculé dans ScenesSidebar depuis dialoguesByScene)
 * - data-scene-id déjà présent sur chaque .scene-item
 */

interface StoryEdge {
  fromId: string
  toId: string
  isChoice: boolean
}

interface Props {
  scenes: SceneMetadata[]
  /** Set de scène IDs qui ont au moins 1 dialogue avec choix */
  scenesWithChoices: Set<string>
  hoveredSceneId: string | null
  containerRef: React.RefObject<HTMLDivElement>
}

export function NarrativeThreads({ scenes, scenesWithChoices, hoveredSceneId, containerRef }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Dériver le graphe depuis les scènes consécutives
  const edges: StoryEdge[] = scenes.slice(0, -1).map((scene, i) => ({
    fromId: scene.id,
    toId: scenes[i + 1].id,
    isChoice: scenesWithChoices.has(scene.id),
  }))

  useEffect(() => {
    const svg = svgRef.current
    const wrap = containerRef.current
    if (!svg || !wrap) return

    const draw = () => {
      svg.innerHTML = ''
      const wRect = wrap.getBoundingClientRect()
      const scrollTop = wrap.scrollTop

      // Mesure la position de chaque scene-item via data-scene-id
      const positions: Record<string, {
        top: { x: number; y: number }
        bot: { x: number; y: number }
      }> = {}

      wrap.querySelectorAll<HTMLElement>('[data-scene-id]').forEach((el) => {
        const id = el.dataset.sceneId
        if (!id) return
        const r = el.getBoundingClientRect()
        const cx = r.width * 0.12 // ancrage en x : côté gauche (côté pastille couleur)
        positions[id] = {
          top: { x: cx, y: r.top - wRect.top + scrollTop + 6 },
          bot: { x: cx, y: r.bottom - wRect.top + scrollTop - 6 },
        }
      })

      // Resize SVG pour couvrir tout le contenu scrollable
      const lastScene = scenes[scenes.length - 1]
      const maxY = lastScene ? (positions[lastScene.id]?.bot.y ?? 0) + 20 : 0
      svg.style.height = `${maxY}px`

      // Dessiner les arêtes
      edges.forEach(({ fromId, toId, isChoice }) => {
        const pF = positions[fromId]
        const pT = positions[toId]
        if (!pF || !pT) return

        const isLit = hoveredSceneId === fromId || hoveredSceneId === toId
        const color = isChoice ? '#fa6d9a' : '#6b5ce7'
        const offset = isChoice ? 14 : 0

        const x1 = pF.bot.x + offset, y1 = pF.bot.y
        const x2 = pT.top.x + offset, y2 = pT.top.y
        const mid = (y1 + y2) / 2

        // Courbe de Bézier
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', `M${x1} ${y1} C${x1} ${mid},${x2} ${mid},${x2} ${y2}`)
        path.setAttribute('stroke', color)
        path.setAttribute('stroke-width', isLit ? '2.5' : '1.5')
        path.setAttribute('stroke-opacity', isLit ? '0.75' : '0.28')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-linecap', 'round')
        if (!isLit) path.setAttribute('stroke-dasharray', isChoice ? '2 6' : '4 5')
        if (isLit) path.setAttribute('filter', `drop-shadow(0 0 5px ${color})`)
        svg.appendChild(path)

        // Points d'ancrage aux extrémités
        ;[[x1, y1], [x2, y2]].forEach(([x, y]) => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          circle.setAttribute('cx', String(x))
          circle.setAttribute('cy', String(y))
          circle.setAttribute('r', isLit ? '4' : '3')
          circle.setAttribute('fill', color)
          circle.setAttribute('fill-opacity', isLit ? '0.9' : '0.3')
          if (isLit) circle.setAttribute('filter', `drop-shadow(0 0 4px ${color})`)
          svg.appendChild(circle)
        })
      })
    }

    draw()
    wrap.addEventListener('scroll', draw)
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)

    return () => {
      wrap.removeEventListener('scroll', draw)
      ro.disconnect()
    }
  }, [hoveredSceneId, scenes, edges, containerRef])

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'visible',
        transition: 'all 0.25s',
      }}
    />
  )
}
