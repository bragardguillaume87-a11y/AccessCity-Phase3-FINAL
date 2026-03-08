/**
 * TilePalette — Grille de sélection de tuiles (assets images)
 *
 * Affiche les assets de catégorie 'tilesets' (ou toutes les images si vide).
 * Utilise useAssets() existant — fonctionne en Tauri et web.
 * asset.url est utilisé pour l'affichage (règle tauri-patterns.md).
 *
 * Pour les layers collision et triggers : palette symbolique (pas d'image).
 *
 * @module components/modules/TopdownEditor/TilePalette
 */

import { useAssets } from '@/hooks/useAssets';
import type { Asset } from '@/types/assets';
import type { LayerType } from '@/types/map';

const SYMBOL_TILES = {
  collision: { emoji: '🟥', label: 'Solide', description: 'Zone de collision — le joueur ne peut pas passer' },
  triggers: { emoji: '🟩', label: 'Zone trigger', description: 'Déclenche un dialogue ou une transition de carte' },
};

interface TilePaletteProps {
  activeLayer: LayerType;
  selectedTileAsset: Asset | null;
  onSelectTile: (asset: Asset | null) => void;
}

export default function TilePalette({ activeLayer, selectedTileAsset, onSelectTile }: TilePaletteProps) {
  const { assets } = useAssets();

  // Filter image assets for the tiles layer
  const tileAssets = assets.filter(a =>
    a.category === 'tilesets' ||
    (a.category !== 'audio' && (a.type?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.path)))
  );

  // ── Collision / Trigger layers : symbol palette ───────────────────────────
  if (activeLayer !== 'tiles') {
    const info = SYMBOL_TILES[activeLayer as 'collision' | 'triggers'];
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 border-b border-border flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Palette
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-3 text-center">
          <span style={{ fontSize: 40 }}>{info.emoji}</span>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>{info.label}</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{info.description}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Cliquez sur la carte pour peindre
          </p>
        </div>
      </div>
    );
  }

  // ── Tiles layer : image grid ──────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          Tuiles ({tileAssets.length})
        </p>
      </div>

      {tileAssets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3 text-center">
          <span style={{ fontSize: 32 }}>🖼️</span>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Aucune image dans la bibliothèque.<br />
            Importez des tilesets via la bibliothèque d'assets.
          </p>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto p-2"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, alignContent: 'start' }}
        >
          {tileAssets.map(asset => {
            const url = asset.url ?? asset.path;
            const isSelected = selectedTileAsset?.id === asset.id;
            return (
              <button
                key={asset.id}
                onClick={() => onSelectTile(isSelected ? null : asset)}
                title={asset.name}
                aria-label={asset.name}
                aria-pressed={isSelected}
                style={{
                  aspectRatio: '1',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                  outline: isSelected ? '1px solid rgba(139,92,246,0.5)' : 'none',
                  background: 'rgba(255,255,255,0.05)',
                  transition: 'border-color 0.1s, transform 0.1s',
                  transform: isSelected ? 'scale(0.93)' : 'scale(1)',
                  position: 'relative',
                }}
              >
                <img
                  src={url}
                  alt={asset.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', imageRendering: 'pixelated' }}
                  loading="lazy"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
