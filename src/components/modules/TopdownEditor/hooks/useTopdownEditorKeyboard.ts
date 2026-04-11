/**
 * useTopdownEditorKeyboard — raccourcis clavier de TopdownEditor.
 *
 * Shortcuts enregistrés :
 *   Ctrl+Z / Ctrl+Y    → undo / redo
 *   Ctrl+A             → tout sélectionner (outil sélection, couche tuiles)
 *   Ctrl+C             → copier la sélection de tuiles
 *   Ctrl+X             → couper la sélection de tuiles
 *   Ctrl+D             → dupliquer la sélection (+2, +2)
 *   Ctrl+V             → coller les tuiles à la position du curseur
 *   Suppr / Backspace  → efface sélection ou entité survolée ou tuile
 *   Escape             → désélectionner
 *   Home / 0           → reset zoom 100%
 *   Shift+G            → fit map in view
 *   1 / 2 / 3 …        → changer de couche tuile (index 0/1/2…)
 *   S B E F I G D X Y T → outils + grille + dim + flip + stack
 *   Flèches            → naviguer dans la palette de tuiles
 *
 * Extrait de TopdownEditor.tsx pour isoler la logique clavier.
 */
import { useEffect } from 'react';
import { toast } from 'sonner';
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
  /** Rect de sélection actif — pour Delete-in-selection et Escape */
  selectionRect?: { cx: number; cy: number; cw: number; ch: number } | null;
  onClearSelection?: () => void;
  /** Appelé après un Ctrl+V réussi avec le rect collé */
  onSelectionChange?: (rect: { cx: number; cy: number; cw: number; ch: number } | null) => void;
}

export function useTopdownEditorKeyboard({
  editor,
  imageCache,
  undo,
  redo,
  mapData,
  removeEntity,
  fitMapInView,
  selectionRect,
  onClearSelection,
  onSelectionChange,
}: UseTopdownEditorKeyboardParams): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si focus dans un input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // ── Ctrl+A = tout sélectionner (couche tuiles uniquement) ───────────────
      if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (editor.activeLayer === 'tiles') {
          const ts = mapData.__gridSize;
          const gridW = Math.floor(mapData.pxWid / ts);
          const gridH = Math.floor(mapData.pxHei / ts);
          editor.setActiveTool('selection');
          onSelectionChange?.({ cx: 0, cy: 0, cw: gridW, ch: gridH });
        }
        return;
      }

      // ── Copier/Couper/Coller/Dupliquer sélection tuiles ────────────────────
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && selectionRect) {
        e.preventDefault();
        editor.copySelection(selectionRect);
        const count = selectionRect.cw * selectionRect.ch;
        toast.success(`${count} tuile${count > 1 ? 's' : ''} copiée${count > 1 ? 's' : ''}`, {
          duration: 1500,
        });
        return;
      }
      if (e.ctrlKey && (e.key === 'x' || e.key === 'X') && selectionRect) {
        e.preventDefault();
        editor.copySelection(selectionRect);
        editor.eraseSelection(selectionRect);
        const count = selectionRect.cw * selectionRect.ch;
        onClearSelection?.();
        toast.success(`${count} tuile${count > 1 ? 's' : ''} coupée${count > 1 ? 's' : ''}`, {
          duration: 1500,
        });
        return;
      }
      if (e.ctrlKey && (e.key === 'd' || e.key === 'D') && selectionRect) {
        e.preventDefault();
        editor.copySelection(selectionRect);
        // Coller avec un décalage de 2 tuiles en bas-droit
        const toCx = selectionRect.cx + 2;
        const toCy = selectionRect.cy + 2;
        const pasted = editor.pasteSelection(toCx, toCy);
        if (pasted) {
          onSelectionChange?.(pasted);
          toast.success('Dupliqué', { duration: 1000 });
        }
        return;
      }
      if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        const target = editor.hoveredCell ?? { cx: 0, cy: 0 };
        const pasted = editor.pasteSelection(target.cx, target.cy);
        if (pasted) {
          onSelectionChange?.(pasted);
          toast.success('Collé', { description: `${target.cx}, ${target.cy}`, duration: 1200 });
        }
        return;
      }

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

      // ── Escape = désélectionner ────────────────────────────────────────────
      if (e.key === 'Escape') {
        if (editor.activeTool === 'selection' && selectionRect) {
          onClearSelection?.();
        }
        return;
      }

      // ── Suppr = efface la sélection (outil sélection) sinon entité / tuile ─
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editor.activeTool === 'selection' && selectionRect) {
          editor.eraseSelection(selectionRect);
          onClearSelection?.();
          return;
        }
        if (editor.hoveredCell) {
          const { cx, cy } = editor.hoveredCell;
          const entityAtCell = mapData._ac_entities.find((ent) => ent.cx === cx && ent.cy === cy);
          if (entityAtCell && editor.selectedMapId) {
            removeEntity(editor.selectedMapId, entityAtCell.id);
          } else {
            editor.eraseCell(cx, cy);
          }
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

      // ── 1/2/3… = changer de couche tuile ──────────────────────────────────
      if (!e.ctrlKey && !e.shiftKey && !e.altKey && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const tileLayers = mapData.layerInstances.filter((l) => l.__type === 'tiles');
        if (idx < tileLayers.length) {
          if (editor.activeLayer !== 'tiles') editor.setActiveLayer('tiles');
          editor.setActiveTileLayerIndex(idx);
        }
        return;
      }

      if (e.key === 's' || e.key === 'S') editor.setActiveTool('selection');
      else if (e.key === 'b' || e.key === 'B') editor.setActiveTool('paint');
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
  }, [
    editor,
    imageCache,
    undo,
    redo,
    mapData,
    removeEntity,
    fitMapInView,
    selectionRect,
    onClearSelection,
    onSelectionChange,
  ]);
}
