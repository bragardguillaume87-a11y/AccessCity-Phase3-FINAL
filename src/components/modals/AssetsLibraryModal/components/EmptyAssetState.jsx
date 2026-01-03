import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles, BookOpen } from 'lucide-react';

const CATEGORY_ILLUSTRATIONS = {
  background: {
    emoji: '🏞️',
    title: 'Aucun arrière-plan pour le moment',
    description: 'Les arrière-plans donnent vie à vos scènes. Uploadez vos premières images !',
  },
  character: {
    emoji: '🎭',
    title: 'Aucun personnage pour le moment',
    description: 'Créez votre premier personnage pour commencer votre histoire interactive.',
  },
  illustration: {
    emoji: '🎨',
    title: 'Aucune illustration pour le moment',
    description: 'Ajoutez des illustrations pour enrichir votre narration visuelle.',
  },
  all: {
    emoji: '📦',
    title: 'Votre bibliothèque est vide',
    description: 'Commencez par uploader vos premières ressources ou explorez les exemples.',
  },
};

export function EmptyAssetState({ category = 'all', onUploadClick, onLoadSamples }) {
  const config = CATEGORY_ILLUSTRATIONS[category] || CATEGORY_ILLUSTRATIONS.all;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {/* Emoji illustration */}
      <div className="text-8xl mb-6 animate-bounce-slow">
        {config.emoji}
      </div>

      {/* Texte */}
      <h3 className="text-2xl font-bold text-white mb-2">
        {config.title}
      </h3>
      <p className="text-slate-400 max-w-md mb-8">
        {config.description}
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant="gaming-primary"
          size="lg"
          onClick={onUploadClick}
          className="shadow-xl"
        >
          <Upload className="h-5 w-5" />
          Uploader mes fichiers
        </Button>

        {onLoadSamples && (
          <Button
            variant="gaming-accent"
            size="lg"
            onClick={onLoadSamples}
          >
            <Sparkles className="h-5 w-5" />
            Charger des exemples
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          onClick={() => window.open('https://docs.accesscity.com/assets', '_blank')}
        >
          <BookOpen className="h-5 w-5" />
          En savoir plus
        </Button>
      </div>

      {/* Hints */}
      <div className="mt-12 text-xs text-slate-500 space-y-1">
        <p>💡 Formats supportés: PNG, JPG, SVG, GIF, WebP</p>
        <p>💡 Taille max: 10MB par fichier</p>
        <p>💡 Vous pouvez glisser-déposer plusieurs fichiers à la fois</p>
      </div>
    </div>
  );
}
