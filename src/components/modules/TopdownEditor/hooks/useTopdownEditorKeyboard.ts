/**
 * useTopdownEditorKeyboard — raccourcis clavier de TopdownEditor.
 *
 * Shortcuts enregistrés :
 *   Ctrl+Z / Ctrl+Y    → undo / redo
 *   Suppr / Backspace  → supprimer entité survolée ou effacer tuile
 *   Home / 0           → reset zoom 100%
 *   Shift+G            → fit map in view
 *   B E F I G D X Y T → outils + grille + dim + flip + stack
 *   Flèches            → naviguer dans la palette de tuiles
 *
 * Extrait de TopdownEditor.tsx pour isoler la logique clavier.
 */
import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { MapEditorState, MapEditorActions } from './useMapEditor';
import type { MapData } from '@/types/map';

type Editor = MapEditorState & MapEditorActions;

interface UseTopdownEditorKeyboardParams {
  editor: Editor;
  imageCache: Map<string, HTMLImageElement>;
  undo: () => void;
  redo: () => void;
  mapData: MapData;
  removeEntity: (mapId: string, entityId: string) => void;
  fitMapInView: () => void;
}

export function useTopdownEditorKeyboard({
  editor,
  imageCache,
  undo,
  redo,
  mapData,
  removeEntity,
  fitMapInView,
}: UseTopdownEditorKeyboardParams): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si focus dans un input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // ── Undo/Redo ───────────────────────────────────────────────────────────
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
        return;
      }

      // ── Suppr = supprimer entité survolée, sinon effacer tuile ─────────────
      if ((e.key === 'Delete' || e.key === 'Backspace') && editor.hoveredCell) {
        const { cx, cy } = editor.hoveredCell;
        const entityAtCell = mapData._ac_entities.find((ent) => ent.cx === cx && ent.cy === cy);
        if (entityAtCell && editor.selectedMapId) {
          removeEntity(editor.selectedMapId, entityAtCell.id);
        } else {
          editor.eraseCell(cx, cy);
        }
        return;
      }

      // ── Home / 0 = reset zoom 100% ─────────────────────────────────────────
      if (e.key === 'Home' || e.key === '0') {
        editor.setZoom(1);
        editor.setStagePos({ x: 0, y: 0 });
        return;
      }

      // ── Shift+G = fit map in view ──────────────────────────────────────────
      if ((e.key === 'G' || e.key === 'g') && e.shiftKey) {
        fitMapInView();
        return;
      }

      if (e.key === 'b' || e.key === 'B') editor.setActiveTool('paint');
      else if (e.key === 'e' || e.key === 'E') editor.setActiveTool('erase');
      else if (e.key === 'f' || e.key === 'F') editor.setActiveTool('fill');
      else if (e.key === 'i' || e.key === 'I') editor.setActiveTool('eyedropper');
      else if (e.key === 'g' || e.key === 'G') editor.toggleGrid();
      else if (e.key === 'd' || e.key === 'D') editor.toggleDimInactive();
      else if (e.key === 'x' || e.key === 'X') editor.toggleFlipX();
      else if (e.key === 'y' || e.key === 'Y') editor.toggleFlipY();
      else if (e.key === 't' || e.key === 'T') editor.toggleStackMode();
      else if (e.key.startsWith('Arrow')) {
        // Arrow keys — naviguer dans la palette de tuiles (1 cellule à la fois)
        const tile = editor.selectedTile;
        if (!tile || tile.tileW === 0) return;
        const url = tile.asset.url ?? tile.asset.path;
        const { tilesetConfigs } = useSettingsStore.getState();
        const config = tilesetConfigs[url] ?? tilesetConfigs[tile.asset.path];
        if (!config) return;
        const img = imageCache.get(url);
        if (!img) return;
        const stepX = config.tileW + config.spacing;
        const stepY = config.tileH + config.spacing;
        const cols = Math.max(
          1,
          Math.floor((img.naturalWidth - config.margin * 2 + config.spacing) / stepX)
        );
        const rows = Math.max(
          1,
          Math.floor((img.naturalHeight - config.margin * 2 + config.spacing) / stepY)
        );
        let col = Math.round((tile.tileX - config.margin) / stepX);
        let row = Math.round((tile.tileY - config.margin) / stepY);
        if (e.key === 'ArrowRight') col = Math.min(cols - 1, col + 1);
        else if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
        else if (e.key === 'ArrowDown') row = Math.min(rows - 1, row + 1);
        else if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
        e.preventDefault();
        editor.setSelectedTile({
          ...tile,
          tileX: config.margin + col * stepX,
          tileY: config.margin + row * stepY,
          regionCols: 1,
          regionRows: 1,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, imageCache, undo, redo, mapData, removeEntity, fitMapInView]);

  // Correction post-extraction : lire removeEntity depuis le store dans le handler
  // est suffisant (pattern correct — getState() dans handler, hors render).
  // La dépendance `removeEntity` ici est passée en prop stable depuis TopdownEditor.
}
