/**
 * AssetMiniPicker — Sélecteur inline de fichiers depuis le manifest d'assets.
 *
 * Usage :
 * - `category="backgrounds"` → grille 3 colonnes avec vignettes 16:9
 * - `category="sfx"` / `category="music"` → liste compacte icône + nom
 *
 * Pas de modal séparé : tout s'affiche directement dans l'inspecteur.
 */
import { useAssets } from '@/hooks/useAssets';
import { useUIStore } from '@/stores/uiStore';

interface Props {
  category: 'backgrounds' | 'sfx' | 'music';
  value: string;
  onChange: (path: string) => void;
}

export function AssetMiniPicker({ category, value, onChange }: Props) {
  const { assets, loading } = useAssets({ category });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-[var(--color-text-muted)] text-xs">
        <span className="animate-spin mr-2">⏳</span>Chargement…
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1.5 py-2">
        <p className="text-[10px] text-[var(--color-text-muted)] italic">
          Aucun fichier disponible pour cette catégorie.
        </p>
        <button
          type="button"
          onClick={() => useUIStore.getState().setActiveModal('assets')}
          className="text-[11px] text-violet-400 hover:text-violet-300 underline transition-colors"
        >
          + Ajouter des assets dans la bibliothèque
        </button>
      </div>
    );
  }

  // ── Backgrounds : grille de vignettes 16:9 ──────────────────────────────────
  if (category === 'backgrounds') {
    return (
      <div className="grid grid-cols-3 gap-1.5 mt-1">
        {assets.map(asset => {
          const assetUrl = asset.url ?? asset.path;
          const selected = assetUrl === value || asset.path === value;
          return (
            <button
              key={asset.path}
              type="button"
              onClick={() => onChange(assetUrl)}
              title={asset.name}
              className={[
                'relative overflow-hidden rounded-md border-2 transition-all',
                selected
                  ? 'border-violet-400 ring-1 ring-violet-400'
                  : 'border-transparent hover:border-white/30',
              ].join(' ')}
              style={{ aspectRatio: '16 / 9' }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${assetUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#1a1a2e',
                }}
              />
              {/* Nom tronqué au survol */}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate leading-tight opacity-0 hover:opacity-100 transition-opacity">
                {asset.name}
              </div>
              {selected && (
                <div className="absolute inset-0 flex items-center justify-center bg-violet-500/20">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Son / Musique : liste compacte ──────────────────────────────────────────
  const icon = category === 'music' ? '🎵' : '🔊';
  return (
    <div className="flex flex-col gap-0.5 mt-1 max-h-40 overflow-y-auto pr-1">
      {assets.map(asset => {
        const assetUrl = asset.url ?? asset.path;
        const selected = assetUrl === value || asset.path === value;
        const name = asset.name ?? asset.path.split('/').pop() ?? asset.path;
        return (
          <button
            key={asset.path}
            type="button"
            onClick={() => onChange(assetUrl)}
            className={[
              'flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-left transition-colors',
              selected
                ? 'bg-violet-900/50 text-violet-300 font-semibold'
                : 'text-[var(--color-text-secondary)] hover:bg-white/5',
            ].join(' ')}
          >
            <span className="flex-shrink-0">{icon}</span>
            <span className="truncate">{name}</span>
            {selected && <span className="ml-auto flex-shrink-0 text-violet-400">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
