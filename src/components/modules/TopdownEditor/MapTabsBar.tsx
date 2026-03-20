/**
 * MapTabsBar — Barre d'onglets horizontale pour les cartes (style GDevelop)
 *
 * - Double-clic sur le nom → renommage inline
 * - ⚙ sur la tab active → ouvre MapSettingsDialog
 * - × sur hover (tabs inactives) → confirmation → deleteMap
 * - + pour créer une nouvelle carte
 *
 * @module components/modules/TopdownEditor/MapTabsBar
 */

import { useState, useRef } from 'react';
import { Plus, Map, Settings, X, Check } from 'lucide-react';
import type { MapMetadata } from '@/types/map';

interface MapTabsBarProps {
  maps: MapMetadata[];
  selectedMapId: string | null;
  onSelectMap: (mapId: string) => void;
  onAddMap: () => void;
  onRenameMap?: (mapId: string, newName: string) => void;
  onDeleteMap?: (mapId: string) => void;
  onOpenSettings?: (mapId: string) => void;
}

export default function MapTabsBar({
  maps,
  selectedMapId,
  onSelectMap,
  onAddMap,
  onRenameMap,
  onDeleteMap,
  onOpenSettings,
}: MapTabsBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const startRename = (map: MapMetadata) => {
    setRenamingId(map.id);
    setRenameValue(map.name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim() && onRenameMap) {
      onRenameMap(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = (map: MapMetadata) => {
    if (maps.length <= 1) return; // guard : toujours au moins une carte
    if (window.confirm(`Supprimer la carte "${map.name}" ? Cette action est irréversible.`)) {
      onDeleteMap?.(map.id);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 42,
        background: 'var(--color-bg-secondary, #1a1a2e)',
        borderTop: '1px solid var(--color-border-base, rgba(255,255,255,0.08))',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Scrollable tab list */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          gap: 2,
          padding: '0 6px',
        }}
      >
        {maps.map((map) => {
          const isActive = map.id === selectedMapId;
          const isHovered = hoveredId === map.id;
          const isRenaming = renamingId === map.id;

          return (
            <div
              key={map.id}
              onClick={() => {
                if (!isRenaming) onSelectMap(map.id);
              }}
              onMouseEnter={() => setHoveredId(map.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0 6px 0 9px',
                height: 34,
                borderRadius: 5,
                border: isActive ? '1px solid rgba(139,92,246,0.55)' : '1px solid transparent',
                background: isActive
                  ? 'rgba(139,92,246,0.22)'
                  : isHovered
                    ? 'rgba(255,255,255,0.06)'
                    : 'transparent',
                color: isActive
                  ? 'var(--color-primary, #8b5cf6)'
                  : 'var(--color-text-muted, rgba(255,255,255,0.5))',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                cursor: isRenaming ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'background 0.1s, color 0.1s',
                userSelect: 'none',
              }}
            >
              <Map size={13} style={{ flexShrink: 0, opacity: 0.7 }} />

              {/* Name or inline rename */}
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') {
                      setRenamingId(null);
                      setRenameValue('');
                    }
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: 100,
                    height: 24,
                    padding: '0 5px',
                    borderRadius: 3,
                    border: '1px solid rgba(139,92,246,0.6)',
                    background: 'rgba(139,92,246,0.12)',
                    color: '#c4b5fd',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startRename(map);
                  }}
                  style={{
                    maxWidth: 110,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={`${map.name} — double-clic pour renommer`}
                >
                  {map.name}
                </span>
              )}

              {/* Rename confirm/cancel */}
              {isRenaming ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      commitRename();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: '#4ade80',
                      flexShrink: 0,
                    }}
                  >
                    <Check size={10} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingId(null);
                      setRenameValue('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: 'rgba(255,255,255,0.4)',
                      flexShrink: 0,
                    }}
                  >
                    <X size={10} />
                  </button>
                </>
              ) : (
                <>
                  {/* Settings — visible on active tab */}
                  {isActive && onOpenSettings && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSettings(map.id);
                      }}
                      title="Paramètres de la carte"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                        color: 'rgba(139,92,246,0.6)',
                        flexShrink: 0,
                        opacity: isHovered ? 1 : 0.6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#8b5cf6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(139,92,246,0.6)';
                      }}
                    >
                      <Settings size={10} />
                    </button>
                  )}

                  {/* Delete — visible on hover (inactive tabs, only if > 1 map) */}
                  {isHovered && !isActive && maps.length > 1 && onDeleteMap && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(map);
                      }}
                      title="Supprimer cette carte"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                        color: 'rgba(239,68,68,0.7)',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#f87171';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(239,68,68,0.7)';
                      }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Separator + Add button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderLeft: '1px solid var(--color-border-base, rgba(255,255,255,0.08))',
          padding: '0 4px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onAddMap}
          title="Nouvelle carte"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 5,
            border: '1px solid transparent',
            background: 'transparent',
            color: 'var(--color-text-muted, rgba(255,255,255,0.5))',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.18)';
            e.currentTarget.style.color = 'var(--color-primary, #8b5cf6)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted, rgba(255,255,255,0.5))';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
