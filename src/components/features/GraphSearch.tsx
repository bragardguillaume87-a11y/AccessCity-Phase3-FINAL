import { useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { Search, X } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import type { Node as FlowNode } from '@xyflow/react';
import { Z_INDEX } from '@/utils/zIndexLayers';
import type { DialogueNodeData } from '@/types';

interface GraphSearchProps {
  nodes: FlowNode[];
  sceneId: string;
  onSelectDialogue: (sceneId: string, index: number) => void;
  onClose: () => void;
}

/**
 * GraphSearch — Palette de recherche Ctrl+G pour le graphe de dialogues.
 *
 * Filtre les nœuds par texte du dialogue et nom du speaker.
 * Sur sélection : fitView animé vers le nœud + ouvre le DialogueComposer.
 * Se ferme sur Escape ou clic extérieur.
 *
 * Hennig §11.4 : "Jump-to-node — les auteurs pensent non-linéairement."
 */
export function GraphSearch({ nodes, sceneId, onSelectDialogue, onClose }: GraphSearchProps) {
  const { fitView } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer sur clic extérieur
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onClose]);

  // Filtrer uniquement les nœuds de dialogue (avec data.text)
  const dialogueNodes = nodes.filter((n) => (n.data as DialogueNodeData).text !== undefined);

  function handleSelect(node: FlowNode) {
    const data = node.data as DialogueNodeData;
    // Zoom animé vers le nœud sélectionné
    fitView({ nodes: [{ id: node.id }], duration: 500, padding: 0.3, maxZoom: 1.4 });
    // Ouvre le DialogueComposer si index disponible
    if (data.index !== undefined) {
      onSelectDialogue(sceneId, data.index);
    }
    onClose();
  }

  return (
    // Overlay centré dans le conteneur du graphe
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: Z_INDEX.DIALOG_BASE,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 60,
        pointerEvents: 'none',
      }}
    >
      <div ref={containerRef} style={{ pointerEvents: 'auto', width: '100%', maxWidth: 480 }}>
        <Command
          label="Rechercher un dialogue"
          style={{
            borderRadius: 12,
            border: '1.5px solid rgba(139,92,246,0.40)',
            background: 'rgba(8,10,20,0.96)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05)',
            overflow: 'hidden',
            fontFamily: 'var(--font-family-base)',
          }}
        >
          {/* ── Input ─────────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Search size={14} style={{ color: 'rgba(139,92,246,0.8)', flexShrink: 0 }} />
            <Command.Input
              placeholder="Rechercher un dialogue… (Échap pour fermer)"
              autoFocus
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)',
                padding: 2,
                display: 'flex',
              }}
              aria-label="Fermer la recherche"
            >
              <X size={13} />
            </button>
          </div>

          {/* ── Results ───────────────────────────────────────────────────── */}
          <Command.List style={{ maxHeight: 320, overflowY: 'auto' }}>
            <Command.Empty
              style={{
                padding: '18px 14px',
                textAlign: 'center',
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              Aucun dialogue trouvé
            </Command.Empty>

            {dialogueNodes.map((node) => {
              const data = node.data as DialogueNodeData;
              const preview = data.text?.slice(0, 72) + (data.text?.length > 72 ? '…' : '');
              const idx = data.index !== undefined ? data.index + 1 : '?';

              return (
                <Command.Item
                  key={node.id}
                  value={`${data.speaker} ${data.text}`}
                  onSelect={() => handleSelect(node)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '9px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                  // Hover géré par cmdk via data-selected
                >
                  {/* Index badge */}
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 1,
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(139,92,246,0.75)',
                      background: 'rgba(139,92,246,0.12)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      minWidth: 22,
                      textAlign: 'center',
                    }}
                  >
                    {idx}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    {/* Speaker */}
                    {data.speaker && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.65)',
                          marginBottom: 2,
                        }}
                      >
                        {data.speaker}
                      </div>
                    )}
                    {/* Texte */}
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>
                      {preview || <em style={{ color: 'rgba(255,255,255,0.3)' }}>Dialogue vide</em>}
                    </div>
                  </div>
                </Command.Item>
              );
            })}
          </Command.List>

          {/* ── Footer hint ───────────────────────────────────────────────── */}
          <div
            style={{
              padding: '6px 14px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              gap: 12,
              fontSize: 10,
              color: 'rgba(255,255,255,0.22)',
            }}
          >
            <span>
              <kbd
                style={{
                  fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  padding: '1px 4px',
                }}
              >
                ↑↓
              </kbd>{' '}
              naviguer
            </span>
            <span>
              <kbd
                style={{
                  fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  padding: '1px 4px',
                }}
              >
                ↵
              </kbd>{' '}
              ouvrir
            </span>
            <span>
              <kbd
                style={{
                  fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  padding: '1px 4px',
                }}
              >
                Échap
              </kbd>{' '}
              fermer
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
