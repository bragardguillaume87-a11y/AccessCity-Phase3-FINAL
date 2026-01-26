import { useState } from 'react';
import { UploadZone } from './UploadZone';
import { Button } from '@/components/ui/button';
import { ImageIcon, Users as UsersIcon, Palette, Music, Volume2, Mic } from 'lucide-react';

export interface UploadTabProps {
  initialCategory?: string;
}

const CATEGORIES = [
  {
    id: 'backgrounds',
    label: 'Arrière-plans',
    icon: ImageIcon,
    description: 'Décors et fonds de scène',
    isAudio: false
  },
  {
    id: 'characters',
    label: 'Sprites',
    icon: UsersIcon,
    description: 'Personnages et avatars',
    isAudio: false
  },
  {
    id: 'illustrations',
    label: 'Illustrations',
    icon: Palette,
    description: 'Images diverses',
    isAudio: false
  },
  {
    id: 'music',
    label: 'Musique',
    icon: Music,
    description: 'Musiques de fond pour les scènes',
    isAudio: true
  },
  {
    id: 'sfx',
    label: 'Effets sonores',
    icon: Volume2,
    description: 'Bruitages et effets pour dialogues',
    isAudio: true
  },
  {
    id: 'voices',
    label: 'Voix',
    icon: Mic,
    description: 'Voix off et narration',
    isAudio: true
  },
];

/**
 * UploadTab - Onglet dédié à l'upload d'assets
 *
 * Permet de:
 * 1. Choisir la catégorie de destination
 * 2. Upload par drag & drop ou parcourir
 */
export function UploadTab({ initialCategory }: UploadTabProps) {
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory && initialCategory !== 'all' ? initialCategory : 'illustrations'
  );

  return (
    <div className="flex flex-col h-full p-6">
      {/* Category Selector */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2 text-muted-foreground">
          Catégorie de destination
        </p>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <cat.icon className="h-4 w-4 mr-1.5" />
              {cat.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {CATEGORIES.find(c => c.id === selectedCategory)?.description}
        </p>
      </div>

      {/* Upload Zone */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <UploadZone category={selectedCategory} compact={false} />
        </div>
      </div>

      {/* Upload Tips */}
      <div className="mt-4 text-center text-sm text-muted-foreground border-t border-slate-700/50 pt-4">
        <p className="font-medium mb-2">Conseils</p>
        <ul className="text-xs space-y-1">
          {selectedCategory === 'backgrounds' && (
            <li>• Résolution recommandée: 1920x1080 minimum (16:9)</li>
          )}
          {selectedCategory === 'characters' && (
            <li>• Utilisez PNG avec transparence pour les sprites</li>
          )}
          {selectedCategory === 'illustrations' && (
            <li>• Tous formats acceptés (PNG, JPG, WebP, SVG)</li>
          )}
          {selectedCategory === 'music' && (
            <li>• MP3 recommandé pour les musiques de fond (streaming optimisé)</li>
          )}
          {selectedCategory === 'sfx' && (
            <li>• WAV/OGG recommandé pour des effets courts et précis</li>
          )}
          {selectedCategory === 'voices' && (
            <li>• MP3 ou WAV pour les voix off (qualité audio importante)</li>
          )}
          <li>• Taille max: {CATEGORIES.find(c => c.id === selectedCategory)?.isAudio ? '50 Mo' : '10 Mo'} par fichier</li>
        </ul>
      </div>
    </div>
  );
}
