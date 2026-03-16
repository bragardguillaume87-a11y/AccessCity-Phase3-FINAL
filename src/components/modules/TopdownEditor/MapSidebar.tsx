/**
 * MapSidebar — Liste des cartes du projet + création + paramètres
 *
 * Lit mapsStore.maps, permet de sélectionner / créer / supprimer / reconfigurer une carte.
 * Double-clic = renommer inline. Bouton ⚙ = MapSettingsDialog.
 *
 * @module components/modules/TopdownEditor/MapSidebar
 */

import { useState, useRef } from 'react';
import { Plus, Trash2, Map, Settings } from 'lucide-react';
import { useMapsStore } from '@/stores/mapsStore';
import MapSettingsDialog from './MapSettingsDialog';
import type { MapMetadata } from '@/types/map';

interface MapSidebarProps {
  selectedMapId: string | null;
  onSelectMap: (mapId: string) => void;
}

export default function MapSidebar({ selectedMapId, onSelectMap }: MapSidebarProps) {
  const maps = useMapsStore((s) => s.maps);
  const addMap = useMapsStore((s) => s.addMap);
  const deleteMap = useMapsStore((s) => s.deleteMap);
  const updateMapMetadata = useMapsStore((s) => s.updateMapMetadata);

  const [newMapName, setNewMapName] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Inline rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Settings dialog
  const [settingsMap, setSettingsMap] = useState<MapMetadata | null>(null);

  // Delete confirmation — 2-click pattern
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleAddMap() {
    if (showInput && newMapName.trim()) {
      const id = addMap(newMapName.trim());
      onSelectMap(id);
      setNewMapName('');
      setShowInput(false);
    } else {
      setShowInput(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAddMap();
    if (e.key === 'Escape') {
      setShowInput(false);
      setNewMapName('');
    }
  }

  function handleDeleteClick(e: React.MouseEvent, map: MapMetadata) {
    e.stopPropagation();
    if (confirmDeleteId === map.id) {
      // Second click — confirmed
      if (selectedMapId === map.id) onSelectMap('');
      deleteMap(map.id);
      setConfirmDeleteId(null);
    } else {
      // First click — ask confirmation
      setConfirmDeleteId(map.id);
    }
  }

  function cancelDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmDeleteId(null);
  }

  // Inline rename
  function startRename(map: MapMetadata, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingId(map.id);
    setRenameValue(map.name);
    setTimeout(() => renameInputRef.current?.select(), 0);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      updateMapMetadata(renamingId, { name: renameValue.trim() });
    }
    setRenamingId(null);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setRenamingId(null);
    e.stopPropagation();
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cartes
          </span>
          <button
            onClick={handleAddMap}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Nouvelle carte"
            aria-label="Nouvelle carte"
          >
            <Plus size={14} style={{ color: 'var(--color-primary)' }} />
          </button>
        </div>

        {/* New map input */}
        {showInput && (
          <div className="px-2 py-1.5 border-b border-border flex-shrink-0">
            <input
              autoFocus
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newMapName.trim()) setShowInput(false);
              }}
              placeholder="Nom de la carte…"
              className="w-full bg-white/5 border border-border rounded px-2 py-1 text-xs outline-none focus:border-purple-500"
              style={{ color: 'var(--color-text-base)' }}
            />
          </div>
        )}

        {/* Map list */}
        <div className="flex-1 overflow-y-auto">
          {maps.length === 0 ? (
            <div
              style={{
                padding: '20px 12px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 32 }}>🗺️</span>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                }}
              >
                Aucune carte
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                Crée ta première carte pour commencer à dessiner
              </p>
              <button
                onClick={handleAddMap}
                className="transition-all hover:-translate-y-0.5 active:scale-95"
                style={{
                  marginTop: 4,
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    'linear-gradient(135deg, var(--color-primary), var(--color-primary-70))',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px var(--color-primary-35)',
                }}
              >
                + Créer une carte
              </button>
            </div>
          ) : (
            maps.map((map) => {
              const isActive = map.id === selectedMapId;
              const isRenaming = renamingId === map.id;
              return (
                <div
                  key={map.id}
                  onClick={() => {
                    if (!isRenaming) {
                      onSelectMap(map.id);
                      setConfirmDeleteId(null);
                    }
                  }}
                  onDoubleClick={(e) => startRename(map, e)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left group transition-colors cursor-pointer"
                  style={{
                    background: isActive ? 'var(--color-primary-15)' : 'transparent',
                    borderLeft: isActive
                      ? '2px solid var(--color-primary)'
                      : '2px solid transparent',
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  title="Double-clic pour renommer"
                >
                  <Map
                    size={12}
                    style={{
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      flexShrink: 0,
                    }}
                  />

                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={handleRenameKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        background: 'var(--color-bg-base)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: 3,
                        color: 'var(--color-text-base)',
                        padding: '1px 4px',
                        outline: 'none',
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 text-xs truncate"
                      style={{
                        color: isActive ? 'var(--color-text-base)' : 'var(--color-text-secondary)',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      {map.name}
                    </span>
                  )}

                  <span
                    className="text-xs flex-shrink-0 group-hover:hidden"
                    style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}
                  >
                    {map.widthTiles}×{map.heightTiles}
                  </span>

                  {confirmDeleteId === map.id ? (
                    /* Confirmation inline — replaces settings + delete icons */
                    <>
                      <button
                        onClick={(e) => handleDeleteClick(e, map)}
                        className="p-0.5 rounded transition-all text-xs font-semibold"
                        title="Confirmer la suppression"
                        style={{ color: 'var(--color-danger)', fontSize: 10 }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="p-0.5 rounded transition-all text-xs"
                        title="Annuler"
                        style={{ color: 'var(--color-text-secondary)', fontSize: 10 }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      {/* ⚙ settings button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSettingsMap(map);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all"
                        title="Paramètres de la carte"
                        aria-label="Paramètres de la carte"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <Settings size={11} />
                      </button>

                      {/* 🗑 delete button — 1st click → confirmation */}
                      <button
                        onClick={(e) => handleDeleteClick(e, map)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all"
                        title="Supprimer cette carte"
                        aria-label="Supprimer cette carte"
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Settings dialog — portal via state */}
      {settingsMap && <MapSettingsDialog map={settingsMap} onClose={() => setSettingsMap(null)} />}
    </>
  );
}
