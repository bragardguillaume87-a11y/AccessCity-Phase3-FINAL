import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Users as UsersIcon,
  Palette,
  Sparkles,
  AlertCircle,
  MapPin
} from 'lucide-react';

/**
 * AssetLightbox - Full-screen asset viewer with navigation
 *
 * Features:
 * - Large image display
 * - Keyboard navigation (←/→ for prev/next, ESC to close)
 * - Usage information display
 * - Click backdrop to close
 *
 * @param {Object} props
 * @param {Object} props.asset - Asset to display
 * @param {Function} props.onClose - Callback to close lightbox
 * @param {Function} props.onNavigate - Callback for navigation ('prev' | 'next')
 * @param {Object} props.usage - Usage information { total, scenes, characters, sceneCount, characterCount }
 */
export function AssetLightbox({ asset, onClose, onNavigate, usage }) {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation - Previous */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate('prev');
        }}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      {/* Navigation - Next */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate('next');
        }}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Image & Info */}
      <div
        className="max-w-5xl max-h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <img
          src={asset.path}
          alt={asset.name}
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Info Panel */}
        <Card className="mt-6 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">{asset.name}</h3>
                <div className="flex items-center gap-3">
                  {/* Category Badge */}
                  <Badge variant="outline">
                    {asset.category === 'backgrounds' && <ImageIcon className="h-3 w-3 mr-1" />}
                    {asset.category === 'characters' && <UsersIcon className="h-3 w-3 mr-1" />}
                    {asset.category === 'illustrations' && <Palette className="h-3 w-3 mr-1" />}
                    {asset.category}
                  </Badge>

                  {/* Usage Badge */}
                  {usage ? (
                    <Badge variant="default">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Utilisé dans {usage.total} élément{usage.total > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Non utilisé
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Usage Details */}
            {usage && (
              <div className="space-y-3">
                <Separator />
                <div className="grid grid-cols-2 gap-6">
                  {/* Scenes */}
                  {usage.sceneCount > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Scènes ({usage.sceneCount})
                      </h4>
                      <ul className="space-y-1">
                        {usage.scenes.map((scene, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {scene}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Characters */}
                  {usage.characterCount > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <UsersIcon className="h-4 w-4" />
                        Personnages ({usage.characterCount})
                      </h4>
                      <ul className="space-y-1">
                        {usage.characters.map((char, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {char}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm flex items-center gap-4">
        <span>← → pour naviguer</span>
        <span>•</span>
        <span>ESC pour fermer</span>
      </div>
    </div>
  );
}

AssetLightbox.propTypes = {
  asset: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  usage: PropTypes.shape({
    total: PropTypes.number.isRequired,
    scenes: PropTypes.array.isRequired,
    characters: PropTypes.array.isRequired,
    sceneCount: PropTypes.number.isRequired,
    characterCount: PropTypes.number.isRequired
  })
};
