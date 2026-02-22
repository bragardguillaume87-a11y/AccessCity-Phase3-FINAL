import { useEffect, useState } from 'react';
import { useAssets, getRecentAssets, addToRecentAssets } from '@/hooks/useAssets';
import { Palette, Search, Clock, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import EncouragingMessage from './EncouragingMessage';

interface StepAppearanceProps {
  currentSprite: string;
  characterName: string;
  onSelectSprite: (path: string) => void;
  onValidChange: (isValid: boolean) => void;
}

/**
 * StepAppearance - Step 2: Choose default sprite
 *
 * Kid-friendly sprite selector with large thumbnails (100px),
 * visual feedback, and encouraging messages.
 */
export function StepAppearance({
  currentSprite,
  characterName,
  onSelectSprite,
  onValidChange
}: StepAppearanceProps) {
  const { assets: characterAssets, loading: loadingChars } = useAssets({ category: 'characters' });
  const { assets: allAssets, loading: loadingAll, error } = useAssets({});

  const hasCharacterAssets = characterAssets.length > 0;
  const assets = hasCharacterAssets ? characterAssets : allAssets;
  const loading = loadingChars || loadingAll;

  const [recentAssets, setRecentAssets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Load recent assets
  useEffect(() => {
    const recent = getRecentAssets('character-sprites', 6);
    setRecentAssets(recent);
  }, []);

  // Validation - sprite selected
  const isValid = currentSprite.length > 0;

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  // Filter assets
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (assetPath: string) => {
    onSelectSprite(assetPath);
    const newRecent = addToRecentAssets('character-sprites', assetPath, 6);
    setRecentAssets(newRecent);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-pulse">
        <div className="w-24 h-24 bg-muted rounded-xl mb-4" />
        <p className="text-muted-foreground">Chargement des images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive bg-destructive/10 rounded-xl">
        Oups ! Une erreur s'est produite : {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-step-slide">
      {/* Header with character name */}
      <div className="flex items-center gap-3">
        <Palette className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-semibold">
          Choisis l'apparence de <span className="text-primary">{characterName}</span>
        </h3>
      </div>

      {/* Current selection preview */}
      {currentSprite && (
        <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-xl border border-primary/30 animate-bounce-in">
          <img
            src={currentSprite}
            alt={characterName}
            className="w-20 h-20 object-contain bg-card rounded-lg"
          />
          <div className="flex-1">
            <p className="font-medium text-primary">Image sélectionnée !</p>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {currentSprite.split('/').pop()}
            </p>
          </div>
          <Sparkles className="h-6 w-6 text-primary animate-sparkle" />
        </div>
      )}

      {/* Search toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
          {showSearch ? 'Masquer la recherche' : 'Rechercher une image'}
        </button>
      </div>

      {showSearch && (
        <Input
          type="text"
          placeholder="Tape le nom d'une image..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 text-base"
        />
      )}

      {/* Recent assets */}
      {!searchTerm && recentAssets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
            <Clock className="h-4 w-4" />
            Images récentes
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {recentAssets.map((assetPath, idx) => (
              <SpriteCard
                key={idx}
                path={assetPath}
                isSelected={assetPath === currentSprite}
                onClick={() => handleSelect(assetPath)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All assets grid */}
      <div>
        <div className="text-sm font-medium text-muted-foreground mb-3">
          {searchTerm ? `Résultats (${filteredAssets.length})` : 'Toutes les images'}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar-slate">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              Aucune image trouvée
            </div>
          ) : (
            filteredAssets.map((asset, idx) => (
              <SpriteCard
                key={idx}
                path={asset.path}
                name={asset.name}
                isSelected={asset.path === currentSprite}
                onClick={() => handleSelect(asset.path)}
              />
            ))
          )}
        </div>
      </div>

      {/* Helper message */}
      {!isValid && (
        <EncouragingMessage
          type="info"
          message="Clique sur une image pour la sélectionner !"
        />
      )}
    </div>
  );
}

interface SpriteCardProps {
  path: string;
  name?: string;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * SpriteCard - Large touch-friendly sprite thumbnail (100px)
 */
function SpriteCard({ path, name, isSelected, onClick }: SpriteCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden transition-all duration-200 touch-target-large",
        "border-2 bg-card hover:scale-105 active:scale-95",
        isSelected
          ? "border-primary ring-4 ring-primary/30 animate-gentle-pulse"
          : "border-border hover:border-primary/50"
      )}
      title={name || path}
    >
      <img
        src={path}
        alt={name || path}
        className="w-full h-full object-contain p-2"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%232f3436" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23a3a3a3">?</text></svg>';
        }}
      />
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-sm text-primary-foreground animate-bounce-in">
          ✓
        </div>
      )}
    </button>
  );
}

export default StepAppearance;
