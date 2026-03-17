/**
 * SheetView — Vue tileset inline avec zoom + sélection multi-tuiles par glisser.
 *
 * Fonctionnalités :
 * - Zoom molette + boutons +/- (SHEET_MIN_ZOOM / SHEET_MAX_ZOOM)
 * - Sélection multi-tuiles par glisser (rectangle brush, style Unity/Tiled)
 * - Vue "non configuré" : affiche l'image entière + bouton d'import
 *
 * Extrait de TilePalette.tsx pour réduire la taille du fichier principal.
 *
 * @module components/modules/TopdownEditor/SheetView
 */

import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import type { Asset } from '@/types/assets';
import type { SelectedTile, TilesetConfig } from '@/types/tileset';

// ── Constantes zoom ────────────────────────────────────────────────────────────

const SHEET_MIN_ZOOM = 0.5;
const SHEET_MAX_ZOOM = 4;
const SHEET_ZOOM_FACTOR = 1.2;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SheetViewProps {
  asset: Asset;
  config: TilesetConfig | null;
  selectedTile: SelectedTile | null;
  onSelectTile: (tile: SelectedTile | null) => void;
  onSelectWhole: (asset: Asset) => void;
  onSelectSheetRegion: (
    asset: Asset,
    config: TilesetConfig,
    c0: number,
    r0: number,
    c1: number,
    r1: number
  ) => void;
  onOpenConfig: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SheetView({
  asset,
  config,
  selectedTile,
  onSelectWhole,
  onSelectSheetRegion,
  onOpenConfig,
}: SheetViewProps) {
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [sheetZoom, setSheetZoom] = useState(1.0);
  const [dragStart, setDragStart] = useState<{ col: number; row: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ col: number; row: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);
  // Dernière tuile survolée — garde le preview visible même quand la souris quitte la grille
  const [lastCell, setLastCell] = useState<{ col: number; row: number }>({ col: 0, row: 0 });
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const url = asset.url ?? asset.path;

  useEffect(() => {
    setImgSize(null);
    imgRef.current = null;
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      imgRef.current = img;
    };
    img.src = url;
  }, [url]);

  // Zoom initial adaptatif : remplit la largeur du conteneur, tiles visibles à min 2× leur taille native
  useEffect(() => {
    if (!imgSize) {
      setSheetZoom(2.0);
      return;
    }
    const containerW = containerRef.current?.clientWidth ?? 0;
    const fitZoom = containerW > 0 ? (containerW - 12) / imgSize.w : 2.0;
    // Au moins 2x la taille native pour que les tiles 16px soient lisibles (≥ 32px)
    const autoZoom = Math.min(SHEET_MAX_ZOOM, Math.max(2.0, fitZoom));
    setSheetZoom(autoZoom);
  }, [asset.id, imgSize]);

  const zoomIn = () => setSheetZoom((z) => Math.min(SHEET_MAX_ZOOM, z * SHEET_ZOOM_FACTOR));
  const zoomOut = () => setSheetZoom((z) => Math.max(SHEET_MIN_ZOOM, z / SHEET_ZOOM_FACTOR));

  // Draw magnified preview — suit lastCell (persistant même quand la souris quitte la grille)
  useEffect(() => {
    if (!previewCanvasRef.current || !config || !imgRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cell = hoveredCell ?? lastCell;
    const sx = config.margin + cell.col * (config.tileW + config.spacing);
    const sy = config.margin + cell.row * (config.tileH + config.spacing);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      imgRef.current,
      sx,
      sy,
      config.tileW,
      config.tileH,
      0,
      0,
      config.tileW * 3,
      config.tileH * 3
    );
  }, [hoveredCell, lastCell, config]);

  // Zoom molette supprimé — difficile à manipuler sur de grands tilesets.
  // Utiliser les boutons +/- dans la barre d'outils.

  const isWholeTileSelected = selectedTile?.asset.id === asset.id && selectedTile.tileW === 0;

  if (!config) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
        <div
          style={{
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px',
            borderRadius: 6,
            background: 'rgba(251,146,60,0.1)',
            border: '1px solid rgba(251,146,60,0.25)',
          }}
        >
          <span style={{ fontSize: 14 }}>💡</span>
          <p style={{ margin: 0, fontSize: 11, color: '#fb923c', lineHeight: 1.3 }}>
            Clique sur <strong>⚙</strong> pour découper ce tileset en tuiles
          </p>
        </div>
        <button
          onClick={() => onSelectWhole(asset)}
          style={{
            display: 'block',
            width: '100%',
            padding: 0,
            border: isWholeTileSelected
              ? '2px solid var(--color-primary)'
              : '2px solid transparent',
            borderRadius: 4,
            cursor: 'pointer',
            background: 'transparent',
          }}
        >
          <img
            src={url}
            alt={asset.name}
            style={{ width: '100%', imageRendering: 'pixelated', display: 'block' }}
            draggable={false}
          />
        </button>
        <button
          onClick={onOpenConfig}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '6px 0',
            fontSize: 12,
            fontWeight: 600,
            border: '1px dashed var(--color-primary)',
            borderRadius: 6,
            background: 'var(--color-primary-08)',
            color: 'var(--color-primary)',
            cursor: 'pointer',
          }}
        >
          ⚙ Configurer la grille de tuiles
        </button>
      </div>
    );
  }

  const innerW = imgSize ? imgSize.w - config.margin * 2 : 0;
  const innerH = imgSize ? imgSize.h - config.margin * 2 : 0;
  const cols = Math.max(0, Math.floor((innerW + config.spacing) / (config.tileW + config.spacing)));
  const rows = Math.max(0, Math.floor((innerH + config.spacing) / (config.tileH + config.spacing)));

  const selC0 = dragStart && dragCurrent ? Math.min(dragStart.col, dragCurrent.col) : -1;
  const selC1 = dragStart && dragCurrent ? Math.max(dragStart.col, dragCurrent.col) : -1;
  const selR0 = dragStart && dragCurrent ? Math.min(dragStart.row, dragCurrent.row) : -1;
  const selR1 = dragStart && dragCurrent ? Math.max(dragStart.row, dragCurrent.row) : -1;

  const isCellInDrag = (c: number, r: number) =>
    dragStart !== null && c >= selC0 && c <= selC1 && r >= selR0 && r <= selR1;

  const isCellSelected = (c: number, r: number) => {
    if (!selectedTile || selectedTile.asset.id !== asset.id || selectedTile.tileW === 0)
      return false;
    const c0 = (selectedTile.tileX - config.margin) / (config.tileW + config.spacing);
    const r0 = (selectedTile.tileY - config.margin) / (config.tileH + config.spacing);
    const rc = selectedTile.regionCols ?? 1;
    const rr = selectedTile.regionRows ?? 1;
    const inRegion = c >= c0 && c < c0 + rc && r >= r0 && r < r0 + rr;
    const expectedX = config.margin + c * (config.tileW + config.spacing);
    const expectedY = config.margin + r * (config.tileH + config.spacing);
    const matchExact = selectedTile.tileX === expectedX && selectedTile.tileY === expectedY;
    return inRegion || matchExact;
  };

  const handleCellMouseDown = (c: number, r: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDragStart({ col: c, row: r });
    setDragCurrent({ col: c, row: r });
  };

  const handleCellMouseEnter = (c: number, r: number) => {
    if (dragStart !== null) setDragCurrent({ col: c, row: r });
    setLastCell({ col: c, row: r });
  };

  const handleCellMouseUp = (c: number, r: number) => {
    if (dragStart) {
      onSelectSheetRegion(asset, config, dragStart.col, dragStart.row, c, r);
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxHeight: 'clamp(200px, 45vh, 460px)',
      }}
    >
      {/* Zoom toolbar */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderBottom: '1px solid var(--color-border-base)',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', flex: 1 }}>
          {imgSize && cols > 0 ? `${cols}×${rows} (${config.tileW}×${config.tileH}px)` : ''}
        </span>
        <button
          onClick={zoomOut}
          title="Zoom -"
          style={zoomBtnStyle}
          disabled={sheetZoom <= SHEET_MIN_ZOOM}
        >
          <ZoomOut size={12} />
        </button>
        <button
          onClick={() => setSheetZoom(1)}
          title="Zoom 100%"
          style={{ ...zoomBtnStyle, minWidth: 38, fontSize: 11 }}
        >
          {Math.round(sheetZoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          title="Zoom +"
          style={zoomBtnStyle}
          disabled={sheetZoom >= SHEET_MAX_ZOOM}
        >
          <ZoomIn size={12} />
        </button>
      </div>

      {/* Scrollable sheet container */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'auto', padding: 6 }}>
        {imgSize && cols > 0 && rows > 0 ? (
          /* Outer div: reserves the correct zoomed space for scrolling */
          <div
            style={{
              width: Math.round(imgSize.w * sheetZoom),
              height: Math.round(imgSize.h * sheetZoom),
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {/* Inner div: natural-pixel size, scaled uniformly by CSS transform.
                This eliminates accumulated floating-point drift between grid cells
                because the browser applies one uniform scale to the whole subtree. */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: imgSize.w,
                height: imgSize.h,
                transformOrigin: '0 0',
                transform: `scale(${sheetZoom})`,
                userSelect: 'none',
              }}
              onMouseLeave={() => {
                if (dragStart) {
                  setDragStart(null);
                  setDragCurrent(null);
                }
              }}
            >
              <img
                src={url}
                alt={asset.name}
                style={{
                  display: 'block',
                  imageRendering: 'pixelated',
                  width: imgSize.w,
                  height: imgSize.h,
                }}
                draggable={false}
              />
              {/* Grid overlays at natural pixel coordinates — no zoom multiplication */}
              <div
                style={{
                  position: 'absolute',
                  top: config.margin,
                  left: config.margin,
                  pointerEvents: 'none',
                }}
              >
                {Array.from({ length: rows }).map((_, r) =>
                  Array.from({ length: cols }).map((_, c) => {
                    const inDrag = isCellInDrag(c, r);
                    const selected = !inDrag && isCellSelected(c, r);
                    const hovered =
                      !inDrag && !selected && hoveredCell?.col === c && hoveredCell?.row === r;
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseDown={(e) => handleCellMouseDown(c, r, e)}
                        onMouseEnter={() => {
                          handleCellMouseEnter(c, r);
                          setHoveredCell({ col: c, row: r });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        onMouseUp={() => handleCellMouseUp(c, r)}
                        style={{
                          position: 'absolute',
                          left: c * (config.tileW + config.spacing),
                          top: r * (config.tileH + config.spacing),
                          width: config.tileW,
                          height: config.tileH,
                          boxSizing: 'border-box',
                          border: selected
                            ? `${2 / sheetZoom}px solid var(--color-primary)`
                            : inDrag
                              ? `${2 / sheetZoom}px solid var(--color-primary-90)`
                              : hovered
                                ? `${1 / sheetZoom}px solid rgba(255,255,255,0.85)`
                                : `${1 / sheetZoom}px solid rgba(255,255,255,0.50)`,
                          background: selected
                            ? 'var(--color-primary-28)'
                            : inDrag
                              ? 'var(--color-primary-22)'
                              : hovered
                                ? 'rgba(255,255,255,0.10)'
                                : 'transparent',
                          cursor: 'crosshair',
                          pointerEvents: 'auto',
                          transition: inDrag ? 'none' : 'background 0.08s',
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
              Chargement...
            </p>
          </div>
        )}
      </div>

      {/* Magnified tile preview — toujours visible, affiche la dernière tuile survolée */}
      {config && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 8px',
            borderTop: '1px solid var(--color-border-base)',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <canvas
            ref={previewCanvasRef}
            width={config.tileW * 3}
            height={config.tileH * 3}
            style={{
              imageRendering: 'pixelated',
              border: '1px solid var(--color-border-base)',
              borderRadius: 3,
              flexShrink: 0,
              maxWidth: 96,
              maxHeight: 96,
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            col {(hoveredCell ?? lastCell).col}
            <br />
            row {(hoveredCell ?? lastCell).row}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────────

const zoomBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: 4,
  border: '1px solid var(--color-border-base)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  padding: 0,
};
