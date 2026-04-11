import { useCallback } from 'react';
import type { Asset } from '@/types/assets';
import type { SelectedTile, TilesetConfig } from '@/types/tileset';

/**
 * useTileSelection — Callbacks de sélection de tuile pour TilePalette.
 *
 * Encapsule deux patterns de sélection :
 * - `selectSheetRegion` : sélection multi-tuiles par glisser (rectangle brush)
 * - `selectWholeTile`   : sélection d'une tuile entière (assets sans grille)
 *
 * @param onSelectTile - Callback appelé avec la tuile sélectionnée
 */
export function useTileSelection(onSelectTile: (tile: SelectedTile) => void) {
  const selectSheetRegion = useCallback(
    (
      asset: Asset,
      config: TilesetConfig,
      colStart: number,
      rowStart: number,
      colEnd: number,
      rowEnd: number
    ) => {
      const c0 = Math.min(colStart, colEnd);
      const c1 = Math.max(colStart, colEnd);
      const r0 = Math.min(rowStart, rowEnd);
      const r1 = Math.max(rowStart, rowEnd);
      const tileX = config.margin + c0 * (config.tileW + config.spacing);
      const tileY = config.margin + r0 * (config.tileH + config.spacing);
      const tile: SelectedTile = {
        asset,
        tileX,
        tileY,
        tileW: config.tileW,
        tileH: config.tileH,
        regionCols: c1 - c0 + 1,
        regionRows: r1 - r0 + 1,
        tileStepX: config.tileW + config.spacing,
        tileStepY: config.tileH + config.spacing,
      };
      onSelectTile(tile);
    },
    [onSelectTile]
  );

  const selectWholeTile = useCallback(
    (asset: Asset) => {
      onSelectTile({ asset, tileX: 0, tileY: 0, tileW: 0, tileH: 0 });
    },
    [onSelectTile]
  );

  return { selectSheetRegion, selectWholeTile };
}
